import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import {
  CreateTicketTypeDto,
  CreateOrderDto,
  TransferTicketDto,
  GiftTicketDto,
  JoinWaitlistDto,
  CreateRefundRequestDto,
} from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('tickets')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post('events/:eventId/ticket-types')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create ticket types for an event (organizer only)' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({ status: 201, description: 'Ticket types created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not event organizer' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async createTicketTypes(
    @Param('eventId') eventId: string,
    @CurrentUser() user: User,
    @Body() ticketTypes: CreateTicketTypeDto[],
  ) {
    return this.ticketsService.createTicketTypes(eventId, user.id, ticketTypes);
  }

  @Get('events/:eventId/ticket-types')
  @ApiOperation({ summary: 'Get ticket types for an event' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Ticket types retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getTicketTypes(@Param('eventId') eventId: string) {
    return this.ticketsService.getTicketTypes(eventId);
  }

  @Post('orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an order (purchase tickets)' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Event or ticket type not found' })
  async createOrder(
    @CurrentUser() user: User,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.ticketsService.createOrder(user.id, createOrderDto);
  }

  @Get('my-tickets')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user tickets' })
  @ApiResponse({ status: 200, description: 'Tickets retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyTickets(@CurrentUser() user: User) {
    return this.ticketsService.getUserTickets(user.id);
  }

  @Get(':id([0-9a-fA-F-]{36})')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get ticket by ID with QR code' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  @ApiResponse({ status: 200, description: 'Ticket retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your ticket' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async getTicket(@Param('id') ticketId: string, @CurrentUser() user: User) {
    return this.ticketsService.getTicketById(ticketId, user.id);
  }

  @Post(':id/transfer')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Transfer ticket to another user' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  @ApiResponse({ status: 201, description: 'Transfer initiated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - cannot transfer' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your ticket' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async transferTicket(
    @Param('id') ticketId: string,
    @CurrentUser() user: User,
    @Body() transferDto: TransferTicketDto,
  ) {
    return this.ticketsService.transferTicket(ticketId, user.id, transferDto);
  }

  @Post(':id/gift')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Gift ticket to another user' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  @ApiResponse({ status: 201, description: 'Gift initiated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - cannot gift' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your ticket' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async giftTicket(
    @Param('id') ticketId: string,
    @CurrentUser() user: User,
    @Body() giftDto: GiftTicketDto,
  ) {
    return this.ticketsService.giftTicket(ticketId, user.id, giftDto);
  }

  @Post('waitlist')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Join waitlist for sold-out event' })
  @ApiResponse({ status: 201, description: 'Added to waitlist successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - already on waitlist' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async joinWaitlist(
    @CurrentUser() user: User,
    @Body() waitlistDto: JoinWaitlistDto,
  ) {
    return this.ticketsService.joinWaitlist(user.id, waitlistDto);
  }

  @Get('waitlist')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user waitlist entries' })
  @ApiResponse({ status: 200, description: 'Waitlist entries retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyWaitlist(@CurrentUser() user: User) {
    return this.ticketsService.getUserWaitlist(user.id);
  }

  @Delete('waitlist/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Leave waitlist / cancel waitlist entry' })
  @ApiParam({ name: 'id', description: 'Waitlist entry ID' })
  @ApiResponse({ status: 200, description: 'Waitlist entry cancelled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your waitlist entry' })
  @ApiResponse({ status: 404, description: 'Waitlist entry not found' })
  async cancelWaitlistEntry(@Param('id') id: string, @CurrentUser() user: User) {
    return this.ticketsService.cancelWaitlistEntry(user.id, id);
  }

  @Post(':id/refund-request')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Request refund for a ticket' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  @ApiResponse({ status: 201, description: 'Refund request created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - cannot refund' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your ticket' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async createRefundRequest(
    @Param('id') ticketId: string,
    @CurrentUser() user: User,
    @Body() refundDto: CreateRefundRequestDto,
  ) {
    return this.ticketsService.createRefundRequest(ticketId, user.id, refundDto);
  }
}
