import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as cheerio from 'cheerio';
import { AiExtractorService, type ExtractedEvent } from './ai-extractor.service';
import { EventType } from '../entities/event.entity';

export interface ScrapedEventData {
  title: string;
  description: string;
  eventType: EventType;
  priceKES: number;
  startDate: Date;
  endDate: Date;
  imageUrl: string;
  externalUrl: string;
  sourceDomain: string;
}

@Injectable()
export class UniversalScraperService {
  private readonly logger = new Logger(UniversalScraperService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly aiExtractor: AiExtractorService,
  ) {}

  async scrapeUrl(url: string): Promise<ScrapedEventData[]> {
    try {
      const { data: html } = await firstValueFrom(
        this.httpService.get<string>(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml',
          },
          timeout: 15_000,
          maxRedirects: 3,
        }),
      );

      const $ = cheerio.load(html);

      $('script, style, noscript, svg, iframe').remove();
      const rawText = $('body')
        .text()
        .replace(/\s+/g, ' ')
        .trim();

      const baseUrl = new URL(url);
      const imageLinks: string[] = [];
      $('img').each((_, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src');
        if (!src) return;
        try {
          const absolute = new URL(src, baseUrl.origin).href;
          if (!imageLinks.includes(absolute)) {
            imageLinks.push(absolute);
          }
        } catch {
          // skip malformed URLs
        }
      });

      $('meta[property="og:image"]').each((_, el) => {
        const content = $(el).attr('content');
        if (content) {
          try {
            const absolute = new URL(content, baseUrl.origin).href;
            if (!imageLinks.includes(absolute)) {
              imageLinks.unshift(absolute);
            }
          } catch {
            // skip
          }
        }
      });

      const result = await this.aiExtractor.extractEvents(rawText, imageLinks);

      if (!result.isEventStore) {
        this.logger.debug(`Skipped (not an event store): ${url}`);
        return [];
      }

      const sourceDomain = baseUrl.hostname
        .replace(/^www\./, '')
        .split('.')[0];

      return result.events
        .filter((ev) => ev.title && ev.title.length > 2)
        .map((ev) => this.mapToScrapedEvent(ev, url, sourceDomain));
    } catch (error: any) {
      this.logger.error(
        `Failed to scrape ${url}: ${error?.message || error}`,
      );
      return [];
    }
  }

  private mapToScrapedEvent(
    ev: ExtractedEvent,
    pageUrl: string,
    sourceDomain: string,
  ): ScrapedEventData {
    let startDate: Date;
    let endDate: Date;

    try {
      startDate = new Date(ev.startDate);
      if (isNaN(startDate.getTime())) throw new Error('bad start');
    } catch {
      startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      startDate.setHours(18, 0, 0, 0);
    }

    try {
      endDate = new Date(ev.endDate);
      if (isNaN(endDate.getTime())) throw new Error('bad end');
    } catch {
      endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + 5);
    }

    const eventTypeMap: Record<string, EventType> = {
      concert: EventType.CONCERT,
      nightlife: EventType.NIGHTLIFE,
      festival: EventType.FESTIVAL,
      arts_culture: EventType.ARTS_CULTURE,
      sports: EventType.SPORTS,
      business: EventType.BUSINESS,
      community: EventType.COMMUNITY,
      other: EventType.OTHER,
    };

    return {
      title: ev.title,
      description: ev.cleanDescription || `Event tickets available.`,
      eventType: eventTypeMap[ev.eventType] || EventType.OTHER,
      priceKES: ev.priceKES ?? 0,
      startDate,
      endDate,
      imageUrl: ev.imageUrl || '',
      externalUrl: pageUrl,
      sourceDomain,
    };
  }
}
