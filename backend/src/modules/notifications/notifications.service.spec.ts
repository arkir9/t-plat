import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { NotificationsService } from './notifications.service';
import { DeviceToken } from './entities/device-token.entity';
import { UserNotification } from './entities/user-notification.entity';
import { EventsService } from '../events/events.service';

jest.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: jest.fn(),
  credential: { cert: jest.fn() },
  messaging: jest.fn().mockReturnValue({
    sendMulticast: jest.fn().mockResolvedValue({ successCount: 1, failureCount: 0 }),
  }),
}));

describe('NotificationsService', () => {
  let service: NotificationsService;
  let deviceTokenRepo: jest.Mocked<Repository<DeviceToken>>;
  let notificationRepo: jest.Mocked<Repository<UserNotification>>;

  const createMockRepo = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    }),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(DeviceToken), useValue: createMockRepo() },
        { provide: getRepositoryToken(UserNotification), useValue: createMockRepo() },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(null),
          },
        },
        {
          provide: EventsService,
          useValue: {
            getRecommendedEventsForUser: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    deviceTokenRepo = module.get(getRepositoryToken(DeviceToken));
    notificationRepo = module.get(getRepositoryToken(UserNotification));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerDeviceToken', () => {
    it('should update existing token if found', async () => {
      const existing = { id: 'dt-1', token: 'abc', userId: 'old-user', platform: 'ios', active: false };
      deviceTokenRepo.findOne.mockResolvedValue(existing as any);
      deviceTokenRepo.save.mockResolvedValue({
        ...existing,
        userId: 'user-1',
        active: true,
      } as any);

      const result = await service.registerDeviceToken('user-1', 'abc', 'ios');

      expect(deviceTokenRepo.save).toHaveBeenCalled();
      expect(result.userId).toBe('user-1');
      expect(result.active).toBe(true);
    });

    it('should create new token if not found', async () => {
      deviceTokenRepo.findOne.mockResolvedValue(null);
      deviceTokenRepo.create.mockReturnValue({
        id: 'dt-new',
        userId: 'user-1',
        token: 'new-token',
        platform: 'android',
        active: true,
      } as any);
      deviceTokenRepo.save.mockResolvedValue({
        id: 'dt-new',
        userId: 'user-1',
        token: 'new-token',
        platform: 'android',
        active: true,
      } as any);

      const result = await service.registerDeviceToken('user-1', 'new-token', 'android');

      expect(deviceTokenRepo.create).toHaveBeenCalled();
      expect(result.token).toBe('new-token');
    });
  });

  describe('deactivateDeviceToken', () => {
    it('should deactivate an existing token', async () => {
      const existing = { id: 'dt-1', token: 'abc', active: true };
      deviceTokenRepo.findOne.mockResolvedValue(existing as any);
      deviceTokenRepo.save.mockResolvedValue({ ...existing, active: false } as any);

      await service.deactivateDeviceToken('abc');

      expect(deviceTokenRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ active: false }),
      );
    });

    it('should do nothing if token not found', async () => {
      deviceTokenRepo.findOne.mockResolvedValue(null);
      await service.deactivateDeviceToken('nonexistent');
      expect(deviceTokenRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('sendNotificationToUser', () => {
    it('should persist notification record even if Firebase is not initialized', async () => {
      notificationRepo.create.mockReturnValue({
        id: 'notif-1',
        userId: 'user-1',
        type: 'generic',
        title: 'Test',
        body: 'Hello',
      } as any);
      notificationRepo.save.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
        type: 'generic',
        title: 'Test',
        body: 'Hello',
      } as any);

      await service.sendNotificationToUser({
        userId: 'user-1',
        type: 'generic',
        title: 'Test',
        body: 'Hello',
      });

      expect(notificationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          type: 'generic',
          title: 'Test',
          body: 'Hello',
        }),
      );
      expect(notificationRepo.save).toHaveBeenCalled();
    });
  });
});
