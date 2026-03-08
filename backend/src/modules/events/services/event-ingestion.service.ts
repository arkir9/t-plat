import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { Event, EventSource, EventStatus, LocationType, EventType } from '../entities/event.entity';
import { UniversalScraperService } from './universal-scraper.service';
import { TicketsasaScraperService } from './ticketsasa-scraper.service';
import { OrganiserOutreachService } from './organiser-outreach.service';

@Injectable()
export class EventIngestionService implements OnApplicationBootstrap {
  private readonly logger = new Logger(EventIngestionService.name);

  private readonly TARGET_DOMAINS = [
    'hustlesasa.shop',
    'mookh.com',
    'ticketsasa.com',
    'kenyabuzz.com',
    'mtickets.com',
    'madfun.com',
  ];

  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    private httpService: HttpService,
    private configService: ConfigService,
    private universalScraper: UniversalScraperService,
    private ticketsasaScraper: TicketsasaScraperService,
    private outreachService: OrganiserOutreachService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    this.logger.log(
      'EventIngestionService ready. Use POST /events/dev/trigger-scraper or wait for cron.',
    );
  }

  async handleCron() {
    this.logger.log('Starting Hybrid Event Ingestion (Ticketsasa pilot first)...');

    // Section 9: one source, full pipeline, then scale.
    // 1. Run Ticketsasa single-source pilot (hash-based, AI-powered scrape)
    await this.ticketsasaScraper.runSingleSourcePilot();

    // 2. Universal AI-Powered Discovery (multi-domain) – can be toggled on/off as we scale.
    await this.runUniversalDiscovery('Nairobi');
  }

  /**
   * 🎨 VISUAL HUNTER (SerpApi Image Search)
   * Finds the actual flyer/poster for an event title via Google Images.
   */
  private async fetchRealPoster(query: string): Promise<string | null> {
    const apiKey = this.configService.get('SERPAPI_KEY');
    if (!apiKey) return null;

    try {
      const { data } = await firstValueFrom(
        this.httpService.get('https://serpapi.com/search.json', {
          params: {
            engine: 'google_images',
            q: query,
            api_key: apiKey,
            num: 1, // We only need the top result
            gl: 'ke', // Localize to Kenya
          },
        }),
      );

      if (data.images_results && data.images_results.length > 0) {
        return data.images_results[0].original; // Return HD image
      }
    } catch (error) {
      // Fail silently and fall back to generic image
      return null;
    }
    return null;
  }

  /**
   * UNIVERSAL DISCOVERY ENGINE (SerpApi + AI Scraper)
   * Searches multiple Kenyan ticketing domains and extracts events via LLM.
   */
  private async runUniversalDiscovery(city: string) {
    const apiKey = this.configService.get('SERPAPI_KEY');

    if (!apiKey) {
      this.logger.warn('Skipping Universal Discovery: SERPAPI_KEY missing in .env');
      return;
    }

    this.logger.log(
      `[Universal Discovery] Searching ${this.TARGET_DOMAINS.length} domains for "${city}" events...`,
    );

    const discoveredUrls = new Set<string>();

    for (const domain of this.TARGET_DOMAINS) {
      const urls = await this.discoverEventUrls(domain, city, apiKey);
      urls.forEach((u) => discoveredUrls.add(u));
      await this.delay(500);
    }

    this.logger.log(`Found ${discoveredUrls.size} unique event URLs. Starting AI scrape...`);

    for (const url of discoveredUrls) {
      await this.ingestFromUrl(url);
      await this.delay(1500);
    }
  }

  private async discoverEventUrls(domain: string, city: string, apiKey: string): Promise<string[]> {
    const query = `site:${domain} ("ticket" OR "event" OR "party") "${city}"`;

    try {
      const { data } = await firstValueFrom(
        this.httpService.get('https://serpapi.com/search.json', {
          params: {
            engine: 'google',
            q: query,
            api_key: apiKey,
            num: 15,
            google_domain: 'google.co.ke',
            gl: 'ke',
            hl: 'en',
          },
        }),
      );

      if (!data.organic_results) return [];

      return data.organic_results
        .map((item: any) => item.link as string)
        .filter((link: string) => {
          try {
            const parsed = new URL(link);
            const isRootPage = parsed.pathname === '/' || parsed.pathname === '';
            return !isRootPage;
          } catch {
            return false;
          }
        });
    } catch (error: any) {
      this.logger.error(
        `SerpApi search failed for ${domain}: ${error.response?.data?.error || error.message}`,
      );
      return [];
    }
  }

  private async ingestFromUrl(url: string) {
    const existing = await this.eventRepository.findOne({
      where: { externalUrl: url },
    });
    if (existing) return;

    const scrapedEvents = await this.universalScraper.scrapeUrl(url);
    const systemOrganizerId = this.configService.get('SYSTEM_ORGANIZER_ID');

    if (scrapedEvents.length > 0) {
      this.logger.log(`Processing ${scrapedEvents.length} AI-extracted events from ${url}`);
    }

    for (const raw of scrapedEvents) {
      const ticketTypes =
        raw.priceKES > 0
          ? [
              {
                name: 'General Admission',
                price: raw.priceKES,
                currency: 'KES',
                totalQuantity: 100,
              },
            ]
          : [];

      const images = raw.imageUrl ? [raw.imageUrl] : [];

      const newEvent = this.eventRepository.create({
        title: raw.title,
        description: raw.description,
        eventType: raw.eventType,
        startDate: raw.startDate,
        endDate: raw.endDate,
        source: EventSource.SCRAPED,
        externalUrl: raw.externalUrl,
        isClaimed: false,
        ticketTypes: ticketTypes.length ? ticketTypes : undefined,
        images,
        bannerImageUrl: images[0] || null,
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
        const savedEvent = await this.eventRepository.save(newEvent);
        this.logger.log(`   + Saved [${raw.sourceDomain}]: ${newEvent.title}`);
        await this.outreachService.handleNewScrapedEvent(savedEvent, raw).catch((err) =>
          this.logger.warn(`   Outreach for ${newEvent.title}: ${err?.message || err}`),
        );
      } catch (e: any) {
        this.logger.error(`   - Failed [${raw.sourceDomain}]: ${raw.title}`);
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
      category: 'concerts,festivals,performing-arts,expos,sports',
      sort: 'rank',
      limit: 10, // Limit API usage
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

      for (const [index, item] of events.entries()) {
        await this.processPredictHQEvent(item, systemOrganizerId, cityName, index);
      }
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 402) {
        this.logger.warn(
          `[${sourceLabel}] PredictHQ returned 402 (Payment Required) — free tier likely exhausted. Skipping.`,
        );
      } else {
        this.logger.error(`Error fetching ${sourceLabel}: ${error.message}`);
      }
    }
  }

  private async processPredictHQEvent(
    extData: any,
    systemOrganizerId: string,
    city: string,
    index: number,
  ) {
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

    // --- VISUAL HUNTER LOGIC ---
    // 1. Default to category image
    let posterImage = this.getCategoryImage(eventType);

    // 2. If it's a top event (first 5), try to find the REAL poster
    if (index < 5) {
      const visualQuery = `${extData.title} ${address || city} event poster`;
      const realPoster = await this.fetchRealPoster(visualQuery);
      if (realPoster) {
        posterImage = realPoster;
        this.logger.log(`Visual Hunter: Found real poster for ${extData.title}`);
      }
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
      bannerImageUrl: posterImage,
      images: [posterImage],
    });

    try {
      const savedEvent = await this.eventRepository.save(newEvent);
      await this.outreachService.handleNewScrapedEvent(savedEvent, extData).catch((err) =>
        this.logger.warn(`Outreach for ${extData.title}: ${err?.message || err}`),
      );
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

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
