import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { DeviceToken, DevicePlatform } from './entities/device-token.entity';
import { UserNotification, NotificationType } from './entities/user-notification.entity';
import { EventsService } from '../events/events.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private firebaseInitialized = false;

  constructor(
    @InjectRepository(DeviceToken)
    private deviceTokenRepository: Repository<DeviceToken>,
    @InjectRepository(UserNotification)
    private userNotificationRepository: Repository<UserNotification>,
    private configService: ConfigService,
    private eventsService: EventsService,
  ) {
    this.initFirebase();
  }

  private initFirebase() {
    try {
      if (admin.apps.length > 0) {
        this.firebaseInitialized = true;
        return;
      }

      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
      const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
      let privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

      if (!projectId || !clientEmail || !privateKey) {
        this.logger.warn('Firebase credentials not fully configured; push notifications disabled.');
        return;
      }

      // Handle escaped newlines in env var
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
      privateKey = privateKey.replace(/\\n/g, '\n');

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });

      this.firebaseInitialized = true;
      this.logger.log('Firebase Admin initialized for push notifications');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin', error as any);
      this.firebaseInitialized = false;
    }
  }

  async registerDeviceToken(userId: string, token: string, platform: DevicePlatform): Promise<DeviceToken> {
    // Upsert-style behaviour: if token exists, just associate with user & mark active
    let existing = await this.deviceTokenRepository.findOne({ where: { token } });
    if (existing) {
      existing.userId = userId;
      existing.platform = platform;
      existing.active = true;
      return this.deviceTokenRepository.save(existing);
    }

    const created = this.deviceTokenRepository.create({
      userId,
      token,
      platform,
      active: true,
    });
    return this.deviceTokenRepository.save(created);
  }

  async deactivateDeviceToken(token: string): Promise<void> {
    const existing = await this.deviceTokenRepository.findOne({ where: { token } });
    if (!existing) return;
    existing.active = false;
    await this.deviceTokenRepository.save(existing);
  }

  async sendNotificationToUser(params: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, any>;
  }): Promise<void> {
    const { userId, type, title, body, data } = params;

    // Persist notification record
    const record = this.userNotificationRepository.create({
      userId,
      type,
      title,
      body,
      data,
      sentAt: null,
      readAt: null,
    });
    const saved = await this.userNotificationRepository.save(record);

    if (!this.firebaseInitialized) {
      this.logger.warn('Firebase not initialized; skipping push send');
      return;
    }

    const tokens = await this.deviceTokenRepository.find({
      where: { userId, active: true },
    });
    if (!tokens.length) {
      return;
    }

    const message: admin.messaging.MulticastMessage = {
      tokens: tokens.map((t) => t.token),
      notification: {
        title,
        body,
      },
      data: {
        type,
        notificationId: saved.id,
        ...(data || {}),
      },
    };

    try {
      const response = await admin.messaging().sendMulticast(message);
      this.logger.log(
        `Sent notification ${saved.id} to user ${userId} – success: ${response.successCount}, failure: ${response.failureCount}`,
      );
      saved.sentAt = new Date();
      await this.userNotificationRepository.save(saved);
    } catch (error) {
      this.logger.error('Failed to send push notification', error as any);
    }
  }

  /**
   * Cron job: periodically send personalized AI recommendation pushes.
   * For now, runs every day at 10:00 Nairobi time (UTC+3 approximate via server time).
   */
  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async sendDailyRecommendations() {
    if (!this.firebaseInitialized) {
      this.logger.warn('Firebase not initialized; skipping daily recommendations job');
      return;
    }

    // Find distinct users with active device tokens
    const rows = await this.deviceTokenRepository
      .createQueryBuilder('device')
      .select('DISTINCT device.userId', 'userId')
      .where('device.active = :active', { active: true })
      .getRawMany<{ userId: string }>();

    for (const row of rows) {
      const userId = row.userId;
      try {
        const recommended = await this.eventsService.getRecommendedEventsForUser(userId, 3);
        if (!recommended.length) continue;

        const top = recommended[0];
        await this.sendNotificationToUser({
          userId,
          type: 'ai_recommendation',
          title: 'Recommended for you',
          body: `Check out "${top.title}" and other events picked for you.`,
          data: {
            eventId: top.id,
          },
        });
      } catch (error) {
        this.logger.error(
          `Failed to send daily recommendation to user ${userId}`,
          error as any,
        );
      }
    }
  }
}
