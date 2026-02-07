import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';
import { TicketType, Currency } from './entities/ticket-type.entity';
import { Order, PaymentStatus, PaymentMethod } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Ticket, TicketStatus } from './entities/ticket.entity';
import { Waitlist, WaitlistStatus } from './entities/waitlist.entity';
import { RefundRequest, RefundStatus } from './entities/refund-request.entity';
import { TicketTransfer, TransferType, TransferStatus } from './entities/ticket-transfer.entity';
import { Event } from '../events/entities/event.entity';
import { User } from '../users/entities/user.entity';
import {
  CreateTicketTypeDto,
  CreateOrderDto,
  TransferTicketDto,
  GiftTicketDto,
  JoinWaitlistDto,
  CreateRefundRequestDto,
} from './dto';

@Injectable()
export class TicketsService {
  private readonly PLATFORM_COMMISSION_PERCENTAGE = 5.0;

  constructor(
    @InjectRepository(TicketType)
    private ticketTypeRepository: Repository<TicketType>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    @InjectRepository(Waitlist)
    private waitlistRepository: Repository<Waitlist>,
    @InjectRepository(RefundRequest)
    private refundRequestRepository: Repository<RefundRequest>,
    @InjectRepository(TicketTransfer)
    private ticketTransferRepository: Repository<TicketTransfer>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  /**
   * Create ticket types for an event
   */
  async createTicketTypes(
    eventId: string,
    userId: string,
    ticketTypes: CreateTicketTypeDto[],
  ): Promise<TicketType[]> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
      relations: ['organizer', 'organizer.user'],
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check if user is the organizer (via organizer profile)
    if (!event.organizer || event.organizer.userId !== userId) {
      throw new ForbiddenException('You do not have permission to create ticket types for this event');
    }

    const createdTicketTypes = ticketTypes.map((dto) =>
      this.ticketTypeRepository.create({
        ...dto,
        eventId,
        currency: dto.currency || Currency.KES,
        isActive: dto.isActive ?? true,
        saleStartDate: dto.saleStartDate ? new Date(dto.saleStartDate) : null,
        saleEndDate: dto.saleEndDate ? new Date(dto.saleEndDate) : null,
      }),
    );

    return this.ticketTypeRepository.save(createdTicketTypes);
  }

