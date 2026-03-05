import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository, DataSource } from 'typeorm';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketType, Currency } from './entities/ticket-type.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Ticket, TicketStatus } from './entities/ticket.entity';
import { Event, EventStatus } from '../events/entities/event.entity';
import { User } from '../users/entities/user.entity';
import { Waitlist } from './entities/waitlist.entity';
import { RefundRequest } from './entities/refund-request.entity';
import { TicketTransfer } from './entities/ticket-transfer.entity';

describe('TicketsService', () => {
  let service: TicketsService;
  let ticketTypeRepository: jest.Mocked<Repository<TicketType>>;
  let ticketRepository: jest.Mocked<Repository<Ticket>>;
  let eventRepository: jest.Mocked<Repository<Event>>;

  const mockTicketType: Partial<TicketType> = {
    id: 'tt-1',
    eventId: 'event-1',
    name: 'General Admission',
    price: 1000,
    currency: Currency.KES,
    quantityAvailable: 100,
    quantitySold: 0,
  };

  const mockEvent: Partial<Event> = {
    id: 'event-1',
    title: 'Test Event',
    organizerId: 'org-profile-1',
    status: EventStatus.PUBLISHED,
  };

  const createMockRepo = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        { provide: getRepositoryToken(TicketType), useValue: createMockRepo() },
        { provide: getRepositoryToken(Order), useValue: createMockRepo() },
        { provide: getRepositoryToken(OrderItem), useValue: createMockRepo() },
        { provide: getRepositoryToken(Ticket), useValue: createMockRepo() },
        { provide: getRepositoryToken(Waitlist), useValue: createMockRepo() },
        { provide: getRepositoryToken(RefundRequest), useValue: createMockRepo() },
        { provide: getRepositoryToken(TicketTransfer), useValue: createMockRepo() },
        { provide: getRepositoryToken(Event), useValue: createMockRepo() },
        { provide: getRepositoryToken(User), useValue: createMockRepo() },
        {
          provide: DataSource,
          useValue: { createQueryRunner: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'QR_HMAC_SECRET') return 'test-hmac-secret';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
    ticketTypeRepository = module.get(getRepositoryToken(TicketType));
    ticketRepository = module.get(getRepositoryToken(Ticket));
    eventRepository = module.get(getRepositoryToken(Event));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTicketTypes', () => {
    it('should return ticket types for an event', async () => {
      eventRepository.findOne.mockResolvedValue(mockEvent as Event);
      ticketTypeRepository.find.mockResolvedValue([mockTicketType as TicketType]);
      const result = await service.getTicketTypes('event-1');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('General Admission');
      expect(result[0].price).toBe(1000);
    });

    it('should return empty array if no ticket types', async () => {
      eventRepository.findOne.mockResolvedValue(mockEvent as Event);
      ticketTypeRepository.find.mockResolvedValue([]);
      const result = await service.getTicketTypes('event-1');
      expect(result).toEqual([]);
    });

    it('should throw NotFoundException if event not found', async () => {
      eventRepository.findOne.mockResolvedValue(null);
      await expect(service.getTicketTypes('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('QR Payload Generation & Verification', () => {
    it('should generate a valid QR payload with HMAC signature', () => {
      const payload = (service as any).generateQRPayload('ticket-1', 'event-1');

      expect(payload).toHaveProperty('qrCode');
      expect(payload).toHaveProperty('qrCodeHash');

      const parsed = JSON.parse(payload.qrCode);
      expect(parsed.t).toBe('ticket-1');
      expect(parsed.e).toBe('event-1');
      expect(parsed.sig).toBe(payload.qrCodeHash);
    });

    it('should verify a valid QR payload', () => {
      const { qrCodeHash } = (service as any).generateQRPayload('ticket-1', 'event-1');
      const isValid = service.verifyQRPayload('ticket-1', 'event-1', qrCodeHash);
      expect(isValid).toBe(true);
    });

    it('should reject a tampered QR payload', () => {
      const { qrCodeHash } = (service as any).generateQRPayload('ticket-1', 'event-1');
      const isValid = service.verifyQRPayload('ticket-FAKE', 'event-1', qrCodeHash);
      expect(isValid).toBe(false);
    });

    it('should reject a forged signature', () => {
      const fakeHash = 'a'.repeat(64);
      const isValid = service.verifyQRPayload('ticket-1', 'event-1', fakeHash);
      expect(isValid).toBe(false);
    });

    it('should produce different signatures for different tickets', () => {
      const p1 = (service as any).generateQRPayload('ticket-1', 'event-1');
      const p2 = (service as any).generateQRPayload('ticket-2', 'event-1');
      expect(p1.qrCodeHash).not.toBe(p2.qrCodeHash);
    });
  });

  describe('checkIn', () => {
    it('should reject invalid JSON in QR code', async () => {
      await expect(service.checkIn('not-json', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject incomplete QR data', async () => {
      const incomplete = JSON.stringify({ t: 'ticket-1' });
      await expect(service.checkIn(incomplete, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject invalid HMAC signature', async () => {
      const forged = JSON.stringify({
        t: 'ticket-1',
        e: 'event-1',
        sig: 'a'.repeat(64),
      });
      await expect(service.checkIn(forged, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject if ticket not found', async () => {
      const { qrCode } = (service as any).generateQRPayload('ticket-1', 'event-1');
      ticketRepository.findOne.mockResolvedValue(null);

      await expect(service.checkIn(qrCode, 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should reject already-scanned tickets', async () => {
      const { qrCode } = (service as any).generateQRPayload('ticket-1', 'event-1');
      ticketRepository.findOne.mockResolvedValue({
        id: 'ticket-1',
        eventId: 'event-1',
        status: TicketStatus.USED,
        event: {
          ...mockEvent,
          organizer: { id: 'org-profile-1', userId: 'user-1' },
        },
      } as any);

      await expect(service.checkIn(qrCode, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject if user is not the organizer', async () => {
      const { qrCode } = (service as any).generateQRPayload('ticket-1', 'event-1');
      ticketRepository.findOne.mockResolvedValue({
        id: 'ticket-1',
        eventId: 'event-1',
        status: TicketStatus.ACTIVE,
        event: {
          ...mockEvent,
          organizer: { id: 'org-profile-1', userId: 'different-user' },
        },
      } as any);

      await expect(service.checkIn(qrCode, 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should successfully check in a valid active ticket', async () => {
      const { qrCode } = (service as any).generateQRPayload('ticket-1', 'event-1');
      const mockTicket = {
        id: 'ticket-1',
        eventId: 'event-1',
        status: TicketStatus.ACTIVE,
        event: {
          ...mockEvent,
          organizer: { id: 'org-profile-1', userId: 'user-1' },
        },
        ticketType: mockTicketType,
      };
      ticketRepository.findOne.mockResolvedValue(mockTicket as any);
      ticketRepository.save.mockResolvedValue({
        ...mockTicket,
        status: TicketStatus.USED,
      } as any);

      const result = await service.checkIn(qrCode, 'user-1');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Check-in successful');
      expect(ticketRepository.save).toHaveBeenCalled();
    });
  });

  describe('getUserTickets', () => {
    it('should return tickets ordered by createdAt DESC', async () => {
      ticketRepository.find.mockResolvedValue([]);
      await service.getUserTickets('user-1');
      expect(ticketRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        relations: ['event', 'ticketType', 'order'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('getTicketById', () => {
    it('should throw NotFoundException for missing ticket', async () => {
      ticketRepository.findOne.mockResolvedValue(null);
      await expect(service.getTicketById('x', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if ticket belongs to another user', async () => {
      ticketRepository.findOne.mockResolvedValue({
        id: 'ticket-1',
        userId: 'other-user',
      } as any);
      await expect(service.getTicketById('ticket-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
