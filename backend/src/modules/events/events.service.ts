import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Brackets } from 'typeorm';
import { Event, EventStatus } from './entities/event.entity';
import { EventInteraction, EventInteractionType } from './entities/event-interaction.entity';
import { BaseService } from '../../common/base/base.service';
import { CreateEventDto, UpdateEventDto, EventQueryDto, EventResponseDto } from './dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class EventsService extends BaseService<Event> {
  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(EventInteraction)
    private interactionRepository: Repository<EventInteraction>,
  ) {
    super(eventRepository);
  }

  /**
   * Create a new event
   */
  async createEvent(organizerId: string, createEventDto: CreateEventDto): Promise<Event> {
    // Validate dates
    const startDate = new Date(createEventDto.startDate);
    const endDate = new Date(createEventDto.endDate);

    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    if (startDate < new Date()) {
      throw new BadRequestException('Start date cannot be in the past');
    }

    // Validate venue fee
    if (createEventDto.venueFeeType === 'percentage' && !createEventDto.venueFeePercentage) {
      throw new BadRequestException('Venue fee percentage is required when fee type is percentage');
    }

    if (createEventDto.venueFeeType === 'fixed' && !createEventDto.venueFeeAmount) {
      throw new BadRequestException('Venue fee amount is required when fee type is fixed');
    }

    const event = this.eventRepository.create({
      ...createEventDto,
      organizerId,
      startDate,
      endDate,
      publishDate: createEventDto.publishDate ? new Date(createEventDto.publishDate) : null,
    });

    return this.eventRepository.save(event);
  }

  /**
   * Find events with advanced filtering and search
   */
  async findEvents(queryDto: EventQueryDto): Promise<PaginatedResponse<EventResponseDto>> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        organizerId,
        venueId,
        category,
        eventType,
        status,
        locationType,
        startDateFrom: dtoStartFrom,
        startDateTo: dtoStartTo,
        startDate: dtoStart,
        endDate: dtoEnd,
        city,
        country,
        featured,
        sponsored,
        upcoming,
        tags,
        latitude,
        longitude,
        radius,
        sortBy = 'start_date',
        sortOrder = 'asc',
      } = queryDto;
      const startDateFrom = dtoStartFrom ?? dtoStart;
      const startDateTo = dtoStartTo ?? dtoEnd;
      const startDate = dtoStart;

      const queryBuilder = this.eventRepository
        .createQueryBuilder('event')
        .leftJoinAndSelect('event.organizer', 'organizer')
        .leftJoinAndSelect('event.venue', 'venue');

      // Apply filters
      this.applyEventFilters(queryBuilder, {
        search,
        organizerId,
        venueId,
        category,
        eventType,
        status,
        locationType,
        startDateFrom,
        startDateTo,
        startDate,
        city,
        country,
        featured,
        sponsored,
        upcoming,
        tags,
        latitude,
        longitude,
        radius,
      });

      // Apply sorting
      this.applyEventSorting(queryBuilder, sortBy, sortOrder);

      // Apply pagination
      const offset = (page - 1) * limit;
      queryBuilder.skip(offset).take(limit);

      const [events, total] = await queryBuilder.getManyAndCount();

      // Transform to response DTOs
      const eventDtos = events.map(event => this.transformEventToDto(event));

      return new PaginatedResponse(eventDtos, total, page, limit);
    } catch (err) {
      // Return empty result instead of 500 (e.g. missing columns, DB issues)
      const page = queryDto?.page ?? 1;
      const limit = queryDto?.limit ?? 10;
      return new PaginatedResponse([], 0, page, limit);
    }
  }

  /**
   * Find event by ID with relations
   */
  async findEventById(id: string): Promise<EventResponseDto> {
    const event = await this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.organizer', 'organizer')
      .leftJoinAndSelect('event.venue', 'venue')
      .where('event.id = :id', { id })
      .getOne();

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return this.transformEventToDto(event);
  }

  /**
   * Update event
   */
  async updateEvent(
    id: string,
    organizerId: string,
    updateEventDto: UpdateEventDto,
  ): Promise<EventResponseDto> {
    const event = await this.findOne({ id });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    if (event.organizerId !== organizerId) {
      throw new ForbiddenException('You can only update your own events');
    }

    // Validate dates if provided
    if (updateEventDto.startDate || updateEventDto.endDate) {
      const startDate = updateEventDto.startDate ? new Date(updateEventDto.startDate) : event.startDate;
      const endDate = updateEventDto.endDate ? new Date(updateEventDto.endDate) : event.endDate;

      if (startDate >= endDate) {
        throw new BadRequestException('Start date must be before end date');
      }
    }

    // Update entity
    Object.assign(event, {
      ...updateEventDto,
      startDate: updateEventDto.startDate ? new Date(updateEventDto.startDate) : event.startDate,
      endDate: updateEventDto.endDate ? new Date(updateEventDto.endDate) : event.endDate,
      publishDate: updateEventDto.publishDate ? new Date(updateEventDto.publishDate) : event.publishDate,
    });

    const updatedEvent = await this.eventRepository.save(event);
    return this.findEventById(updatedEvent.id);
  }

  /**
   * Delete event
   */
  async deleteEvent(id: string, organizerId: string): Promise<void> {
    const event = await this.findOne({ id });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    if (event.organizerId !== organizerId) {
      throw new ForbiddenException('You can only delete your own events');
    }

    await this.delete(id);
  }

  /**
   * Publish event
   */
  async publishEvent(id: string, organizerId: string): Promise<EventResponseDto> {
    const event = await this.findOne({ id });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    if (event.organizerId !== organizerId) {
      throw new ForbiddenException('You can only publish your own events');
    }

    if (event.status !== EventStatus.DRAFT) {
      throw new BadRequestException('Only draft events can be published');
    }

    event.status = EventStatus.PUBLISHED;
    event.publishDate = new Date();

    await this.eventRepository.save(event);
    return this.findEventById(id);
  }

  /**
   * Cancel event
   */
  async cancelEvent(id: string, organizerId: string): Promise<EventResponseDto> {
    const event = await this.findOne({ id });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    if (event.organizerId !== organizerId) {
      throw new ForbiddenException('You can only cancel your own events');
    }

    if (event.status === EventStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed events');
    }

    event.status = EventStatus.CANCELLED;
    await this.eventRepository.save(event);
    return this.findEventById(id);
  }

  /**
   * Get events for a specific organizer
   */
  async getOrganizerEvents(
    organizerId: string,
    queryDto: Partial<EventQueryDto> = {},
  ): Promise<PaginatedResponse<EventResponseDto>> {
    return this.findEvents({
      page: 1,
      limit: 10,
      ...queryDto,
      organizerId,
    } as EventQueryDto);
  }

  /**
   * Get nearby events based on location
   */
  async getNearbyEvents(
    latitude: number,
    longitude: number,
    radius: number = 25,
    queryDto: Partial<EventQueryDto> = {},
  ): Promise<PaginatedResponse<EventResponseDto>> {
    return this.findEvents({
      page: 1,
      limit: 50,
      status: EventStatus.PUBLISHED,
      ...queryDto,
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      radius: radius.toString(),
    } as EventQueryDto);
  }

  /**
   * Get featured events
   */
  async getFeaturedEvents(
    queryDto: Partial<EventQueryDto> = {},
  ): Promise<PaginatedResponse<EventResponseDto>> {
    return this.findEvents({
      page: 1,
      limit: 10,
      ...queryDto,
      featured: true,
      status: EventStatus.PUBLISHED,
    } as EventQueryDto);
  }

  /**
   * Get sponsored events (paid advertising placements)
   */
  async getSponsoredEvents(
    queryDto: Partial<EventQueryDto> = {},
  ): Promise<PaginatedResponse<EventResponseDto>> {
    return this.findEvents({
      page: 1,
      limit: 10,
      ...queryDto,
      sponsored: true,
      status: EventStatus.PUBLISHED,
    } as EventQueryDto);
  }

  /**
   * Track a lightweight interaction for personalization (views, wishlist, purchase, etc.)
   */
  async trackInteraction(
    userId: string,
    eventId: string,
    interactionType: EventInteractionType,
  ): Promise<void> {
    // Ensure event exists and is published; if not, silently ignore to avoid noisy errors
    const event = await this.eventRepository.findOne({ where: { id: eventId } });
    if (!event) {
      return;
    }

    let weight = 1;
    switch (interactionType) {
      case EventInteractionType.WISHLIST:
        weight = 3;
        break;
      case EventInteractionType.PURCHASE:
        weight = 5;
        break;
      case EventInteractionType.SHARE:
        weight = 2;
        break;
      case EventInteractionType.CHECKIN:
        weight = 4;
        break;
      default:
        weight = 1;
    }

    const interaction = this.interactionRepository.create({
      userId,
      eventId,
      interactionType,
      weight,
    });

    // Best-effort only: if the table or DB is not ready, don't break UX
    try {
      await this.interactionRepository.save(interaction);
    } catch {
      // swallow errors for personalization tracking
    }
  }

  /**
   * Simple rule-based recommendations:
   * - Look at user's past interactions grouped by category/tags
   * - Recommend upcoming published events in those categories they haven't interacted with much yet
   */
  async getRecommendedEventsForUser(userId: string, limit: number = 10): Promise<EventResponseDto[]> {
    try {
      // 1) Find the user's strongest categories based on interaction weights
      const qb = this.interactionRepository
        .createQueryBuilder('interaction')
        .innerJoin('interaction.event', 'event')
        .select('event.category', 'category')
        .addSelect('SUM(interaction.weight)', 'score')
        .where('interaction.userId = :userId', { userId })
        .andWhere('event.status = :status', { status: EventStatus.PUBLISHED })
        .andWhere('event.startDate > :now', { now: new Date() })
        .andWhere('event.category IS NOT NULL')
        .groupBy('event.category')
        .orderBy('score', 'DESC')
        .limit(5);

      const preferredCategoriesRaw = await qb.getRawMany<{ category: string; score: string }>();
      const preferredCategories = preferredCategoriesRaw.map((row) => row.category).filter(Boolean);

      if (!preferredCategories.length) {
        // Fallback: just return some upcoming featured / popular events
        const fallback = await this.getFeaturedEvents({ upcoming: true, limit });
        return fallback.data;
      }

      // 2) Recommend upcoming events in those categories (excluding ones the user already interacted with)
      const interactedEventIds = await this.interactionRepository
        .createQueryBuilder('interaction')
        .select('DISTINCT interaction.eventId', 'eventId')
        .where('interaction.userId = :userId', { userId })
        .getRawMany<{ eventId: string }>();

      const excludeIds = interactedEventIds.map((row) => row.eventId);

      const recQuery = this.eventRepository
        .createQueryBuilder('event')
        .leftJoinAndSelect('event.organizer', 'organizer')
        .leftJoinAndSelect('event.venue', 'venue')
        .where('event.status = :status', { status: EventStatus.PUBLISHED })
        .andWhere('event.startDate > :now', { now: new Date() })
        .andWhere('event.category IN (:...categories)', { categories: preferredCategories })
        .orderBy('event.startDate', 'ASC')
        .limit(limit);

      if (excludeIds.length) {
        recQuery.andWhere('event.id NOT IN (:...excludeIds)', { excludeIds });
      }

      const events = await recQuery.getMany();
      return events.map((event) => this.transformEventToDto(event));
    } catch {
      // If personalization queries fail (eg. event_interactions table missing), fall back gracefully
      const fallback = await this.getFeaturedEvents({ upcoming: true, limit });
      return fallback.data;
    }
  }

  // Private helper methods

  private applyEventFilters(
    queryBuilder: SelectQueryBuilder<Event>,
    filters: any,
  ): void {
    const {
      search,
      organizerId,
      venueId,
      category,
      eventType,
      status,
      locationType,
      startDateFrom,
      startDateTo,
      startDate,
      city,
      country,
      featured,
      sponsored,
      upcoming,
      tags,
      latitude,
      longitude,
      radius,
    } = filters;

    // Text search
    if (search) {
      queryBuilder.andWhere(
        new Brackets(qb => {
          qb.where('event.title ILIKE :search', { search: `%${search}%` })
            .orWhere('event.description ILIKE :search', { search: `%${search}%` })
            .orWhere('organizer.name ILIKE :search', { search: `%${search}%` });
        }),
      );
    }

    // Basic filters
    if (organizerId) {
      queryBuilder.andWhere('event.organizerId = :organizerId', { organizerId });
    }

    if (venueId) {
      queryBuilder.andWhere('event.venueId = :venueId', { venueId });
    }

    if (category) {
      queryBuilder.andWhere('LOWER(event.category) = LOWER(:category)', { category });
    }

    if (eventType) {
      queryBuilder.andWhere('event.eventType = :eventType', { eventType });
    }

    if (status) {
      queryBuilder.andWhere('event.status = :status', { status });
    }

    if (locationType) {
      queryBuilder.andWhere('event.locationType = :locationType', { locationType });
    }

    // Date filters
    if (startDateFrom) {
      queryBuilder.andWhere('event.startDate >= :startDateFrom', { startDateFrom });
    }

    if (startDateTo) {
      queryBuilder.andWhere('event.startDate <= :startDateTo', { startDateTo });
    }

    if (startDate) {
      queryBuilder.andWhere('event.startDate >= :startDate', { startDate });
    }

    // Location filters
    if (city) {
      queryBuilder.andWhere(
        new Brackets(qb => {
          qb.where("event.custom_location->>'city' ILIKE :city", { city: `%${city}%` })
            .orWhere("venue.venue_city ILIKE :city", { city: `%${city}%` });
        }),
      );
    }

    if (country) {
      queryBuilder.andWhere("event.custom_location->>'country' ILIKE :country", { country: `%${country}%` });
    }

    // Boolean filters
    if (featured !== undefined) {
      queryBuilder.andWhere('event.isFeatured = :featured', { featured });
    }

    if (sponsored !== undefined) {
      queryBuilder.andWhere('event.isSponsored = :sponsored', { sponsored });
    }

    if (upcoming) {
      queryBuilder.andWhere('event.startDate > :now', { now: new Date() });
    }

    // Tags filter
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      queryBuilder.andWhere('event.tags && :tags', { tags: tagArray });
    }

    // Location-based search (radius) – only events with valid custom_location lat/lng
    if (latitude && longitude && radius) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const radiusKm = parseFloat(radius);

      queryBuilder.andWhere("event.custom_location IS NOT NULL");
      queryBuilder.andWhere("(event.custom_location->>'latitude') IS NOT NULL AND (event.custom_location->>'latitude') != ''");
      queryBuilder.andWhere("(event.custom_location->>'longitude') IS NOT NULL AND (event.custom_location->>'longitude') != ''");
      queryBuilder.andWhere(
        `(
          6371 * acos(
            cos(radians(:latitude)) * 
            cos(radians((event.custom_location->>'latitude')::double precision)) * 
            cos(radians((event.custom_location->>'longitude')::double precision) - radians(:longitude)) + 
            sin(radians(:latitude)) * 
            sin(radians((event.custom_location->>'latitude')::double precision))
          )
        ) <= :radius`,
        { latitude: lat, longitude: lng, radius: radiusKm },
      );
    }
  }

  private applyEventSorting(
    queryBuilder: SelectQueryBuilder<Event>,
    sortBy: string,
    sortOrder: 'asc' | 'desc',
  ): void {
    const validSortFields = ['start_date', 'title', 'created_at', 'featured', 'sponsored'];
    const field = validSortFields.includes(sortBy) ? sortBy : 'start_date';
    const order = sortOrder.toUpperCase() as 'ASC' | 'DESC';

    if (field === 'featured') {
      queryBuilder.orderBy('event.isFeatured', order);
      queryBuilder.addOrderBy('event.startDate', 'ASC');
    } else if (field === 'sponsored') {
      queryBuilder.orderBy('event.isSponsored', order);
      queryBuilder.addOrderBy('event.startDate', 'ASC');
    } else {
      const columnName = field === 'start_date' ? 'event.startDate' : `event.${field}`;
      queryBuilder.orderBy(columnName, order);
    }
  }

  private transformEventToDto(event: Event): EventResponseDto {
    const now = new Date();
    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate);
    const organizer = event.organizer
      ? {
          id: event.organizer.id,
          name: event.organizer.name ?? '',
          profileImageUrl: event.organizer.logoUrl ?? undefined,
          isVerified: false,
        }
      : { id: event.organizerId, name: '', profileImageUrl: undefined, isVerified: false };

    return {
      id: event.id,
      organizerId: event.organizerId,
      organizer,
      venueId: event.venueId ?? undefined,
      venue: event.venue
        ? {
            id: event.venue.id,
            name: event.venue.name ?? '',
            profileImageUrl: event.venue.logoUrl ?? undefined,
            address: event.venue.venueAddress ?? '',
            city: event.venue.venueCity ?? '',
            country: '',
          }
        : undefined,
      title: event.title,
      description: event.description ?? undefined,
      eventType: event.eventType ?? undefined,
      category: event.category ?? undefined,
      startDate: event.startDate,
      endDate: event.endDate,
      timezone: event.timezone ?? 'Africa/Nairobi',
      locationType: event.locationType,
      customLocation: event.customLocation ?? undefined,
      images: event.images ?? undefined,
      videoUrl: event.videoUrl ?? undefined,
      ageRestriction: event.ageRestriction ?? undefined,
      dressCode: event.dressCode ?? undefined,
      maxTicketsPerUser: event.maxTicketsPerUser ?? undefined,
      venueFeePercentage: event.venueFeePercentage ?? undefined,
      venueFeeAmount: event.venueFeeAmount ?? undefined,
      venueFeeType: event.venueFeeType ?? undefined,
      status: event.status,
      isFeatured: (event as any).isFeatured ?? false,
      isSponsored: (event as any).isSponsored ?? false,
      sponsorName: (event as any).sponsorName ?? undefined,
      bannerImageUrl: (event as any).bannerImageUrl ?? undefined,
      publishDate: event.publishDate ?? undefined,
      tags: event.tags ?? undefined,
      externalUrl: event.externalUrl ?? undefined,
      contactInfo: event.contactInfo ?? undefined,
      requirements: event.requirements ?? undefined,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      isActive: eventStart <= now && eventEnd > now,
      isPast: eventEnd < now,
      isUpcoming: eventStart > now,
      ticketsSold: 0,
      revenue: 0,
      capacity: 0,
      availableTickets: 0,
    } as EventResponseDto;
  }
}