  /**
   * Get ticket types for an event
   */
  async getTicketTypes(eventId: string): Promise<any[]> {
    const event = await this.eventRepository.findOne({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const types = await this.ticketTypeRepository.find({
      where: { eventId, isActive: true },
      order: { price: 'ASC' },
    });
    return types.map((tt) => ({
      id: tt.id,
      eventId: tt.eventId,
      name: tt.name,
      description: tt.description,
      price: Number(tt.price),
      currency: tt.currency,
      quantityAvailable: tt.quantityAvailable,
      quantitySold: tt.quantitySold,
      availableQuantity: tt.quantityAvailable - tt.quantitySold,
      isActive: tt.isActive,
    }));
  }

  /**
   * Generate QR code for a ticket
   */
  private async generateQRCode(ticketId: string, eventId: string, userId: string): Promise<string> {
    const qrData = JSON.stringify({
      ticketId,
      eventId,
      userId,
      timestamp: Date.now(),
    });

    // Generate QR code as data URL
    try {
      return await QRCode.toDataURL(qrData);
    } catch (error) {
      // Fallback: return the data as string if QR generation fails
      return qrData;
    }
  }

  /**
   * Generate QR code hash for verification
   */
  private generateQRCodeHash(qrCode: string): string {
    return crypto.createHash('sha256').update(qrCode).digest('hex');
  }

  /**
   * Generate unique order number
   */
  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  /**
   * Calculate order totals including commissions
   */
  private calculateOrderTotals(
    subtotal: number,
    venueFeePercentage?: number,
    venueFeeFixed?: number,
  ): {
    subtotal: number;
    platformCommission: number;
    venueFee: number;
    total: number;
    netAmount: number;
  } {
    const platformCommission = (subtotal * this.PLATFORM_COMMISSION_PERCENTAGE) / 100;
    const venueFee = venueFeePercentage
      ? (subtotal * venueFeePercentage) / 100
      : venueFeeFixed || 0;
    const total = subtotal;
    const netAmount = subtotal - platformCommission - venueFee;

    return {
      subtotal,
      platformCommission,
      venueFee,
      total,
      netAmount,
    };
  }

  /**
   * Create an order and tickets
   */
  async createOrder(userId: string, createOrderDto: CreateOrderDto): Promise<Order> {
    const { eventId, items, paymentMethod, phoneNumber } = createOrderDto;

    // Validate event exists
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
      relations: ['organizer', 'venue'],
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Validate M-Pesa phone number if needed
    if (paymentMethod === PaymentMethod.MPESA && !phoneNumber) {
      throw new BadRequestException('Phone number is required for M-Pesa payments');
    }

    // Use transaction to ensure data consistency
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate ticket types and availability
      const ticketTypeIds = items.map((item) => item.ticketTypeId);
      const ticketTypes = await queryRunner.manager.find(TicketType, {
        where: {
          id: In(ticketTypeIds),
          eventId,
        },
      });

      if (ticketTypes.length !== items.length) {
        throw new NotFoundException('One or more ticket types not found');
      }

      // Calculate subtotal and validate availability
      let subtotal = 0;
      const orderItems: OrderItem[] = [];

      for (const item of items) {
        const ticketType = ticketTypes.find((tt) => tt.id === item.ticketTypeId);
        if (!ticketType) {
          throw new NotFoundException(`Ticket type ${item.ticketTypeId} not found`);
        }

        if (!ticketType.isOnSale) {
          throw new BadRequestException(`Ticket type ${ticketType.name} is not on sale`);
        }

        if (ticketType.availableQuantity < item.quantity) {
          throw new BadRequestException(
            `Insufficient tickets available for ${ticketType.name}. Available: ${ticketType.availableQuantity}`,
          );
        }

        const itemTotal = ticketType.price * item.quantity;
        subtotal += itemTotal;

        // Create order item
        const orderItem = queryRunner.manager.create(OrderItem, {
          ticketTypeId: ticketType.id,
          quantity: item.quantity,
          unitPrice: ticketType.price,
          totalPrice: itemTotal,
        });
        orderItems.push(orderItem);
      }

      // Calculate totals with commissions
      const venueFeePercentage = event.venueFeeType === 'percentage' ? event.venueFeePercentage : null;
      const venueFeeFixed = event.venueFeeType === 'fixed' ? event.venueFeeAmount : null;
      const totals = this.calculateOrderTotals(subtotal, venueFeePercentage, venueFeeFixed);

      // Create order
      const order = queryRunner.manager.create(Order, {
        userId,
        eventId,
        orderNumber: this.generateOrderNumber(),
        totalAmount: totals.total,
        currency: Currency.KES, // Default to KES, can be made dynamic
        platformCommissionPercentage: this.PLATFORM_COMMISSION_PERCENTAGE,
        platformCommissionAmount: totals.platformCommission,
        venueFeeAmount: totals.venueFee,
        netAmount: totals.netAmount,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod,
      });

      const savedOrder = await queryRunner.manager.save(Order, order);

      // Link order items to order
      orderItems.forEach((item) => {
        item.orderId = savedOrder.id;
      });
      await queryRunner.manager.save(OrderItem, orderItems);

      // Create tickets and update ticket type quantities
      const tickets: Ticket[] = [];
      for (const item of items) {
        const ticketType = ticketTypes.find((tt) => tt.id === item.ticketTypeId);

        // Update ticket type sold count
        ticketType.quantitySold += item.quantity;
        await queryRunner.manager.save(TicketType, ticketType);

        // Create individual tickets
        for (let i = 0; i < item.quantity; i++) {
          const tempTicketId = crypto.randomUUID();
          const qrCode = await this.generateQRCode(
            tempTicketId,
            eventId,
            userId,
          );
          const qrCodeHash = this.generateQRCodeHash(qrCode);

          const ticket = queryRunner.manager.create(Ticket, {
            userId,
            eventId,
            ticketTypeId: ticketType.id,
            orderId: savedOrder.id,
            qrCode,
            qrCodeHash,
            status: TicketStatus.ACTIVE,
          });

          tickets.push(ticket);
        }
      }

      await queryRunner.manager.save(Ticket, tickets);

      await queryRunner.commitTransaction();

      // Return order with relations
      return this.orderRepository.findOne({
        where: { id: savedOrder.id },
        relations: ['orderItems', 'orderItems.ticketType', 'tickets', 'event'],
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get user's tickets
   */
  async getUserTickets(userId: string): Promise<Ticket[]> {
    return this.ticketRepository.find({
      where: { userId },
      relations: ['event', 'ticketType', 'order'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get ticket by ID with QR code
   */
  async getTicketById(ticketId: string, userId: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
      relations: ['event', 'ticketType', 'order', 'user'],
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.userId !== userId) {
      throw new ForbiddenException('You do not have permission to view this ticket');
    }

    return ticket;
  }

  /**
   * Transfer ticket to another user
   */
  async transferTicket(
    ticketId: string,
    userId: string,
    transferDto: TransferTicketDto,
  ): Promise<TicketTransfer> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
      relations: ['event'],
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.userId !== userId) {
      throw new ForbiddenException('You do not have permission to transfer this ticket');
    }

    if (ticket.status !== TicketStatus.ACTIVE) {
      throw new BadRequestException('Only active tickets can be transferred');
    }

    if (ticket.isTransferred) {
      throw new BadRequestException('This ticket has already been transferred');
    }

    // Check if event has passed
    if (new Date() > ticket.event.endDate) {
      throw new BadRequestException('Cannot transfer ticket for past events');
    }

    // Create transfer record
    const transfer = this.ticketTransferRepository.create({
      ticketId,
      originalUserId: userId,
      transferType: TransferType.TRANSFER,
      recipientEmail: transferDto.recipientEmail,
      message: transferDto.message,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      transferStatus: TransferStatus.PENDING,
    });

    return this.ticketTransferRepository.save(transfer);
  }

  /**
   * Gift ticket to another user
   */
  async giftTicket(
    ticketId: string,
    userId: string,
    giftDto: GiftTicketDto,
  ): Promise<TicketTransfer> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
      relations: ['event'],
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.userId !== userId) {
      throw new ForbiddenException('You do not have permission to gift this ticket');
    }

    if (ticket.status !== TicketStatus.ACTIVE) {
      throw new BadRequestException('Only active tickets can be gifted');
    }

    // Create transfer record
    const transfer = this.ticketTransferRepository.create({
      ticketId,
      originalUserId: userId,
      transferType: TransferType.GIFT,
      recipientEmail: giftDto.recipientEmail,
      message: giftDto.message,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      transferStatus: TransferStatus.PENDING,
    });

    return this.ticketTransferRepository.save(transfer);
  }

  /**
   * Join waitlist for sold-out event
   */
  async joinWaitlist(userId: string, waitlistDto: JoinWaitlistDto): Promise<Waitlist> {
    const { eventId, ticketTypeId, quantity = 1 } = waitlistDto;

    const event = await this.eventRepository.findOne({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check if already on waitlist
    const existing = await this.waitlistRepository.findOne({
      where: {
        userId,
        eventId,
        ticketTypeId: ticketTypeId || null,
        status: WaitlistStatus.ACTIVE,
      },
    });

    if (existing) {
      throw new BadRequestException('You are already on the waitlist for this event');
    }

    const waitlist = this.waitlistRepository.create({
      userId,
      eventId,
      ticketTypeId,
      quantity,
      status: WaitlistStatus.ACTIVE,
    });

    return this.waitlistRepository.save(waitlist);
  }

  /**
   * Get user's waitlist entries
   */
  async getUserWaitlist(userId: string): Promise<Waitlist[]> {
    return this.waitlistRepository.find({
      where: { userId },
      relations: ['event', 'ticketType'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Cancel / leave a waitlist entry
   */
  async cancelWaitlistEntry(userId: string, waitlistId: string): Promise<Waitlist> {
    const entry = await this.waitlistRepository.findOne({
      where: { id: waitlistId },
    });

    if (!entry) {
      throw new NotFoundException('Waitlist entry not found');
    }

    if (entry.userId !== userId) {
      throw new ForbiddenException('You do not have permission to modify this waitlist entry');
    }

    if (entry.status !== WaitlistStatus.ACTIVE) {
      throw new BadRequestException('Only active waitlist entries can be cancelled');
    }

    entry.status = WaitlistStatus.CANCELLED;
    return this.waitlistRepository.save(entry);
  }

  /**
   * Create refund request
   */
  async createRefundRequest(
    ticketId: string,
    userId: string,
    refundDto: CreateRefundRequestDto,
  ): Promise<RefundRequest> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
      relations: ['event', 'order', 'ticketType'],
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.userId !== userId) {
      throw new ForbiddenException('You do not have permission to request refund for this ticket');
    }

    if (ticket.status !== TicketStatus.ACTIVE) {
      throw new BadRequestException('Only active tickets can be refunded');
    }

    // Check if event has passed
    if (new Date() > ticket.event.endDate) {
      throw new BadRequestException('Cannot request refund for past events');
    }

    // Check if already has pending refund request
    const existingRequest = await this.refundRequestRepository.findOne({
      where: {
        ticketId,
        status: RefundStatus.PENDING,
      },
    });

    if (existingRequest) {
      throw new BadRequestException('You already have a pending refund request for this ticket');
    }

    const refundRequest = this.refundRequestRepository.create({
      ticketId,
      userId,
      eventId: ticket.eventId,
      reason: refundDto.reason,
      refundAmount: ticket.ticketType.price,
      status: RefundStatus.PENDING,
    });

    return this.refundRequestRepository.save(refundRequest);
  }
}
