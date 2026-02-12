import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { Event, EventSource, EventStatus, LocationType, EventType } from '../entities/event.entity';
import { HustlesasaScraperService } from './hustlesasa-scraper.service';

@Injectable()
export class EventIngestionService implements OnApplicationBootstrap {
  private readonly logger = new Logger(EventIngestionService.name);

  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    private httpService: HttpService,
    private configService: ConfigService,
    private hustlesasaScraper: HustlesasaScraperService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    // Run ingestion in background so DB/table issues don't block server startup
    this.handleCron().catch((err) => {
      this.logger.warn('Event ingestion failed (server still running):', err?.message || err);
    });
  }

  async handleCron() {
    this.logger.log('Starting Hybrid Event Ingestion...');

    // 1. PredictHQ (Global Events)
    await this.fetchGeneralDiscovery('Nairobi', '-1.2921,36.8219');

    // 2. Hustlesasa Auto-Discovery (Powered by SerpApi)
    await this.runHustlesasaDiscovery('Nairobi');
  }

  /**
   * 🔎 DISCOVERY ENGINE (SerpApi)
   */
  private async runHustlesasaDiscovery(city: string) {
    const apiKey = this.configService.get('SERPAPI_KEY');

    if (!apiKey) {
      this.logger.warn('Skipping Hustlesasa Discovery: SERPAPI_KEY missing in .env');
      return;
    }

    this.logger.log(`🔍 [SerpApi] Searching for new Hustlesasa stores in ${city}...`);
    const stores = await this.discoverHustlesasaStores(city, apiKey);

    if (stores.length === 0) {
      this.logger.log('No new stores found via discovery.');
      return;
    }

    this.logger.log(`✅ Found ${stores.length} unique stores. Starting scrape...`);

    // Scrape Each Found Store
    for (const storeUrl of stores) {
      await this.ingestHustlesasaEvents(storeUrl);
    }
  }

  private async discoverHustlesasaStores(city: string, apiKey: string): Promise<string[]> {
    // Find sites ending in .hustlesasa.shop that mention the city
    const query = `site:hustlesasa.shop "${city}"`;
    const url = 'https://serpapi.com/search.json';

    try {
      const { data } = await firstValueFrom(
        this.httpService.get(url, {
          params: {
            engine: 'google',
            q: query,
            api_key: apiKey,
            num: 20,
            google_domain: 'google.co.ke',
            gl: 'ke',
            hl: 'en',
          },
        }),
      );

      if (!data.organic_results) return [];

      const uniqueStores = new Set<string>();

      data.organic_results.forEach((item: any) => {
        try {
          const itemUrl = new URL(item.link);
          const rootStore = `${itemUrl.protocol}//${itemUrl.hostname}`;

          // Filter out main marketing site
          if (!rootStore.includes('www.hustlesasa.com')) {
            uniqueStores.add(rootStore);
          }
        } catch (e) {
          // Ignore invalid URLs
        }
      });

      return Array.from(uniqueStores);
    } catch (error: any) {
      this.logger.error('SerpApi Discovery failed', error.response?.data?.error || error.message);
      return [];
    }
  }

  // --- HUSTLESASA INGESTION ---
  private async ingestHustlesasaEvents(storeUrl: string) {
    const scrapedEvents = await this.hustlesasaScraper.scrapeStore(storeUrl);
    const systemOrganizerId = this.configService.get('SYSTEM_ORGANIZER_ID');

    if (scrapedEvents.length > 0) {
      this.logger.log(`📍 Processing ${scrapedEvents.length} events from ${storeUrl}`);
    }

    for (const raw of scrapedEvents) {
      const existing = await this.eventRepository.findOne({
        where: { externalUrl: raw.externalUrl },
      });

      const description =
        typeof raw.description === 'string'
          ? this.formatDescription(raw.description)
          : raw.description || '';
      const ticketTypes =
        raw.price > 0
          ? [{ name: 'General Admission', price: raw.price, currency: 'KES' }]
          : undefined;
      const images = this.buildImagesArray(raw);

      if (!existing) {
        const newEvent = this.eventRepository.create({
          title: raw.title,
          description,
          eventType: raw.eventType,
          startDate: raw.startDate,
          endDate: raw.endDate,
          source: EventSource.SCRAPED,
          externalUrl: raw.externalUrl,
          isClaimed: false,
          ticketTypes,
          images,
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
        });

        try {
          await this.eventRepository.save(newEvent);
          this.logger.log(`   + Saved: ${newEvent.title}`);
        } catch (e: any) {
          this.logger.error(`   - Failed: ${raw.title}`);
        }
      } else if (
        (!existing.images || existing.images.length === 0) &&
        images.length > 0
      ) {
        try {
          existing.images = images;
          if (ticketTypes) existing.ticketTypes = ticketTypes;
          existing.description = description;
          await this.eventRepository.save(existing);
          this.logger.log(`   ↻ Updated images/price: ${existing.title}`);
        } catch (e: any) {
          this.logger.warn(`   - Update failed: ${raw.title}`);
        }
      }
    }
  }

  // --- PREDICTHQ LOGIC ---
  async fetchGeneralDiscovery(cityName: string, latLong: string) {
    const apiKey = this.configService.get('PREDICTHQ_API_KEY');
    if (!apiKey) return;

    const url = 'https://api.predicthq.com/v1/events/';
    const params = {
      within: `50km@${latLong}`,
      category: 'concerts,festivals,performing-arts,expos',
      sort: 'rank',
      limit: 20,
      'active.gte': new Date().toISOString().split('T')[0],
    };

    await this.executeFetch(url, params, apiKey, cityName, 'General Discovery');
  }

  private async executeFetch(
    url: string,
    params: any,
    apiKey: string,
    cityName: string,
    sourceLabel: string,
  ) {
    const systemOrganizerId = this.configService.get('SYSTEM_ORGANIZER_ID');
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(url, {
          headers: { Authorization: `Bearer ${apiKey}` },
          params: params,
        }),
      );
      const events = data.results || [];
      for (const item of events) {
        await this.processPredictHQEvent(item, systemOrganizerId, cityName);
      }
    } catch (error: any) {
      this.logger.error(`Error fetching ${sourceLabel}`, error.message);
    }
  }

  private async processPredictHQEvent(extData: any, systemOrganizerId: string, city: string) {
    const existing = await this.eventRepository.findOne({
      where: { externalId: extData.id, source: EventSource.PREDICTHQ },
    });
    if (existing) return;

    if (!extData.location || extData.location.length < 2) return;

    const rawCategory = extData.labels?.[0] || 'event';
    const eventType = this.mapPredictHQCategory(rawCategory);

    let address = city;
    if (extData.entities && extData.entities.length > 0) {
      const venue = extData.entities.find((e: any) => e.type === 'venue');
      if (venue) address = venue.name;
    }

    const newEvent = this.eventRepository.create({
      title: extData.title,
      description: extData.description || `${rawCategory} event in ${city}.`,
      eventType: eventType,
      startDate: new Date(extData.start),
      endDate: new Date(extData.end || extData.start),
      source: EventSource.PREDICTHQ,
      externalId: extData.id,
      isClaimed: false,
      status: EventStatus.PUBLISHED,
      locationType: LocationType.CUSTOM,
      customLocation: {
        address: address,
        city: city,
        country: extData.country,
        latitude: extData.location[1],
        longitude: extData.location[0],
      },
      organizerId: systemOrganizerId,
      images: [this.getCategoryImage(eventType)],
    });

    try {
      await this.eventRepository.save(newEvent);
    } catch (e) {
      this.logger.error(`Failed to save ${extData.title}`);
    }
  }

  private mapPredictHQCategory(externalLabel: string): EventType {
    const label = externalLabel.toLowerCase();
    if (label.includes('fest')) return EventType.FESTIVAL;
    if (label.includes('concert') || label.includes('music')) return EventType.CONCERT;
    if (label.includes('theatre') || label.includes('art')) return EventType.ARTS_CULTURE;
    if (label.includes('expo') || label.includes('conference')) return EventType.BUSINESS;
    if (label.includes('sport')) return EventType.SPORTS;
    return EventType.NIGHTLIFE;
  }

  private buildImagesArray(raw: any): string[] {
    const banner = raw.bannerUrl || raw.imageUrl;
    const logo = raw.logoUrl;
    if (banner && logo && banner !== logo) return [banner, logo];
    if (banner) return [banner];
    if (logo) return [logo];
    return [];
  }

  private formatDescription(raw: string): string {
    if (!raw || typeof raw !== 'string') return '';
    let text = raw
      .replace(/\s+/g, ' ')
      .replace(/'{2,}/g, "'")
      .replace(/\btme\b/gi, 'time')
      .replace(/\s+([.,!?])/g, '$1')
      .trim();
    // Add paragraph breaks every 2–3 sentences for readability
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    if (sentences.length > 2) {
      const grouped: string[] = [];
      for (let i = 0; i < sentences.length; i += 2) {
        grouped.push(sentences.slice(i, i + 2).join(' ').trim());
      }
      return grouped.filter(Boolean).join('\n\n');
    }
    return text;
  }

  private getCategoryImage(type: EventType): string {
    const images: Record<string, string> = {
      [EventType.CONCERT]:
        'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80',
      [EventType.FESTIVAL]:
        'https://images.unsplash.com/photo-1533174072545-e8d4aa97d848?w=800&q=80',
      [EventType.NIGHTLIFE]:
        'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&q=80',
      [EventType.ARTS_CULTURE]:
        'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800&q=80',
      [EventType.BUSINESS]: 'https://images.unsplash.com/photo-1544531586-fde5298cdd40?w=800&q=80',
      [EventType.SPORTS]: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&q=80',
      [EventType.OTHER]: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
    };
    return images[type] || images[EventType.OTHER];
  }
}
