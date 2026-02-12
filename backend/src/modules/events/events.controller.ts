import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { EventStatus } from './entities/event.entity';
import { EventsService } from './events.service';
import { OrganizersService } from '../organizers/organizers.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventQueryDto } from './dto/event-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { User } from '../users/entities/user.entity';
import { ApiPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';
import { EventResponseDto } from './dto/event-response.dto';
import { EventIngestionService } from './services/event-ingestion.service';

@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly eventIngestionService: EventIngestionService,
    private readonly organizersService: OrganizersService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createEventDto: CreateEventDto, @CurrentUser() user: User) {
    const profiles = await this.organizersService.findByUserId(user.id);
    const org = profiles.find((p) => p.profileType === 'event_organizer');
    if (!org) throw new BadRequestException('You need an organizer profile to create events');
    return this.eventsService.createEvent(createEventDto, org.id);
  }

  @Public()
  @Get()
  @ApiPaginatedResponse(EventResponseDto)
  findAll(@Query() query: EventQueryDto) {
    // Note: Uses listEvents for proper filtering; BaseService.findAll doesn't support EventQueryDto
    return this.eventsService.listEvents(query);
  }

  @Public()
  @Get('featured')
  getFeatured(@Query() query: EventQueryDto) {
    const limit = Math.min(Number(query.limit) || 10, 20);
    return this.eventsService.getFeaturedEvents(limit);
  }

  @Get('recommended/me')
  @UseGuards(JwtAuthGuard)
  getRecommended(@CurrentUser() user: User, @Query('limit') limit?: number) {
    return this.eventsService.getRecommendedForUser(user.id, limit);
  }

  @Public()
  @Get('nearby')
  getNearby(
    @Query('latitude') lat: number,
    @Query('longitude') lon: number,
    @Query('radius') radius?: number,
  ) {
    const query: EventQueryDto = {
      latitude: lat?.toString(),
      longitude: lon?.toString(),
      radius: (radius ?? 25)?.toString(),
      limit: 50,
    } as EventQueryDto;
    return this.eventsService.getNearbyEvents(query);
  }

  // --- NEW: Manual Scrape Trigger ---
  @Public()
  @Get('trigger-scrape')
  async triggerScrape() {
    await this.eventIngestionService.handleCron();
    return { message: 'Scrape triggered. Check server logs.' };
  }
  // ----------------------------------

  @Get('my-events')
  @UseGuards(JwtAuthGuard)
  async getMyEvents(@CurrentUser() user: User) {
    const profiles = await this.organizersService.findByUserId(user.id);
    const org = profiles.find((p) => p.profileType === 'event_organizer');
    if (!org) return { data: [], total: 0, page: 1, limit: 20 };
    return this.eventsService.listEventsForUser(org.id);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findEventById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @CurrentUser() user: User,
  ) {
    return this.eventsService.updateEvent(id, updateEventDto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.eventsService.deleteEvent(id, user.id);
  }

  @Post(':id/claim')
  @UseGuards(JwtAuthGuard)
  claim(@Param('id') id: string, @CurrentUser() user: User) {
    return this.eventsService.claimEvent(id, user.id);
  }

  @Public()
  @Post(':id/track-view')
  trackView(@Param('id') id: string) {
    return this.eventsService.trackInteraction(id, 'view');
  }

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard)
  publish(@Param('id') id: string, @CurrentUser() user: User) {
    return this.eventsService.updateStatus(id, EventStatus.PUBLISHED, user.id);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  cancel(@Param('id') id: string, @CurrentUser() user: User) {
    return this.eventsService.updateStatus(id, EventStatus.CANCELLED, user.id);
  }
}
