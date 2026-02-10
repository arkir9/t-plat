import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { Event, EventSource, EventStatus, LocationType, EventType } from '../entities/event.entity';

interface LatLng {
  lat: number;
  lng: number;
}

@Injectable()
export class EventIngestionService implements OnApplicationBootstrap {
  private readonly logger = new Logger(EventIngestionService.name);

  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  private readonly cityCenters: Record<string, LatLng> = {
    Nairobi: { lat: -1.2921, lng: 36.8219 },
    'Cape Town': { lat: -33.9249, lng: 18.4241 },
    Johannesburg: { lat: -26.2041, lng: 28.0473 },
  };

  /**
   * Haversine distance between two coordinates in kilometers.
   */
  private getDistanceKm(a: LatLng, b: LatLng): number {
    const R = 6371; // km
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;

    const sinDLat = Math.sin(dLat / 2);
    const sinDLng = Math.sin(dLng / 2);
    const aa = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
    const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
    return R * c;
  }

  /**
   * Force a one-time ingestion run when the application boots,
   * so the mobile app immediately sees external events without
   * waiting for the scheduled cron.
   */
  async onApplicationBootstrap(): Promise<void> {
    this.logger.log('FORCE RUN: Fetching External API Events on Startup...');
    await this.handleCron();
  }

  async handleCron() {
    this.logger.log('Starting PredictHQ Event Ingestion (general discovery only)...');

    // General discovery for key cities (no targeted venue lookups).
    await this.fetchGeneralDiscovery('Nairobi', '-1.2921,36.8219');
    await this.fetchGeneralDiscovery('Cape Town', '-33.9249,18.4241');
    await this.fetchGeneralDiscovery('Johannesburg', '-26.2041,28.0473');
  }

  async fetchGeneralDiscovery(cityName: string, latLong: string) {
    const apiKey = this.configService.get('PREDICTHQ_API_KEY');
    if (!apiKey) return;

    const url = 'https://api.predicthq.com/v1/events/';
    const params = {
      'location_around.origin': latLong,
      'location_around.scale': '20km',
      category: 'concerts,festivals,performing-arts,expos',
      sort: 'rank',
      limit: 20,
      'active.gte': new Date().toISOString().split('T')[0],
    };

    await this.executeFetch(url, params, apiKey, cityName, 'General Discovery');
  }

  // Targeted venue searches have been removed; we now rely solely on
  // general discovery queries so the ingestion surface is simpler and broader.

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
    // Deduplication check
    const existing = await this.eventRepository.findOne({
      where: { externalId: extData.id, source: EventSource.PREDICTHQ },
    });
    if (existing) return;

    const rawCategory = extData.labels?.[0] || 'event';
    const eventType = this.mapPredictHQCategory(rawCategory);

    // If PredictHQ didn't give us coordinates, skip – we can't guarantee location.
    if (!extData.location || extData.location.length < 2) {
      return;
    }

    const eventCoords: LatLng = {
      // PredictHQ uses [lng, lat]
      lat: extData.location[1],
      lng: extData.location[0],
    };

    const center = this.cityCenters[city];
    // If for some reason we don't know the city center, skip.
    if (!center) {
      return;
    }

    // Strict radius filter: only keep events within ~60km of the city center.
    const distanceKm = this.getDistanceKm(center, eventCoords);
    if (distanceKm > 60) {
      return;
    }

    let address = city;
    if (extData.entities && extData.entities.length > 0) {
      const venue = extData.entities.find((e: any) => e.type === 'venue');
      if (venue) {
        // Keep city as the cluster city (Nairobi / Cape Town / Johannesburg),
        // but store the venue name separately in the address field so the app
        // can display "Venue Name, City".
        address = venue.name;
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
        latitude: extData.location ? extData.location[1] : 0,
        longitude: extData.location ? extData.location[0] : 0,
      },
      organizerId: systemOrganizerId,
      images: [this.getCategoryImage(eventType)],
    });

    try {
      await this.eventRepository.save(newEvent);
      this.logger.log(`Imported: ${newEvent.title} [${eventType}]`);
    } catch (e) {
      this.logger.error(`Failed to save ${extData.title}`);
    }
  }

  private mapPredictHQCategory(externalLabel: string): EventType {
    const label = externalLabel.toLowerCase();

    if (label.includes('fest')) return EventType.FESTIVAL;
    if (label.includes('concert') || label.includes('music')) return EventType.CONCERT;
    if (label.includes('theatre') || label.includes('art') || label.includes('comedy'))
      return EventType.ARTS_CULTURE;
    if (label.includes('expo') || label.includes('conference') || label.includes('business'))
      return EventType.BUSINESS;
    if (label.includes('sport')) return EventType.SPORTS;
    if (label.includes('club') || label.includes('party')) return EventType.NIGHTLIFE;

    return EventType.OTHER;
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
