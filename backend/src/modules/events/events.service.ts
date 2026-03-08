import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  DataSource,
  FindOptionsWhere,
  ILike,
  MoreThanOrEqual,
  LessThanOrEqual,
  In,
  Between,
} from 'typeorm';
import { Event, EventStatus } from './entities/event.entity';
import { User } from '../users/entities/user.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { CreateEventDto, UpdateEventDto, EventQueryDto } from './dto/event-query.dto';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    private dataSource: DataSource,
  ) {}

  // ─── Public Listing ───────────────────────────────────────────────────────

  /**
   * FIX: City filtering was overly restrictive (exact match, case-sensitive)
   * which would silently drop valid events. Now uses case-insensitive ILike
   * and normalises the query value so "nairobi", "Nairobi", and "NAIROBI"
   * all return the same results.
   */
  async listEvents(query: EventQueryDto): Promise<{
    events: Event[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 20,
      city,
      eventType,
      minPrice,
      maxPrice,
      startDate,
      endDate,
      search,
      status = EventStatus.PUBLISHED,
    } = query;

    const where: FindOptionsWhere<Event> = { status };

    // ── Tonight filter ──────────────────────────────────────────────────────
    // Africa/Nairobi is UTC+3 year-round (no DST).
    // We compute local midnight and end-of-day in UTC so the DB query is simple.
    if (query.tonight) {
      const nowUtc = new Date();
      const nairobiOffsetMs = 3 * 60 * 60 * 1000;
      const localNow = new Date(nowUtc.getTime() + nairobiOffsetMs);

      const localMidnight = new Date(
        Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate(), 0, 0, 0),
      );
      const tonightStart = new Date(localMidnight.getTime() - nairobiOffsetMs);

      const localEndOfDay = new Date(
        Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate(), 23, 59, 59),
      );
      const tonightEnd = new Date(localEndOfDay.getTime() - nairobiOffsetMs);

      (where as any).startDate = Between(tonightStart, tonightEnd);
    }

    // FIX: Case-insensitive partial city match instead of strict equality
    if (city?.trim()) {
      (where as any).city = ILike(`%${city.trim()}%`);
    }

    if (eventType) {
      (where as any).eventType = eventType;
    }

    if (!query.tonight && startDate) {
      (where as any).startDate = MoreThanOrEqual(new Date(startDate));
    }

    if (endDate) {
      (where as any).endDate = LessThanOrEqual(new Date(endDate));
    }

    // For price & full-text search we use QueryBuilder (more expressive)
    if (minPrice !== undefined || maxPrice !== undefined || search) {
      return this.listEventsWithQueryBuilder(query);
    }

    const [events, total] = await this.eventRepository.findAndCount({
      where,
      relations: ['venue', 'organizer', 'ticketTypes'],
      order: { startDate: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { events, total, page, limit };
  }

  private async listEventsWithQueryBuilder(query: EventQueryDto): Promise<{
    events: Event[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 20,
      city,
      eventType,
      minPrice,
      maxPrice,
      startDate,
      endDate,
      search,
      status = EventStatus.PUBLISHED,
    } = query;

    const qb = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.venue', 'venue')
      .leftJoinAndSelect('event.organizer', 'organizer')
      .leftJoinAndSelect('event.ticketTypes', 'ticketType', 'ticketType.isActive = true')
      .where('event.status = :status', { status });

    if (query.tonight) {
      const nowUtc = new Date();
      const nairobiOffsetMs = 3 * 60 * 60 * 1000;
      const localNow = new Date(nowUtc.getTime() + nairobiOffsetMs);
      const localMidnight = new Date(
        Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate(), 0, 0, 0),
      );
      const tonightStart = new Date(localMidnight.getTime() - nairobiOffsetMs);
      const localEndOfDay = new Date(
        Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate(), 23, 59, 59),
      );
      const tonightEnd = new Date(localEndOfDay.getTime() - nairobiOffsetMs);
      qb.andWhere('event.startDate BETWEEN :tonightStart AND :tonightEnd', {
        tonightStart,
        tonightEnd,
      });
    }

    if (city?.trim()) {
      qb.andWhere('LOWER(event.city) LIKE LOWER(:city)', { city: `%${city.trim()}%` });
    }

    if (eventType) {
      qb.andWhere('event.eventType = :eventType', { eventType });
    }

    if (!query.tonight && startDate) {
      qb.andWhere('event.startDate >= :startDate', { startDate: new Date(startDate) });
    }

    if (endDate) {
      qb.andWhere('event.endDate <= :endDate', { endDate: new Date(endDate) });
    }

    if (search?.trim()) {
      qb.andWhere(
        '(LOWER(event.title) LIKE LOWER(:search) OR LOWER(event.description) LIKE LOWER(:search))',
        { search: `%${search.trim()}%` },
      );
    }

    if (minPrice !== undefined) {
      qb.andWhere('event.minTicketPrice >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      qb.andWhere('event.minTicketPrice <= :maxPrice', { maxPrice });
    }

    qb.orderBy('event.startDate', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [events, total] = await qb.getManyAndCount();
    return { events, total, page, limit };
  }

  async getEventById(eventId: string): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
      relations: ['venue', 'organizer', 'ticketTypes'],
    });

    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async getTonightEvents(
    query: EventQueryDto = {} as EventQueryDto,
  ): Promise<{
    events: Event[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.listEvents({
      ...query,
      tonight: true,
      status: EventStatus.PUBLISHED,
      sortBy: 'start_date',
      sortOrder: 'asc',
      limit: query.limit ?? 50,
    } as EventQueryDto);
  }

  // ─── Recommendations ──────────────────────────────────────────────────────

  /**
   * FIX: Previously userId was completely ignored — all users got the same
   * generic list. Now we:
   * 1. Look at the user's past ticket purchases to find preferred event types
   *    and cities.
   * 2. Score upcoming events by how well they match those preferences.
   * 3. Fall back to popular upcoming events for new users with no history.
   */
  async getRecommendedForUser(
    userId: string,
    limit = 10,
  ): Promise<Event[]> {
    const now = new Date();

    // Gather user's purchase history
    const pastTickets = await this.ticketRepository.find({
      where: { userId },
      relations: ['event'],
      take: 50,
      order: { createdAt: 'DESC' },
    });

    if (pastTickets.length === 0) {
      // Cold start: return upcoming popular events
      return this.getPopularUpcoming(limit);
    }

    // Count event types and cities from history
    const typeCounts: Record<string, number> = {};
    const cityCounts: Record<string, number> = {};

    for (const ticket of pastTickets) {
      if (!ticket.event) continue;
      const t = ticket.event.eventType;
      const c = ticket.event.city;
      if (t) typeCounts[t] = (typeCounts[t] ?? 0) + 1;
      if (c) cityCounts[c] = (cityCounts[c] ?? 0) + 1;
    }

    const topTypes = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type);

    const topCities = Object.entries(cityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([city]) => city);

    // Find upcoming events matching preferences
    const attended = pastTickets.map((t) => t.eventId).filter(Boolean);

    const qb = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.venue', 'venue')
      .leftJoinAndSelect('event.ticketTypes', 'tt', 'tt.isActive = true')
      .where('event.status = :status', { status: EventStatus.PUBLISHED })
      .andWhere('event.startDate > :now', { now });

    if (attended.length > 0) {
      qb.andWhere('event.id NOT IN (:...attended)', { attended });
    }

    if (topTypes.length > 0) {
      qb.andWhere('event.eventType IN (:...topTypes)', { topTypes });
    }

    qb.orderBy('event.startDate', 'ASC').take(limit * 2);

    const candidates = await qb.getMany();

    // Score: boost events in user's preferred cities
    const topCitySet = new Set(topCities.map((c) => c.toLowerCase()));
    const scored = candidates.map((e) => ({
      event: e,
      score: topCitySet.has((e.city ?? '').toLowerCase()) ? 2 : 1,
    }));

    scored.sort((a, b) => b.score - a.score);
    const recommended = scored.slice(0, limit).map((s) => s.event);

    // Pad with popular events if not enough
    if (recommended.length < limit) {
      const popular = await this.getPopularUpcoming(limit - recommended.length);
      const recommendedIds = new Set(recommended.map((e) => e.id));
      for (const e of popular) {
        if (!recommendedIds.has(e.id)) {
          recommended.push(e);
          if (recommended.length >= limit) break;
        }
      }
    }

    return recommended;
  }

  private async getPopularUpcoming(limit: number): Promise<Event[]> {
    return this.eventRepository.find({
      where: {
        status: EventStatus.PUBLISHED,
        startDate: MoreThanOrEqual(new Date()),
      },
      relations: ['venue', 'ticketTypes'],
      order: { viewCount: 'DESC', startDate: 'ASC' },
      take: limit,
    });
  }

  // ─── Organizer CRUD ───────────────────────────────────────────────────────

  async createEvent(userId: string, createEventDto: CreateEventDto): Promise<Event> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['organizerProfiles'],
    });

    if (!user) throw new NotFoundException('User not found');

    const approvedProfile = user.organizerProfiles?.find((p) => p.isVerified);
    if (!approvedProfile) {
      throw new ForbiddenException(
        'You must have a verified organizer profile to create events',
      );
    }

    const event = this.eventRepository.create({
      ...createEventDto,
      organizerId: approvedProfile.id,
      status: EventStatus.DRAFT,
      startDate: new Date(createEventDto.startDate),
      endDate: new Date(createEventDto.endDate),
    });

    return this.eventRepository.save(event);
  }

  async updateEvent(
    eventId: string,
    userId: string,
    updateDto: UpdateEventDto,
  ): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
      relations: ['organizer'],
    });

    if (!event) throw new NotFoundException('Event not found');
    if (event.organizer?.userId !== userId) {
      throw new ForbiddenException('You do not own this event');
    }

    Object.assign(event, updateDto);
    if (updateDto.startDate) event.startDate = new Date(updateDto.startDate);
    if (updateDto.endDate) event.endDate = new Date(updateDto.endDate);

    return this.eventRepository.save(event);
  }

  async deleteEvent(eventId: string, userId: string): Promise<{ message: string }> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
      relations: ['organizer'],
    });

    if (!event) throw new NotFoundException('Event not found');
    if (event.organizer?.userId !== userId) {
      throw new ForbiddenException('You do not own this event');
    }

    await this.eventRepository.softDelete(eventId);
    return { message: 'Event deleted successfully' };
  }

  async publishEvent(eventId: string, userId: string): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
      relations: ['organizer', 'ticketTypes'],
    });

    if (!event) throw new NotFoundException('Event not found');
    if (event.organizer?.userId !== userId) {
      throw new ForbiddenException('You do not own this event');
    }

    if (!event.ticketTypes?.length) {
      throw new ForbiddenException('Cannot publish an event with no ticket types');
    }

    event.status = EventStatus.PUBLISHED;
    event.publishedAt = new Date();
    return this.eventRepository.save(event);
  }
}