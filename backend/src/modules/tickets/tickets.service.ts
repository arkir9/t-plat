import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
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
  private readonly logger = new Logger(TicketsService.name);
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
    private configService: ConfigService,
  ) {}

  // ─── Ticket Types ─────────────────────────────────────────────────────────

  async createTicketTypes(
    eventId: string,
    userId: string,
    ticketTypes: CreateTicketTypeDto[],
  ): Promise<TicketType[]> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
      relations: ['organizer'],
    });

    if (!event) throw new NotFoundException('Event not found');

    if (!event.organizer || event.organizer.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to create ticket types for this event',
      );
    }

    const created = ticketTypes.map((dto) =>
      this.ticketTypeRepository.create({
        ...dto,
        eventId,
        currency: dto.currency ?? Currency.KES,
        isActive: dto.isActive ?? true,
        saleStartDate: dto.saleStartDate ? new Date(dto.saleStartDate) : undefined,
        saleEndDate: dto.saleEndDate ? new Date(dto.saleEndDate) : undefined,
      }),
    );

    return this.ticketTypeRepository.save(created);
  }

  async getTicketTypes(eventId: string): Promise<any[]> {
    const event = await this.eventRepository.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const types = await this.ticketTypeRepository.find({
      where: { eventId, isActive: true },
      order: { price: 'ASC' },
    });

    return types.map((tt) => this.mapTicketTypeToDto(tt));
  }

  // ─── Orders ───────────────────────────────────────────────────────────────

  async createOrder(userId: string, createOrderDto: CreateOrderDto): Promise<Order> {
    const { eventId, items, paymentMethod, phoneNumber } = createOrderDto;

    const event = await this.eventRepository.findOne({
      where: { id: eventId },
      relations: ['organizer', 'venue'],
    });
    if (!event) throw new NotFoundException('Event not found');

    if (paymentMethod === PaymentMethod.MPESA && !phoneNumber) {
      throw new BadRequestException('Phone number is required for M-Pesa payments');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lock & fetch ticket types within the transaction to prevent overselling
      const ticketTypeIds = items.map((i) => i.ticketTypeId);
      const ticketTypes = await queryRunner.manager.find(TicketType, {
        where: { id: In(ticketTypeIds), eventId },
        lock: { mode: 'pessimistic_write' },
      });

      if (ticketTypes.length !== items.length) {
        throw new NotFoundException('One or more ticket types not found for this event');
      }

      let subtotal = 0;
      const orderItemDrafts: Partial<OrderItem>[] = [];

      for (const item of items) {
        const ticketType = ticketTypes.find((tt) => tt.id === item.ticketTypeId);
        if (!ticketType) throw new NotFoundException(`Ticket type ${item.ticketTypeId} not found`);

        // FIX: isOnSale getter doesn't work on plain TypeORM objects — check fields directly
        if (!this.isTicketTypeOnSale(ticketType)) {
          throw new BadRequestException(`Ticket type "${ticketType.name}" is not currently on sale`);
        }

        const available = ticketType.quantityAvailable - ticketType.quantitySold;
        if (available < item.quantity) {
          throw new BadRequestException(
            `Only ${available} ticket(s) left for "${ticketType.name}"`,
          );
        }

        const itemTotal = Number(ticketType.price) * item.quantity;
        subtotal += itemTotal;

        orderItemDrafts.push({
          ticketTypeId: ticketType.id,
          quantity: item.quantity,
          unitPrice: Number(ticketType.price),
          totalPrice: itemTotal,
        });
      }

      const venueFeePercentage =
        event.venueFeeType === 'percentage' ? Number(event.venueFeePercentage) : null;
      const venueFeeFixed =
        event.venueFeeType === 'fixed' ? Number(event.venueFeeAmount) : null;
      const totals = this.calculateOrderTotals(subtotal, venueFeePercentage, venueFeeFixed);

      // Create order
      const order = queryRunner.manager.create(Order, {
        userId,
        eventId,
        orderNumber: this.generateOrderNumber(),
        totalAmount: totals.total,
        currency: Currency.KES,
        platformCommissionPercentage: this.PLATFORM_COMMISSION_PERCENTAGE,
        platformCommissionAmount: totals.platformCommission,
        venueFeeAmount: totals.venueFee,
        netAmount: totals.netAmount,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod,
      });

      const savedOrder = await queryRunner.manager.save(Order, order);

      // Save order items
      const savedOrderItems = orderItemDrafts.map((oi) => ({
        ...oi,
        orderId: savedOrder.id,
      }));
      await queryRunner.manager.save(OrderItem, savedOrderItems);

      // Create tickets + update sold counts
      const ticketDrafts: Partial<Ticket>[] = [];

      for (const item of items) {
        const ticketType = ticketTypes.find((tt) => tt.id === item.ticketTypeId)!;
        ticketType.quantitySold += item.quantity;
        await queryRunner.manager.save(TicketType, ticketType);

        for (let i = 0; i < item.quantity; i++) {
          const tempTicketId = crypto.randomUUID();
          const { qrCode, qrCodeHash } = this.generateQRPayload(tempTicketId, eventId);
          ticketDrafts.push({
            id: tempTicketId,
            userId,
            eventId,
            ticketTypeId: ticketType.id,
            orderId: savedOrder.id,
            qrCode,
            qrCodeHash,
            status: TicketStatus.ACTIVE,
          });
        }
      }

      await queryRunner.manager.save(Ticket, ticketDrafts);
      await queryRunner.commitTransaction();

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

  // ─── Tickets ──────────────────────────────────────────────────────────────

  async getUserTickets(userId: string): Promise<Ticket[]> {
    return this.ticketRepository.find({
      where: { userId },
      relations: ['event', 'ticketType', 'order'],
      order: { createdAt: 'DESC' },
    });
  }

  async getTicketById(ticketId: string, userId: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
      relations: ['event', 'ticketType', 'order', 'user'],
    });

    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.userId !== userId) {
      throw new ForbiddenException('You do not have permission to view this ticket');
    }

    return ticket;
  }

  // ─── Check-In ─────────────────────────────────────────────────────────────

  async checkIn(
    qrCodeRaw: string,
    organizerUserId: string,
  ): Promise<{ success: boolean; ticket: Ticket; message: string }> {
    let parsed: { t?: string; e?: string; sig?: string };
    try {
      parsed = JSON.parse(qrCodeRaw);
    } catch {
      throw new BadRequestException('Invalid QR code format');
    }

    const { t: ticketId, e: eventId, sig: signature } = parsed;
    if (!ticketId || !eventId || !signature) {
      throw new BadRequestException('Incomplete QR code data');
    }

    // Validate signature length before timingSafeEqual (prevents crashes on wrong-length input)
    const expectedLength = 64; // SHA-256 hex = 64 chars
    if (signature.length !== expectedLength) {
      throw new BadRequestException('QR code signature is invalid — possible forgery');
    }

    if (!this.verifyQRPayload(ticketId, eventId, signature)) {
      throw new BadRequestException('QR code signature is invalid — possible forgery');
    }

    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
      relations: ['event', 'event.organizer', 'ticketType'],
    });

    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.eventId !== eventId) throw new BadRequestException('QR code event mismatch');

    const organizer = ticket.event?.organizer;
    if (!organizer || organizer.userId !== organizerUserId) {
      throw new ForbiddenException('You are not the organizer of this event');
    }

    if (ticket.status === TicketStatus.USED) {
      throw new BadRequestException('Ticket already scanned');
    }
    if (ticket.status !== TicketStatus.ACTIVE) {
      throw new BadRequestException(
        `Ticket cannot be checked in — status is "${ticket.status}"`,
      );
    }

    ticket.status = TicketStatus.USED;
    ticket.checkedInAt = new Date();
    ticket.checkedInById = organizer.id;
    await this.ticketRepository.save(ticket);

    return { success: true, ticket, message: 'Check-in successful' };
  }

  // ─── Transfer & Gift ──────────────────────────────────────────────────────

  async transferTicket(
    ticketId: string,
    userId: string,
    transferDto: TransferTicketDto,
  ): Promise<TicketTransfer> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
      relations: ['event'],
    });

    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.userId !== userId) {
      throw new ForbiddenException('You do not have permission to transfer this ticket');
    }
    if (ticket.status !== TicketStatus.ACTIVE) {
      throw new BadRequestException('Only active tickets can be transferred');
    }
    if (ticket.isTransferred) {
      throw new BadRequestException('This ticket has already been transferred');
    }
    if (new Date() > ticket.event.endDate) {
      throw new BadRequestException('Cannot transfer ticket for past events');
    }

    const transfer = this.ticketTransferRepository.create({
      ticketId,
      originalUserId: userId,
      transferType: TransferType.TRANSFER,
      recipientEmail: transferDto.recipientEmail,
      message: transferDto.message,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      transferStatus: TransferStatus.PENDING,
    });

    return this.ticketTransferRepository.save(transfer);
  }

  async giftTicket(
    ticketId: string,
    userId: string,
    giftDto: GiftTicketDto,
  ): Promise<TicketTransfer> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
      relations: ['event'],
    });

    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.userId !== userId) {
      throw new ForbiddenException('You do not have permission to gift this ticket');
    }
    if (ticket.status !== TicketStatus.ACTIVE) {
      throw new BadRequestException('Only active tickets can be gifted');
    }

    const transfer = this.ticketTransferRepository.create({
      ticketId,
      originalUserId: userId,
      transferType: TransferType.GIFT,
      recipientEmail: giftDto.recipientEmail,
      message: giftDto.message,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      transferStatus: TransferStatus.PENDING,
    });

    return this.ticketTransferRepository.save(transfer);
  }

  // ─── Waitlist ─────────────────────────────────────────────────────────────

  async joinWaitlist(userId: string, waitlistDto: JoinWaitlistDto): Promise<Waitlist> {
    const { eventId, ticketTypeId, quantity = 1 } = waitlistDto;

    const event = await this.eventRepository.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const existing = await this.waitlistRepository.findOne({
      where: {
        userId,
        eventId,
        ticketTypeId: ticketTypeId ?? null,
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

  async getUserWaitlist(userId: string): Promise<Waitlist[]> {
    return this.waitlistRepository.find({
      where: { userId },
      relations: ['event', 'ticketType'],
      order: { createdAt: 'DESC' },
    });
  }

  async cancelWaitlistEntry(userId: string, waitlistId: string): Promise<Waitlist> {
    const entry = await this.waitlistRepository.findOne({ where: { id: waitlistId } });
    if (!entry) throw new NotFoundException('Waitlist entry not found');
    if (entry.userId !== userId) {
      throw new ForbiddenException('You do not have permission to modify this waitlist entry');
    }
    if (entry.status !== WaitlistStatus.ACTIVE) {
      throw new BadRequestException('Only active waitlist entries can be cancelled');
    }

    entry.status = WaitlistStatus.CANCELLED;
    return this.waitlistRepository.save(entry);
  }

  // ─── Refunds ──────────────────────────────────────────────────────────────

  async createRefundRequest(
    ticketId: string,
    userId: string,
    refundDto: CreateRefundRequestDto,
  ): Promise<RefundRequest> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
      relations: ['event', 'order', 'ticketType'],
    });

    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.userId !== userId) {
      throw new ForbiddenException('You do not have permission to request a refund for this ticket');
    }
    if (ticket.status !== TicketStatus.ACTIVE) {
      throw new BadRequestException('Only active tickets can be refunded');
    }
    if (new Date() > ticket.event.endDate) {
      throw new BadRequestException('Cannot request refund for past events');
    }

    const existingRequest = await this.refundRequestRepository.findOne({
      where: { ticketId, status: RefundStatus.PENDING },
    });
    if (existingRequest) {
      throw new BadRequestException('You already have a pending refund request for this ticket');
    }

    const refundRequest = this.refundRequestRepository.create({
      ticketId,
      userId,
      eventId: ticket.eventId,
      reason: refundDto.reason,
      refundAmount: Number(ticket.ticketType.price),
      status: RefundStatus.PENDING,
    });

    return this.refundRequestRepository.save(refundRequest);
  }

  // ─── QR Code Helpers ──────────────────────────────────────────────────────

  /**
   * Generate a cryptographically signed QR payload.
   */
  generateQRPayload(ticketId: string, eventId: string): {
    qrCode: string;
    qrCodeHash: string;
  } {
    const secret =
      this.configService.get<string>('QR_HMAC_SECRET') ?? 'tplat-qr-default-secret';
    const message = `${ticketId}:${eventId}`;
    const hmac = crypto.createHmac('sha256', secret).update(message).digest('hex');
    const qrCode = JSON.stringify({ t: ticketId, e: eventId, sig: hmac });
    return { qrCode, qrCodeHash: hmac };
  }

  /**
   * Verify a QR payload signature using timing-safe comparison.
   */
  verifyQRPayload(ticketId: string, eventId: string, signature: string): boolean {
    try {
      const secret =
        this.configService.get<string>('QR_HMAC_SECRET') ?? 'tplat-qr-default-secret';
      const expected = crypto
        .createHmac('sha256', secret)
        .update(`${ticketId}:${eventId}`)
        .digest('hex');

      const expectedBuf = Buffer.from(expected, 'hex');
      const actualBuf = Buffer.from(signature, 'hex');

      if (expectedBuf.length !== actualBuf.length) return false;
      return crypto.timingSafeEqual(expectedBuf, actualBuf);
    } catch {
      return false;
    }
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  /**
   * FIX: TypeORM returns plain objects, not class instances, so getters like
   * `isOnSale` on the entity class are not available. Check fields directly.
   */
  private isTicketTypeOnSale(tt: TicketType): boolean {
    if (!tt.isActive) return false;
    const now = new Date();
    if (tt.saleStartDate && now < new Date(tt.saleStartDate)) return false;
    if (tt.saleEndDate && now > new Date(tt.saleEndDate)) return false;
    return true;
  }

  private mapTicketTypeToDto(tt: TicketType) {
    return {
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
      isOnSale: this.isTicketTypeOnSale(tt),
      saleStartDate: tt.saleStartDate,
      saleEndDate: tt.saleEndDate,
    };
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  private calculateOrderTotals(
    subtotal: number,
    venueFeePercentage?: number | null,
    venueFeeFixed?: number | null,
  ) {
    const platformCommission = (subtotal * this.PLATFORM_COMMISSION_PERCENTAGE) / 100;
    const venueFee = venueFeePercentage
      ? (subtotal * venueFeePercentage) / 100
      : venueFeeFixed ?? 0;
    const total = subtotal + platformCommission;
    const netAmount = subtotal - venueFee;
    return { subtotal, platformCommission, venueFee, total, netAmount };
  }
}