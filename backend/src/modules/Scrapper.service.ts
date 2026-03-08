import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { ScrapedSource } from '../entities/scraped-source.entity';
import {
  Event,
  EventStatus,
  EventType,
  EventSource,
  LocationType,
} from '../events/entities/event.entity';
import { TicketType, Currency } from '../tickets/entities/ticket-type.entity';
import { AiExtractorService, ExtractedEvent } from './AI.extractor.service';
import { ConfigService } from '@nestjs/config';

const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_PAGE_SIZE_BYTES = 3 * 1024 * 1024; // 3 MB

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);

  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(TicketType)
    private ticketTypeRepository: Repository<TicketType>,
    @InjectRepository(ScrapedSource)
    private sourceRepository: Repository<ScrapedSource>,
    private aiExtractor: AiExtractorService,
    private configService: ConfigService,
  ) {}

  // ─── Main Entry ───────────────────────────────────────────────────────────

  async scrapeSource(source: ScrapedSource): Promise<void> {
    this.logger.log(`Scraping: ${source.url}`);

    const { rawText, imageUrls } = await this.fetchPage(source.url);
    const result = await this.aiExtractor.extractEvents(rawText, imageUrls);

    if (!result.isEventStore) {
      this.logger.debug(`${source.url} is not an event store — skipping`);
      await this.sourceRepository.update(source.id, { isEventStore: false });
      return;
    }

    await this.sourceRepository.update(source.id, { isEventStore: true });

    for (const extracted of result.events) {
      try {
        await this.upsertEvent(extracted, source);
      } catch (err: any) {
        this.logger.warn(
          `Failed to save event "${extracted.title}" from ${source.url}: ${err?.message}`,
        );
      }
    }

    this.logger.log(
      `Scraped ${result.events.length} event(s) from ${source.url}`,
    );
  }

  // ─── Page Fetcher ─────────────────────────────────────────────────────────

  private async fetchPage(
    url: string,
  ): Promise<{ rawText: string; imageUrls: string[] }> {
    const response = await axios.get(url, {
      timeout: DEFAULT_TIMEOUT_MS,
      maxContentLength: MAX_PAGE_SIZE_BYTES,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; TPlat-Scraper/1.0; +https://tplat.co.ke)',
        Accept: 'text/html,application/xhtml+xml',
      },
      responseType: 'text',
    });

    const html = response.data as string;
    const $ = cheerio.load(html);

    // Remove clutter
    $('script, style, nav, footer, header, [aria-hidden="true"]').remove();

    // Extract visible text (collapse whitespace)
    const rawText = $('body')
      .text()
      .replace(/\s+/g, ' ')
      .trim();

    // Extract image URLs (src + data-src for lazy-loaded images)
    const imageUrls: string[] = [];
    $('img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || '';
      if (src && !src.startsWith('data:')) {
        try {
          imageUrls.push(new URL(src, url).href);
        } catch {
          // Ignore malformed URLs
        }
      }
    });

    return { rawText, imageUrls };
  }

  // ─── DB Upsert ────────────────────────────────────────────────────────────

  private async upsertEvent(
    extracted: ExtractedEvent,
    source: ScrapedSource,
  ): Promise<void> {
    const sourceUrl = source.url;
    const city = source.city ?? 'Nairobi';

    const existing = await this.eventRepository
      .createQueryBuilder('event')
      .where('event.external_url = :sourceUrl', { sourceUrl })
      .andWhere('LOWER(event.title) = LOWER(:title)', { title: extracted.title })
      .getOne();

    const eventType = this.mapEventType(extracted.eventType);
    const startDate = new Date(extracted.startDate);
    const endDate = new Date(extracted.endDate);

    const systemOrganizerId = this.configService.get<string>('SYSTEM_ORGANIZER_ID');
    if (!systemOrganizerId) {
      this.logger.warn('SYSTEM_ORGANIZER_ID not set — cannot create scraped events');
      return;
    }

    if (existing) {
      await this.eventRepository.update(existing.id, {
        title: extracted.title,
        description: extracted.cleanDescription,
        eventType,
        startDate,
        endDate,
        bannerImageUrl: extracted.imageUrl || existing.bannerImageUrl,
        customLocation: {
          address: city,
          city,
          country: 'Kenya',
          latitude: -1.2921,
          longitude: 36.8219,
        },
      });

      const ticketType = await this.ticketTypeRepository.findOne({
        where: { eventId: existing.id },
      });
      if (ticketType && Number(ticketType.price) !== extracted.priceKES) {
        await this.ticketTypeRepository.update(ticketType.id, {
          price: extracted.priceKES,
        });
      }

      return;
    }

    const event = await this.eventRepository.save(
      this.eventRepository.create({
        organizerId: systemOrganizerId,
        title: extracted.title,
        description: extracted.cleanDescription,
        eventType,
        startDate,
        endDate,
        status: EventStatus.PUBLISHED,
        source: EventSource.SCRAPED,
        locationType: LocationType.CUSTOM,
        externalUrl: sourceUrl,
        bannerImageUrl: extracted.imageUrl || undefined,
        customLocation: {
          address: city,
          city,
          country: 'Kenya',
          latitude: -1.2921,
          longitude: 36.8219,
        },
        ticketTypes: [
          {
            name: 'General Admission',
            price: extracted.priceKES,
            currency: 'KES',
            totalQuantity: 999,
          },
        ],
      }),
    );

    await this.ticketTypeRepository.save(
      this.ticketTypeRepository.create({
        eventId: event.id,
        name: 'General Admission',
        price: extracted.priceKES,
        currency: Currency.KES,
        quantityAvailable: 999,
        quantitySold: 0,
        isActive: true,
      }),
    );
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private mapEventType(raw: string): EventType {
    const map: Record<string, EventType> = {
      concert: EventType.CONCERT,
      nightlife: EventType.NIGHTLIFE,
      festival: EventType.FESTIVAL,
      arts_culture: EventType.ARTS_CULTURE,
      sports: EventType.SPORTS,
      business: EventType.BUSINESS,
      community: EventType.COMMUNITY,
    };
    return map[raw] ?? EventType.OTHER;
  }
}