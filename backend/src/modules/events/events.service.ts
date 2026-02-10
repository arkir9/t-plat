import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event, EventStatus, EventSource } from './entities/event.entity';
import { EventInteraction, EventInteractionType } from './entities/event-interaction.entity';
import { BaseService } from '../../common/base/base.service';
import { CreateEventDto, EventResponseDto } from './dto';
import { EventQueryDto } from './dto/event-query.dto';

@Injectable()
export class EventsService extends BaseService<Event> {
  constructor(
    @InjectRepository(Event)
    protected readonly eventRepository: Repository<Event>,
    @InjectRepository(EventInteraction)
    private readonly interactionRepository: Repository<EventInteraction>,
  ) {
    super(eventRepository);
  }

  /**
   * Basic stubbed recommendations for a user, wrapped with pagination shape.
   * This currently reuses listEvents and does not perform real personalization.
   */
  async getRecommendedForUser(
    userId: string,
    limit: number,
  ): Promise<{ data: EventResponseDto[]; total: number; page: number; limit: number }> {
    // For now, ignore userId and just return upcoming featured events.
    // The notifications service still gets a stable, non-throwing API.
    const featured = await this.getFeaturedEvents(limit);
    return {
      data: featured.data,
      total: featured.total,
      page: 1,
      limit: featured.limit,
    };
  }

