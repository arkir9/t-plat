import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketType, Currency } from './entities/ticket-type.entity';
import { Order } from './entities/order.entity';
import { Ticket } from './entities/ticket.entity';
import { Event, EventStatus } from '../events/entities/event.entity';
import { User } from '../users/entities/user.entity';
import { OrderItem } from './entities/order-item.entity';
import { Waitlist } from './entities/waitlist.entity';
import { RefundRequest } from './entities/refund-request.entity';
import { TicketTransfer } from './entities/ticket-transfer.entity';

describe('TicketsService', () => {
  let service: TicketsService;
  let ticketTypeRepository: jest.Mocked<Repository<TicketType>>;
  let orderRepository: jest.Mocked<Repository<Order>>;
  let orderItemRepository: jest.Mocked<Repository<OrderItem>>;
  let ticketRepository: jest.Mocked<Repository<Ticket>>;
  let waitlistRepository: jest.Mocked<Repository<Waitlist>>;
  let refundRequestRepository: jest.Mocked<Repository<RefundRequest>>;
  let ticketTransferRepository: jest.Mocked<Repository<TicketTransfer>>;
  let eventRepository: jest.Mocked<Repository<Event>>;
  let userRepository: jest.Mocked<Repository<User>>;

  const mockEvent: Partial<Event> = {
    id: 'event-1',
    title: 'Test Event',
    organizerId: 'organizer-1',
    status: EventStatus.PUBLISHED,
  };

  const mockTicketType: Partial<TicketType> = {
    id: 'ticket-type-1',
    eventId: 'event-1',
    name: 'General Admission',
    price: 1000,
    currency: Currency.KES,
    quantityAvailable: 100,
    quantitySold: 0,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: getRepositoryToken(TicketType),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Order),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Ticket),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Waitlist),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RefundRequest),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(TicketTransfer),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Event),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
    ticketTypeRepository = module.get(getRepositoryToken(TicketType));
    orderRepository = module.get(getRepositoryToken(Order));
    orderItemRepository = module.get(getRepositoryToken(OrderItem));
    ticketRepository = module.get(getRepositoryToken(Ticket));
    waitlistRepository = module.get(getRepositoryToken(Waitlist));
    refundRequestRepository = module.get(getRepositoryToken(RefundRequest));
    ticketTransferRepository = module.get(getRepositoryToken(TicketTransfer));
    eventRepository = module.get(getRepositoryToken(Event));
    userRepository = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTicketTypes', () => {
    it('should return ticket types for an event', async () => {
      ticketTypeRepository.find.mockResolvedValue([mockTicketType as TicketType]);

      const result = await service.getTicketTypes('event-1');

      expect(ticketTypeRepository.find).toHaveBeenCalledWith({
        where: { eventId: 'event-1' },
      });
      expect(result).toEqual([mockTicketType]);
    });
  });
});
