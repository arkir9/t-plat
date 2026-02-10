import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto, EventQueryDto, EventResponseDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { OrganizersService } from '../organizers/organizers.service';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly organizersService: OrganizersService,
  ) {}

  // ---------------------------------------------------------------------------
  // Public discovery endpoints used by the mobile app
  // ---------------------------------------------------------------------------

  @Public()
  @Get()
  @ApiOperation({ summary: 'List events (paginated)' })
  @ApiResponse({ status: 200, type: [EventResponseDto] })
  async getEvents(@Query() query: EventQueryDto) {
    return this.eventsService.listEvents(query);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('recommended/me')
  @ApiOperation({ summary: 'Get recommended events for the current user' })
  async getRecommendedForMe(
    @CurrentUser() user: User,
    @Query('limit') limit?: string,
  ): Promise<{ data: EventResponseDto[]; total: number; page: number; limit: number }> {
    const limitNum = Number(limit) > 0 ? Number(limit) : 10;
    return this.eventsService.getRecommendedForUser(user.id, limitNum);
  }

  @Public()
  @Get('featured')
  @ApiOperation({ summary: 'Get featured events for home screen' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getFeatured(@Query('limit') limit?: string) {
    const limitNum = Number(limit) > 0 ? Number(limit) : 5;
    return this.eventsService.getFeaturedEvents(limitNum);
  }

  @Public()
  @Get('nearby')
  @ApiOperation({ summary: 'Get nearby events (simplified)' })
  @ApiQuery({ name: 'latitude', required: false, type: String })
  @ApiQuery({ name: 'longitude', required: false, type: String })
  @ApiQuery({ name: 'radius', required: false, type: String })
  async getNearby(@Query() query: EventQueryDto) {
    return this.eventsService.getNearbyEvents(query);
  }

  @Public()
  @Get(':id([0-9a-fA-F-]{36})')
  @ApiOperation({ summary: 'Get event details by ID' })
  @ApiResponse({ status: 200, type: EventResponseDto })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getEventById(@Param('id') id: string): Promise<EventResponseDto> {
    return this.eventsService.findEventById(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':id([0-9a-fA-F-]{36})/track-view')
  @ApiOperation({ summary: 'Track a view interaction for personalization' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async trackView(@Param('id') id: string, @CurrentUser() user: User): Promise<void> {
    await this.eventsService.trackView(user.id, id);
  }

  // ---------------------------------------------------------------------------
  // Organizer endpoints
  // ---------------------------------------------------------------------------

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('my-events')
  @ApiOperation({ summary: 'List events owned by the current organizer' })
  async getMyEvents(
    @CurrentUser() user: User,
    @Query() query: EventQueryDto,
  ): Promise<{ data: EventResponseDto[]; total: number; page: number; limit: number }> {
    const profiles = await this.organizersService.findByUserId(user.id);
    const organizerProfile =
      profiles.find((p) => p.profileType === 'event_organizer') ?? profiles[0];
    if (!organizerProfile) {
      throw new ForbiddenException('User is not an organizer');
    }

    return this.eventsService.listEventsForOrganizer(organizerProfile.id, query);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new event (Organizer only)' })
  @ApiResponse({ status: 201, type: EventResponseDto })
  async createEvent(
    @Body() createDto: CreateEventDto,
    @CurrentUser() user: User,
  ): Promise<EventResponseDto> {
    // For now, use the primary organizer profile for this user
    const profiles = await this.organizersService.findByUserId(user.id);
    const organizerProfile =
      profiles.find((p) => p.profileType === 'event_organizer') ?? profiles[0];
    if (!organizerProfile) {
      throw new ForbiddenException('User is not an organizer');
    }

    return this.eventsService.createEvent(createDto, organizerProfile.id);
  }

  // ---------------------------------------------------------------------------
  // Claim endpoint for hybrid strategy
  // ---------------------------------------------------------------------------

  @Post(':id([0-9a-fA-F-]{36})/claim')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Claim an imported event (Organizer only)' })
  @ApiResponse({ status: 200, description: 'Event claimed successfully.' })
  async claimEvent(@Param('id') id: string, @CurrentUser() user: User) {
    const profiles = await this.organizersService.findByUserId(user.id);
    const organizerProfile =
      profiles.find((p) => p.profileType === 'event_organizer') ?? profiles[0];
    if (!organizerProfile) {
      throw new ForbiddenException('User is not an organizer');
    }
    return this.eventsService.claimEvent(id, organizerProfile.id);
  }
}
