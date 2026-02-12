import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event, EventStatus, EventSource } from './entities/event.entity';
import { EventInteraction, EventInteractionType } from './entities/event-interaction.entity';
import { BaseService } from '../../common/base/base.service';
import { CreateEventDto, EventResponseDto, UpdateEventDto } from './dto';
import { EventQueryDto } from './dto/event-query.dto';

@Injectable()
export class EventsService extends BaseService<Event> {
  private readonly logger = new Logger(EventsService.name);

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
      ticketTypes: event.ticketTypes,
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
    if (query.search && query.search.trim()) {
      const searchPattern = `%${query.search.trim()}%`;
      qb.andWhere('(event.title ILIKE :search OR event.description ILIKE :search)', {
        search: searchPattern,
      });
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

    // Limit discovery to supported cities; include events with venue (no custom_location) when no city filter
    const allowedCities = ['Nairobi', 'Johannesburg', 'Cape Town'];
    if (query.city) {
      qb.andWhere("(event.custom_location->>'city') ILIKE :city", { city: query.city });
    } else {
      qb.andWhere(
        "(event.custom_location IS NULL) OR ((event.custom_location->>'city') IN (:...allowedCities))",
        { allowedCities },
      );
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

  /** System bot user UUID (from seed) - used for anonymous view tracking */
  private static readonly SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

  /**
   * Track a view interaction (used by public track-view endpoint).
   * Uses system user for anonymous views; fails gracefully if table missing.
   */
  async trackInteraction(
    eventId: string,
    _type: 'view' | 'wishlist' | 'purchase' | 'share' | 'checkin',
  ): Promise<void> {
    await this.trackView(EventsService.SYSTEM_USER_ID, eventId);
  }

  /** List events owned by an organizer (for "my events"). */
  async listEventsForUser(
    organizerProfileId: string,
    query?: EventQueryDto,
  ): Promise<{
    data: EventResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.listEventsForOrganizer(organizerProfileId, query ?? ({} as EventQueryDto));
  }

  /** Update event; throws if user is not the organizer. */
  async updateEvent(id: string, dto: UpdateEventDto, userId: string): Promise<EventResponseDto> {
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: ['organizer', 'venue'],
    });
    if (!event) throw new NotFoundException(`Event with ID ${id} not found`);
    if ((event.organizer as any)?.userId !== userId) {
      throw new BadRequestException('You do not have permission to update this event');
    }
    if (dto.startDate) event.startDate = new Date(dto.startDate);
    if (dto.endDate) event.endDate = new Date(dto.endDate);
    if (dto.title !== undefined) event.title = dto.title;
    if (dto.description !== undefined) event.description = dto.description;
    if (dto.eventType !== undefined) event.eventType = dto.eventType;
    if (dto.category !== undefined) event.category = dto.category;
    if (dto.locationType !== undefined) event.locationType = dto.locationType;
    if (dto.customLocation !== undefined) event.customLocation = dto.customLocation;
    if (dto.venueId !== undefined) event.venueId = dto.venueId;
    if (dto.images !== undefined) event.images = dto.images;
    if (dto.videoUrl !== undefined) event.videoUrl = dto.videoUrl;
    if (dto.ageRestriction !== undefined) event.ageRestriction = dto.ageRestriction;
    if (dto.dressCode !== undefined) event.dressCode = dto.dressCode;
    if (dto.maxTicketsPerUser !== undefined) event.maxTicketsPerUser = dto.maxTicketsPerUser;
    if (dto.tags !== undefined) event.tags = dto.tags;
    if (dto.externalUrl !== undefined) event.externalUrl = dto.externalUrl;
    const saved = await this.eventRepository.save(event);
    return this.findEventById(saved.id);
  }

  /** Delete event; throws if user is not the organizer. */
  async deleteEvent(id: string, userId: string): Promise<void> {
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: ['organizer'],
    });
    if (!event) throw new NotFoundException(`Event with ID ${id} not found`);
    if ((event.organizer as any)?.userId !== userId) {
      throw new BadRequestException('You do not have permission to delete this event');
    }
    await this.eventRepository.remove(event);
  }

  /** Update event status (publish/cancel); throws if user is not the organizer. */
  async updateStatus(id: string, status: EventStatus, userId: string): Promise<EventResponseDto> {
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: ['organizer', 'venue'],
    });
    if (!event) throw new NotFoundException(`Event with ID ${id} not found`);
    if ((event.organizer as any)?.userId !== userId) {
      throw new BadRequestException('You do not have permission to update this event');
    }
    event.status = status;
    if (status === EventStatus.PUBLISHED) event.publishDate = new Date();
    const saved = await this.eventRepository.save(event);
    return this.findEventById(saved.id);
  }

  /**
   * Track a view interaction for a user and event.
   * Fails gracefully if event_interactions table is missing (e.g. migration not yet run).
   */
  async trackView(userId: string, eventId: string): Promise<void> {
    try {
      const interaction = this.interactionRepository.create({
        userId,
        eventId,
        interactionType: EventInteractionType.VIEW,
        weight: 1,
      });
      await this.interactionRepository.save(interaction);
    } catch (err: any) {
      // Log but don't throw – table may not exist yet (run migration 004)
      this.logger.warn(
        `trackView failed (event_interactions table may be missing): ${err?.message}`,
      );
    }
  }
}