  /**
   * Load event by id with organizer (and optionally venue) for API response.
   */
  async findEventById(id: string): Promise<EventResponseDto> {
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: ['organizer', 'venue'],
    });
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    return this.toEventResponseDto(event);
  }

  /**
   * Create a new event owned by the given organizer.
   */
  async createEvent(createDto: CreateEventDto, organizerId: string): Promise<EventResponseDto> {
    const startDate = new Date(createDto.startDate);
    const endDate = new Date(createDto.endDate);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid startDate or endDate');
    }

    if (endDate <= startDate) {
      throw new BadRequestException('endDate must be after startDate');
    }

    const event = this.eventRepository.create({
      organizerId,
      title: createDto.title,
      description: createDto.description,
      eventType: createDto.eventType,
      category: createDto.category,
      startDate,
      endDate,
      timezone: createDto.timezone ?? 'Africa/Nairobi',
      locationType: createDto.locationType,
      customLocation: createDto.customLocation,
      venueId: createDto.venueId,
      images: createDto.images,
      videoUrl: createDto.videoUrl,
      ageRestriction: createDto.ageRestriction,
      dressCode: createDto.dressCode,
      maxTicketsPerUser: createDto.maxTicketsPerUser,
      venueFeePercentage: createDto.venueFeePercentage,
      venueFeeAmount: createDto.venueFeeAmount,
      venueFeeType: createDto.venueFeeType,
      isFeatured: createDto.isFeatured ?? false,
      isSponsored: createDto.isSponsored ?? false,
      sponsorName: createDto.sponsorName,
      bannerImageUrl: createDto.bannerImageUrl,
      tags: createDto.tags,
      externalUrl: createDto.externalUrl,
      contactInfo: createDto.contactInfo,
      requirements: createDto.requirements,
      publishDate: createDto.publishDate ? new Date(createDto.publishDate) : undefined,
      source: EventSource.INTERNAL,
      isClaimed: true,
    });

    const saved = await this.eventRepository.save(event);
    return this.findEventById(saved.id);
  }

  private toEventResponseDto(event: Event): EventResponseDto {
    const dto = new EventResponseDto();
    Object.assign(dto, {
      id: event.id,
      organizerId: event.organizerId,
      source: event.source,
      isClaimed: event.isClaimed,
      externalUrl: event.externalUrl,
      organizer: event.organizer
        ? {
            id: event.organizer.id,
            name: event.organizer.name,
            profileImageUrl: event.organizer.logoUrl,
            isVerified: event.organizer.verificationStatus === 'verified',
          }
        : undefined,
      venueId: event.venueId,
      venue: event.venue
        ? {
            id: event.venue.id,
            name: event.venue.name,
            profileImageUrl: event.venue.logoUrl,
            address: event.venue.venueAddress,
            city: event.venue.venueCity,
            country: undefined,
          }
        : undefined,
      title: event.title,
      description: event.description,
      eventType: event.eventType,
      category: event.category,
      startDate: event.startDate,
      endDate: event.endDate,
      timezone: event.timezone,
      locationType: event.locationType,
      customLocation: event.customLocation,
      images: event.images,
      videoUrl: event.videoUrl,
      ageRestriction: event.ageRestriction,
      dressCode: event.dressCode,
      maxTicketsPerUser: event.maxTicketsPerUser,
      venueFeePercentage: event.venueFeePercentage,
      venueFeeAmount: event.venueFeeAmount,
      venueFeeType: event.venueFeeType,
      status: event.status,
      isFeatured: event.isFeatured,
      isSponsored: event.isSponsored,
      sponsorName: event.sponsorName,
      bannerImageUrl: event.bannerImageUrl,
      publishDate: event.publishDate,
      tags: event.tags,
      contactInfo: event.contactInfo,
      requirements: event.requirements,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    });
    return dto;
  }

  /**
   * Get recommended events for a user (used by notifications). Stub: returns empty array.
   * Parameters are currently unused but kept for future implementation.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getRecommendedEventsForUser(userId: string, limit: number): Promise<EventResponseDto[]> {
    const result = await this.getRecommendedForUser(userId, limit);
    return result.data;
  }

  /**
   * Allow a verified organizer to claim an event imported from an API.
   */
  async claimEvent(eventId: string, organizerId: string): Promise<EventResponseDto> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
      relations: ['organizer', 'venue'],
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    if (event.isClaimed) {
      throw new BadRequestException('This event has already been claimed by an organizer');
    }

    if (event.source === EventSource.INTERNAL) {
      throw new BadRequestException('Cannot claim an event that was manually created');
    }

    event.organizerId = organizerId;
    event.isClaimed = true;
    const savedEvent = await this.eventRepository.save(event);
    return this.findEventById(savedEvent.id);
  }

  /**
   * Basic event listing used by mobile home screen.
   * Supports pagination and a small subset of filters.
   */
  async listEvents(query: EventQueryDto): Promise<{
    data: EventResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = Number(query.limit) > 0 ? Number(query.limit) : 20;

    const qb = this.eventRepository.createQueryBuilder('event');

    // Default to published events for discovery
    qb.where('event.status = :status', { status: query.status ?? EventStatus.PUBLISHED });

    if (query.organizerId) {
      qb.andWhere('event.organizer_id = :organizerId', { organizerId: query.organizerId });
    }
    if (query.category) {
      qb.andWhere('event.category = :category', { category: query.category });
    }
    if (query.eventType) {
      qb.andWhere('event.event_type = :eventType', { eventType: query.eventType });
    }
    if (query.featured) {
      qb.andWhere('event.is_featured = TRUE');
    }

    // Limit discovery to our supported cities by default
    const allowedCities = ['Nairobi', 'Johannesburg', 'Cape Town'];
    if (query.city) {
      qb.andWhere("(event.custom_location->>'city') ILIKE :city", { city: query.city });
    } else {
      qb.andWhere("(event.custom_location->>'city') IN (:...allowedCities)", { allowedCities });
    }

    qb.orderBy('event.start_date', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [events, total] = await qb.getManyAndCount();
    const data = events.map((e) => this.toEventResponseDto(e));
    return { data, total, page, limit };
  }

  /**
   * List events for a specific organizer profile.
   */
  async listEventsForOrganizer(
    organizerProfileId: string,
    query: EventQueryDto,
  ): Promise<{
    data: EventResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const enriched: EventQueryDto = {
      ...query,
      organizerId: organizerProfileId,
    } as EventQueryDto;

    return this.listEvents(enriched);
  }

  /**
   * Featured events for the hero carousel on Home screen.
   */
  async getFeaturedEvents(limit = 10): Promise<{
    data: EventResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [events, total] = await this.eventRepository.findAndCount({
      where: {
        status: EventStatus.PUBLISHED,
        isFeatured: true,
      },
      order: { startDate: 'ASC' },
      take: limit,
    });

    const data = events.map((e) => this.toEventResponseDto(e));
    return { data, total, page: 1, limit };
  }

  /**
   * Nearby events – for now this returns upcoming published events,
   * ignoring exact geospatial distance (mobile still gets useful data).
   */
  async getNearbyEvents(query: EventQueryDto): Promise<{
    data: EventResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    // Reuse listEvents with sensible defaults and higher limit
    const enriched: EventQueryDto = {
      ...query,
      status: query.status ?? EventStatus.PUBLISHED,
      limit: query.limit ?? 50,
    } as EventQueryDto;

    return this.listEvents(enriched);
  }

  /**
   * Track a view interaction for a user and event.
   * This is intentionally lightweight; errors are allowed to bubble so callers can decide how to handle them.
   */
  async trackView(userId: string, eventId: string): Promise<void> {
    const interaction = this.interactionRepository.create({
      userId,
      eventId,
      interactionType: EventInteractionType.VIEW,
      weight: 1,
    });
    await this.interactionRepository.save(interaction);
  }
}
