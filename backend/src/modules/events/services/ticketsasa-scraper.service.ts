import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
import { Event, EventSource, EventStatus, EventType, LocationType } from '../entities/event.entity';
import { AiExtractorService } from './ai-extractor.service';

@Injectable()
export class TicketsasaScraperService {
  private readonly logger = new Logger(TicketsasaScraperService.name);

  // Initial single-source pilot URL (Section 9 checklist: one source first)
  private readonly TICKETSASA_EVENTS_URL = 'https://www.ticketsasa.com/events';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly aiExtractor: AiExtractorService,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  /**
   * Public entrypoint for the one-source pilot.
   * Scrapes the Ticketsasa events page, runs AI extraction and upserts a single event.
   */
  async runSingleSourcePilot(): Promise<void> {
    await this.scrapeAndUpsert(this.TICKETSASA_EVENTS_URL);
  }

  private hashContent(html: string): string {
    return crypto.createHash('md5').update(html).digest('hex');
  }

  private async fetchHtmlAndImages(url: string): Promise<{ html: string; images: string[] }> {
    const { data: html } = await firstValueFrom(
      this.httpService.get<string>(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
        },
        timeout: 20_000,
        maxRedirects: 3,
      }),
    );

    const $ = cheerio.load(html);

    // Strip noisy tags before text extraction
    $('script, style, noscript, svg, iframe').remove();

    const baseUrl = new URL(url);
    const images: string[] = [];

    // Priority 1: og:image (best quality)
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage) {
      try {
        const absolute = new URL(ogImage, baseUrl.origin).href;
        images.push(absolute);
      } catch {
        // ignore malformed
      }
    }

    // Priority 2: poster-like <img> tags
    $('img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (!src) return;

      const alt = ($(el).attr('alt') || '').toLowerCase();
      const cls = ($(el).attr('class') || '').toLowerCase();

      const isPoster =
        alt.includes('poster') ||
        alt.includes('event') ||
        cls.includes('poster') ||
        cls.includes('banner');

      try {
        const absolute = new URL(src, baseUrl.origin).href;
        if (isPoster || images.length === 0) {
          if (!images.includes(absolute)) {
            images.push(absolute);
          }
        }
      } catch {
        // skip malformed URLs
      }
    });

    return { html, images };
  }

  private extractVisibleText(html: string): string {
    const $ = cheerio.load(html);
    $('script, style, noscript, svg, iframe').remove();
    return $('body')
      .text()
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Core pipeline:
   * 1) Fetch HTML
   * 2) Compute content hash and compare with last stored hash
   * 3) If changed, run AI extraction
   * 4) Upsert into events table
   * 5) Optionally use SerpApi as image fallback
   */
  async scrapeAndUpsert(sourceUrl: string): Promise<void> {
    try {
      this.logger.log(`Scraping Ticketsasa source: ${sourceUrl}`);

      const { html, images } = await this.fetchHtmlAndImages(sourceUrl);
      const hash = this.hashContent(html);

      const existing = await this.eventRepository.findOne({
        where: { externalUrl: sourceUrl, source: EventSource.SCRAPED },
      });

      if (existing?.contentHash && existing.contentHash === hash) {
        this.logger.log(`No change detected for ${sourceUrl} (hash match). Skipping AI call.`);
        return;
      }

      const rawText = this.extractVisibleText(html);

      const aiResult = await this.aiExtractor.extractEvents(rawText, images);
      if (!aiResult.isEventStore || aiResult.events.length === 0) {
        this.logger.warn(`AI did not detect events on Ticketsasa page: ${sourceUrl}`);
        return;
      }

      const first = aiResult.events[0];

      // Fallback image selection: AI image -> Cheerio-derived image list
      let imageUrl = first.imageUrl;
      if (!imageUrl && images.length > 0) {
        imageUrl = images[0];
      }

      if (!imageUrl) {
        imageUrl = await this.fetchRealPoster(`${first.title} Nairobi event poster`);
      }

      const systemOrganizerId = this.configService.get<string>('SYSTEM_ORGANIZER_ID');

      const startDate = new Date(first.startDate);
      const endDate = new Date(first.endDate);

      const newValues: Partial<Event> = {
        title: first.title,
        description: first.cleanDescription,
        eventType: this.mapEventType(first.eventType),
        startDate: isNaN(startDate.getTime()) ? new Date() : startDate,
        endDate: isNaN(endDate.getTime()) ? new Date() : endDate,
        source: EventSource.SCRAPED,
        externalUrl: sourceUrl,
        isClaimed: false,
        ticketTypes:
          first.priceKES && first.priceKES > 0
            ? [
                {
                  name: 'General Admission',
                  price: first.priceKES,
                  currency: 'KES',
                  totalQuantity: 100,
                },
              ]
            : undefined,
        images: imageUrl ? [imageUrl] : undefined,
        bannerImageUrl: imageUrl || undefined,
        status: EventStatus.PUBLISHED,
        locationType: LocationType.CUSTOM,
        customLocation: {
          address: 'Nairobi',
          city: 'Nairobi',
          country: 'Kenya',
          latitude: -1.2921,
          longitude: 36.8219,
        },
        organizerId: systemOrganizerId,
        contentHash: hash,
        lastScrapedAt: new Date(),
      };

      if (existing) {
        this.logger.log(`Updating existing Ticketsasa event: ${existing.id}`);
        await this.eventRepository.update(existing.id, newValues);
      } else {
        const created = this.eventRepository.create(newValues);
        await this.eventRepository.save(created);
        this.logger.log(`Saved new Ticketsasa event: ${created.title}`);
      }
    } catch (error: any) {
      this.logger.error(
        `Ticketsasa scrape failed for ${sourceUrl}: ${error?.message || error}`,
      );
    }
  }

  private mapEventType(rawType: string): EventType {
    const key = (rawType || '').toLowerCase();
    switch (key) {
      case 'concert':
        return EventType.CONCERT;
      case 'nightlife':
        return EventType.NIGHTLIFE;
      case 'festival':
        return EventType.FESTIVAL;
      case 'arts_culture':
        return EventType.ARTS_CULTURE;
      case 'sports':
        return EventType.SPORTS;
      case 'business':
        return EventType.BUSINESS;
      case 'community':
        return EventType.COMMUNITY;
      default:
        return EventType.OTHER;
    }
  }

  /**
   * SerpApi image fallback – only used when Cheerio + AI provide no image.
   */
  private async fetchRealPoster(query: string): Promise<string | null> {
    const apiKey = this.configService.get<string>('SERPAPI_KEY');
    if (!apiKey) return null;

    try {
      const { data } = await firstValueFrom(
        this.httpService.get('https://serpapi.com/search.json', {
          params: {
            engine: 'google_images',
            q: query,
            api_key: apiKey,
            num: 1,
            gl: 'ke',
          },
        }),
      );

      if (data.images_results && data.images_results.length > 0) {
        return data.images_results[0].original;
      }
    } catch (error) {
      // Soft-fail: missing poster is not fatal
      this.logger.debug(
        `SerpApi poster lookup failed for query "${query}". Falling back to no image.`,
      );
    }

    return null;
  }
}

