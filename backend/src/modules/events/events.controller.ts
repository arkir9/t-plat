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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto, EventQueryDto, EventResponseDto } from './dto';
import { EventStatus } from './entities/event.entity';
import { EventInteractionType } from './entities/event-interaction.entity';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ApiPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({
    status: 201,
    description: 'Event created successfully',
    type: EventResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createEvent(
    @CurrentUser() user: User,
    @Body() createEventDto: CreateEventDto,
  ): Promise<EventResponseDto> {
    // Note: In a real implementation, we'd need to get the organizer profile ID
    // For now, we'll assume the user has an organizer profile
    const event = await this.eventsService.createEvent(user.id, createEventDto);
    return this.eventsService.findEventById(event.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all events with filtering and pagination' })
  @ApiPaginatedResponse(EventResponseDto)
  @ApiQuery({ type: EventQueryDto })
  async findEvents(
    @Query() queryDto: EventQueryDto,
  ): Promise<PaginatedResponse<EventResponseDto>> {
    return this.eventsService.findEvents(queryDto);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured events' })
  @ApiPaginatedResponse(EventResponseDto)
  @ApiQuery({ type: EventQueryDto })
  async getFeaturedEvents(
    @Query() queryDto: EventQueryDto,
  ): Promise<PaginatedResponse<EventResponseDto>> {
    return this.eventsService.getFeaturedEvents(queryDto);
  }

  @Get('sponsored')
  @ApiOperation({ summary: 'Get sponsored events (paid advertising placements)' })
  @ApiPaginatedResponse(EventResponseDto)
  @ApiQuery({ type: EventQueryDto })
  async getSponsoredEvents(
    @Query() queryDto: EventQueryDto,
  ): Promise<PaginatedResponse<EventResponseDto>> {
    return this.eventsService.getSponsoredEvents(queryDto);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Get nearby events based on location' })
  @ApiPaginatedResponse(EventResponseDto)
  @ApiQuery({ name: 'latitude', required: true, type: 'number' })
  @ApiQuery({ name: 'longitude', required: true, type: 'number' })
  @ApiQuery({ name: 'radius', required: false, type: 'number', description: 'Radius in kilometers (default: 25)' })
  async getNearbyEvents(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @Query('radius') radius?: string,
    @Query() queryDto?: EventQueryDto,
  ): Promise<PaginatedResponse<EventResponseDto>> {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radiusKm = radius ? parseFloat(radius) : 25;
    // If coords invalid, return all published events (no geo filter) so app still works
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return this.eventsService.findEvents({ page: 1, limit: 50, status: EventStatus.PUBLISHED, ...queryDto } as EventQueryDto);
    }
    return this.eventsService.getNearbyEvents(lat, lng, radiusKm, queryDto);
  }

  @Get('my-events')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user\'s events' })
  @ApiPaginatedResponse(EventResponseDto)
  @ApiQuery({ type: EventQueryDto })
  async getMyEvents(
    @CurrentUser() user: User,
    @Query() queryDto: EventQueryDto,
  ): Promise<PaginatedResponse<EventResponseDto>> {
    // Note: In a real implementation, we'd get the organizer profile ID
    return this.eventsService.getOrganizerEvents(user.id, queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({
    status: 200,
    description: 'Event found',
    type: EventResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async findEventById(@Param('id') id: string): Promise<EventResponseDto> {
    return this.eventsService.findEventById(id);
  }

  @Post(':id/track-view')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Track a view interaction for personalization' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 204, description: 'View tracked' })
  async trackView(@Param('id') id: string, @CurrentUser() user: User): Promise<void> {
    await this.eventsService.trackInteraction(user.id, id, EventInteractionType.VIEW);
  }

  @Get('recommended/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get personalized recommended events for current user' })
  @ApiPaginatedResponse(EventResponseDto)
  async getRecommendedForMe(
    @CurrentUser() user: User,
    @Query('limit') limit?: string,
  ): Promise<PaginatedResponse<EventResponseDto>> {
    const parsedLimit = limit ? parseInt(limit, 10) || 10 : 10;
    const items = await this.eventsService.getRecommendedEventsForUser(user.id, parsedLimit);
    return new PaginatedResponse(items, items.length, 1, parsedLimit);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({
    status: 200,
    description: 'Event updated successfully',
    type: EventResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not event owner' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async updateEvent(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() updateEventDto: UpdateEventDto,
  ): Promise<EventResponseDto> {
    return this.eventsService.updateEvent(id, user.id, updateEventDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 204, description: 'Event deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not event owner' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async deleteEvent(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.eventsService.deleteEvent(id, user.id);
  }

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Publish event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({
    status: 200,
    description: 'Event published successfully',
    type: EventResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - event cannot be published' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not event owner' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async publishEvent(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<EventResponseDto> {
    return this.eventsService.publishEvent(id, user.id);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cancel event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({
    status: 200,
    description: 'Event cancelled successfully',
    type: EventResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - event cannot be cancelled' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not event owner' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async cancelEvent(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<EventResponseDto> {
    return this.eventsService.cancelEvent(id, user.id);
  }
}
