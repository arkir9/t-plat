import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SafetyService } from './safety.service';
import { EmergencyContact } from './entities/emergency-contact.entity';
import { EventCheckIn, CheckInType } from './entities/event-check-in.entity';
import { SafetyReport, ReportStatus, ReportType } from './entities/safety-report.entity';
import { Event, EventStatus } from '../events/entities/event.entity';
import { Ticket } from '../tickets/entities/ticket.entity';

describe('SafetyService', () => {
  let service: SafetyService;
  let emergencyContactRepo: jest.Mocked<Repository<EmergencyContact>>;
  let eventCheckInRepo: jest.Mocked<Repository<EventCheckIn>>;
  let safetyReportRepo: jest.Mocked<Repository<SafetyReport>>;
  let eventRepo: jest.Mocked<Repository<Event>>;
  let ticketRepo: jest.Mocked<Repository<Ticket>>;

  const createMockRepo = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  });

  const mockEvent: Partial<Event> = {
    id: 'event-1',
    title: 'Test Event',
    status: EventStatus.PUBLISHED,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SafetyService,
        { provide: getRepositoryToken(EmergencyContact), useValue: createMockRepo() },
        { provide: getRepositoryToken(EventCheckIn), useValue: createMockRepo() },
        { provide: getRepositoryToken(SafetyReport), useValue: createMockRepo() },
        { provide: getRepositoryToken(Event), useValue: createMockRepo() },
        { provide: getRepositoryToken(Ticket), useValue: createMockRepo() },
      ],
    }).compile();

    service = module.get<SafetyService>(SafetyService);
    emergencyContactRepo = module.get(getRepositoryToken(EmergencyContact));
    eventCheckInRepo = module.get(getRepositoryToken(EventCheckIn));
    safetyReportRepo = module.get(getRepositoryToken(SafetyReport));
    eventRepo = module.get(getRepositoryToken(Event));
    ticketRepo = module.get(getRepositoryToken(Ticket));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── Emergency Contacts ─────────────────────────────────────────────────

  describe('getEmergencyContacts', () => {
    it('should return contacts ordered by primary status and creation date', async () => {
      emergencyContactRepo.find.mockResolvedValue([]);
      await service.getEmergencyContacts('user-1');

      expect(emergencyContactRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { isPrimary: 'DESC', createdAt: 'ASC' },
      });
    });
  });

  describe('addEmergencyContact', () => {
    it('should create and save a contact', async () => {
      const dto = {
        contactName: 'Jane Doe',
        contactPhone: '+254700111222',
        relationship: 'sister',
      };
      emergencyContactRepo.create.mockReturnValue({
        id: 'ec-1',
        userId: 'user-1',
        ...dto,
        isPrimary: false,
      } as any);
      emergencyContactRepo.save.mockResolvedValue({
        id: 'ec-1',
        userId: 'user-1',
        ...dto,
        isPrimary: false,
      } as any);

      const result = await service.addEmergencyContact('user-1', dto as any);

      expect(result.contactName).toBe('Jane Doe');
      expect(emergencyContactRepo.create).toHaveBeenCalled();
    });

    it('should unset other primary contacts when adding a new primary', async () => {
      const dto = {
        contactName: 'Mom',
        contactPhone: '+254700000001',
        isPrimary: true,
      };
      emergencyContactRepo.create.mockReturnValue({ ...dto, id: 'ec-2' } as any);
      emergencyContactRepo.save.mockResolvedValue({ ...dto, id: 'ec-2' } as any);

      await service.addEmergencyContact('user-1', dto as any);

      expect(emergencyContactRepo.update).toHaveBeenCalledWith(
        { userId: 'user-1', isPrimary: true },
        { isPrimary: false },
      );
    });
  });

  describe('deleteEmergencyContact', () => {
    it('should throw NotFoundException if contact does not exist', async () => {
      emergencyContactRepo.delete.mockResolvedValue({ affected: 0 } as any);
      await expect(
        service.deleteEmergencyContact('nonexistent', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should delete the contact successfully', async () => {
      emergencyContactRepo.delete.mockResolvedValue({ affected: 1 } as any);
      await expect(
        service.deleteEmergencyContact('ec-1', 'user-1'),
      ).resolves.not.toThrow();
    });
  });

  // ─── Event Check-In ─────────────────────────────────────────────────────

  describe('checkIn', () => {
    it('should throw NotFoundException if event not found', async () => {
      eventRepo.findOne.mockResolvedValue(null);
      await expect(
        service.checkIn('user-1', { eventId: 'nonexistent' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if ticket not found for user', async () => {
      eventRepo.findOne.mockResolvedValue(mockEvent as Event);
      ticketRepo.findOne.mockResolvedValue(null);

      await expect(
        service.checkIn('user-1', {
          eventId: 'event-1',
          ticketId: 'bad-ticket',
        } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if already checked in', async () => {
      eventRepo.findOne.mockResolvedValue(mockEvent as Event);
      eventCheckInRepo.findOne
        .mockResolvedValueOnce({
          id: 'ci-1',
          checkInType: CheckInType.ARRIVAL,
          createdAt: new Date('2026-02-24T10:00:00Z'),
        } as any)
        .mockResolvedValueOnce(null);

      await expect(
        service.checkIn('user-1', { eventId: 'event-1' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create arrival check-in successfully', async () => {
      eventRepo.findOne.mockResolvedValue(mockEvent as Event);
      eventCheckInRepo.findOne.mockResolvedValue(null);
      eventCheckInRepo.create.mockReturnValue({
        id: 'ci-new',
        checkInType: CheckInType.ARRIVAL,
      } as any);
      eventCheckInRepo.save.mockResolvedValue({
        id: 'ci-new',
        checkInType: CheckInType.ARRIVAL,
      } as any);

      const result = await service.checkIn('user-1', {
        eventId: 'event-1',
        latitude: -1.286389,
        longitude: 36.817223,
      } as any);

      expect(result.checkInType).toBe(CheckInType.ARRIVAL);
    });
  });

  describe('checkOut', () => {
    it('should throw NotFoundException if event not found', async () => {
      eventRepo.findOne.mockResolvedValue(null);
      await expect(service.checkOut('user-1', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if not checked in', async () => {
      eventRepo.findOne.mockResolvedValue(mockEvent as Event);
      eventCheckInRepo.findOne.mockResolvedValue(null);

      await expect(service.checkOut('user-1', 'event-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getCheckInStatus', () => {
    it('should return not checked in if no arrival found', async () => {
      eventCheckInRepo.findOne.mockResolvedValue(null);
      const result = await service.getCheckInStatus('user-1', 'event-1');
      expect(result.checkedIn).toBe(false);
    });

    it('should return checked in if arrival exists without departure', async () => {
      eventCheckInRepo.findOne
        .mockResolvedValueOnce({
          id: 'ci-1',
          checkInType: CheckInType.ARRIVAL,
          createdAt: new Date(),
        } as any)
        .mockResolvedValueOnce(null);

      const result = await service.getCheckInStatus('user-1', 'event-1');
      expect(result.checkedIn).toBe(true);
    });
  });

  // ─── Safety Reports ─────────────────────────────────────────────────────

  describe('createSafetyReport', () => {
    it('should throw NotFoundException if event not found', async () => {
      eventRepo.findOne.mockResolvedValue(null);
      await expect(
        service.createSafetyReport('user-1', {
          eventId: 'nonexistent',
          reportType: ReportType.SAFETY_CONCERN,
          description: 'Broken glass',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create and return a safety report', async () => {
      eventRepo.findOne.mockResolvedValue(mockEvent as Event);
      safetyReportRepo.create.mockReturnValue({
        id: 'sr-1',
        reportType: ReportType.SAFETY_CONCERN,
        status: ReportStatus.PENDING,
      } as any);
      safetyReportRepo.save.mockResolvedValue({
        id: 'sr-1',
        reportType: ReportType.SAFETY_CONCERN,
        status: ReportStatus.PENDING,
      } as any);

      const result = await service.createSafetyReport('user-1', {
        eventId: 'event-1',
        reportType: ReportType.SAFETY_CONCERN,
        description: 'Broken glass near stage',
      });

      expect(result.status).toBe(ReportStatus.PENDING);
    });
  });

  describe('getUserSafetyReports', () => {
    it('should return reports ordered by creation date DESC', async () => {
      safetyReportRepo.find.mockResolvedValue([]);
      await service.getUserSafetyReports('user-1');

      expect(safetyReportRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        relations: ['event'],
        order: { createdAt: 'DESC' },
      });
    });
  });
});
