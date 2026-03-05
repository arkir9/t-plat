import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { OrganizersService } from './organizers.service';
import { OrganizerProfile } from './entities/organizer-profile.entity';
import {
  OrganizerApplication,
  ApplicationStatus,
} from './entities/organizer-application.entity';

describe('OrganizersService', () => {
  let service: OrganizersService;
  let applicationRepo: jest.Mocked<Repository<OrganizerApplication>>;
  let profileRepo: jest.Mocked<Repository<OrganizerProfile>>;

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
        OrganizersService,
        { provide: getRepositoryToken(OrganizerProfile), useValue: createMockRepo() },
        { provide: getRepositoryToken(OrganizerApplication), useValue: createMockRepo() },
        {
          provide: DataSource,
          useValue: { query: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<OrganizersService>(OrganizersService);
    applicationRepo = module.get(getRepositoryToken(OrganizerApplication));
    profileRepo = module.get(getRepositoryToken(OrganizerProfile));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── Apply ──────────────────────────────────────────────────────────────

  describe('apply', () => {
    const dto = {
      businessName: 'My Events Ltd',
      email: 'biz@events.co.ke',
      phone: '+254712345678',
    };

    it('should create a new application with OTP', async () => {
      applicationRepo.findOne.mockResolvedValue(null);
      applicationRepo.create.mockReturnValue({ id: 'app-1', ...dto } as any);
      applicationRepo.save.mockResolvedValue({ id: 'app-1', ...dto } as any);

      const result = await service.apply('user-1', dto);

      expect(applicationRepo.create).toHaveBeenCalled();
      const createArg = applicationRepo.create.mock.calls[0][0] as any;
      expect(createArg.emailOtp).toBeDefined();
      expect(createArg.emailOtp).toHaveLength(6);
      expect(createArg.status).toBe(ApplicationStatus.PENDING_EMAIL);
      expect(result.message).toContain('verification code');
    });

    it('should throw ConflictException if approved application exists', async () => {
      applicationRepo.findOne.mockResolvedValue({
        status: ApplicationStatus.APPROVED,
      } as any);

      await expect(service.apply('user-1', dto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if pending application exists', async () => {
      applicationRepo.findOne.mockResolvedValue({
        status: ApplicationStatus.PENDING_EMAIL,
      } as any);

      await expect(service.apply('user-1', dto)).rejects.toThrow(ConflictException);
    });

    it('should allow re-application if previously rejected', async () => {
      const rejectedApp = {
        id: 'app-1',
        status: ApplicationStatus.REJECTED,
        businessName: 'Old Name',
        email: 'old@test.com',
        phone: '000',
      };
      applicationRepo.findOne.mockResolvedValue(rejectedApp as any);
      applicationRepo.save.mockResolvedValue({
        ...rejectedApp,
        ...dto,
        status: ApplicationStatus.PENDING_EMAIL,
      } as any);

      const result = await service.apply('user-1', dto);

      expect(applicationRepo.save).toHaveBeenCalled();
      const saved = applicationRepo.save.mock.calls[0][0] as any;
      expect(saved.businessName).toBe(dto.businessName);
      expect(saved.status).toBe(ApplicationStatus.PENDING_EMAIL);
      expect(result.message).toContain('verification code');
    });
  });

  // ─── Verify Email ───────────────────────────────────────────────────────

  describe('verifyEmail', () => {
    it('should throw NotFoundException if no application exists', async () => {
      applicationRepo.findOne.mockResolvedValue(null);
      await expect(
        service.verifyEmail('user-1', { emailOtp: '123456' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if not in pending_email state', async () => {
      applicationRepo.findOne.mockResolvedValue({
        status: ApplicationStatus.PENDING_ADMIN,
      } as any);

      await expect(
        service.verifyEmail('user-1', { emailOtp: '123456' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for wrong OTP', async () => {
      applicationRepo.findOne.mockResolvedValue({
        status: ApplicationStatus.PENDING_EMAIL,
        emailOtp: '654321',
      } as any);

      await expect(
        service.verifyEmail('user-1', { emailOtp: '000000' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should advance to pending_admin on correct OTP', async () => {
      const app = {
        status: ApplicationStatus.PENDING_EMAIL,
        emailOtp: '123456',
      };
      applicationRepo.findOne.mockResolvedValue(app as any);
      applicationRepo.save.mockResolvedValue({
        ...app,
        status: ApplicationStatus.PENDING_ADMIN,
        emailOtp: null,
      } as any);

      const result = await service.verifyEmail('user-1', { emailOtp: '123456' });

      expect(result.message).toContain('Email verified');
      const saved = applicationRepo.save.mock.calls[0][0] as any;
      expect(saved.status).toBe(ApplicationStatus.PENDING_ADMIN);
      expect(saved.emailOtp).toBeNull();
    });
  });

  // ─── Pending Admin Applications ─────────────────────────────────────────

  describe('findPendingAdminApplications', () => {
    it('should query applications with pending_admin status', async () => {
      applicationRepo.find.mockResolvedValue([]);
      await service.findPendingAdminApplications();

      expect(applicationRepo.find).toHaveBeenCalledWith({
        where: { status: ApplicationStatus.PENDING_ADMIN },
        relations: ['user'],
        order: { createdAt: 'ASC' },
      });
    });
  });

  // ─── Update Application Status ──────────────────────────────────────────

  describe('updateApplicationStatus', () => {
    it('should throw NotFoundException if application not found', async () => {
      applicationRepo.findOne.mockResolvedValue(null);
      await expect(
        service.updateApplicationStatus('x', ApplicationStatus.APPROVED),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update and return the application', async () => {
      const app = { id: 'app-1', status: ApplicationStatus.PENDING_ADMIN };
      applicationRepo.findOne.mockResolvedValue(app as any);
      applicationRepo.save.mockResolvedValue({
        ...app,
        status: ApplicationStatus.APPROVED,
      } as any);

      const result = await service.updateApplicationStatus(
        'app-1',
        ApplicationStatus.APPROVED,
      );

      expect(result.status).toBe(ApplicationStatus.APPROVED);
    });
  });

  // ─── Analytics ──────────────────────────────────────────────────────────

  describe('getAnalytics', () => {
    it('should return zeros when organizer has no profiles', async () => {
      profileRepo.find.mockResolvedValue([]);
      const result = await service.getAnalytics('user-1');

      expect(result.totalTicketsSold).toBe(0);
      expect(result.currentBalance).toBe(0);
      expect(result.activeEvents).toEqual([]);
      expect(result.currency).toBe('KES');
    });

    it('should query SQL and return formatted results', async () => {
      profileRepo.find.mockResolvedValue([{ id: 'org-1' } as any]);

      const dataSource = (service as any).dataSource;
      dataSource.query
        .mockResolvedValueOnce([
          {
            totalTicketsSold: 42,
            currentBalance: 95000,
            projectedIncome: 30000,
            pastIncome: 65000,
          },
        ])
        .mockResolvedValueOnce([
          {
            id: 'event-1',
            title: 'Big Concert',
            startDate: '2026-03-01',
            status: 'published',
            bannerImageUrl: 'http://img.jpg',
            ticketsSold: '42',
            revenue: '95000',
          },
        ]);

      const result = await service.getAnalytics('user-1');

      expect(result.totalTicketsSold).toBe(42);
      expect(result.currentBalance).toBe(95000);
      expect(result.projectedIncome).toBe(30000);
      expect(result.pastIncome).toBe(65000);
      expect(result.activeEvents).toHaveLength(1);
      expect(result.activeEvents[0].ticketsSold).toBe(42);
      expect(typeof result.activeEvents[0].revenue).toBe('number');
    });
  });
});
