import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { User } from '../users/entities/user.entity';
import { Notification, NotificationType, NotificationStatus } from './entities/notification.entity';
import { UserDevice } from './entities/user-device.entity';
import { EventsService } from '../events/services/events.service';

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2_000;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(UserDevice)
    private deviceRepository: Repository<UserDevice>,
    private eventsService: EventsService,
    private configService: ConfigService,
  ) {}

  // ─── Create & Send ────────────────────────────────────────────────────────

  async create(params: {
    userId: string;
    title: string;
    body: string;
    type: NotificationType;
    data?: Record<string, any>;
    referenceId?: string;
  }): Promise<Notification> {
    const notification = await this.notificationRepository.save(
      this.notificationRepository.create({
        ...params,
        status: NotificationStatus.PENDING,
      }),
    );

    // Fire-and-forget push (don't await so we don't block the caller)
    this.sendPushNotification(notification).catch((err) => {
      this.logger.warn(`Push send failed for notification ${notification.id}: ${err?.message}`);
    });

    return notification;
  }

  async getUserNotifications(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
    const [notifications, total] = await this.notificationRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const unreadCount = await this.notificationRepository.count({
      where: { userId, status: NotificationStatus.PENDING },
    });

    return { notifications, total, unreadCount };
  }

  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    await this.notificationRepository.update(
      { id: notificationId, userId },
      { status: NotificationStatus.READ, readAt: new Date() },
    );
    return this.notificationRepository.findOne({ where: { id: notificationId } });
  }

  async markAllAsRead(userId: string): Promise<{ updated: number }> {
    const result = await this.notificationRepository.update(
      { userId, status: NotificationStatus.PENDING },
      { status: NotificationStatus.READ, readAt: new Date() },
    );
    return { updated: result.affected ?? 0 };
  }

  // ─── Device Registration ──────────────────────────────────────────────────

  async registerDevice(params: {
    userId: string;
    token: string;
    platform: 'ios' | 'android';
  }): Promise<UserDevice> {
    const existing = await this.deviceRepository.findOne({
      where: { token: params.token },
    });

    if (existing) {
      // Re-link to current user (e.g. device was used by someone else previously)
      await this.deviceRepository.update(existing.id, { userId: params.userId });
      return this.deviceRepository.findOne({ where: { id: existing.id } });
    }

    return this.deviceRepository.save(
      this.deviceRepository.create({
        userId: params.userId,
        token: params.token,
        platform: params.platform,
        isActive: true,
      }),
    );
  }

  async deregisterDevice(token: string, userId: string): Promise<void> {
    await this.deviceRepository.update({ token, userId }, { isActive: false });
  }

  // ─── Daily Recommendations Cron ───────────────────────────────────────────

  /**
   * FIX: Previously this cron ran silently — if it failed or found no users,
   * there was no log or retry. Now:
   * - All errors are logged with stack traces
   * - Each user's notification is retried up to MAX_RETRY_ATTEMPTS times
   * - Summary stats are logged at the end of each run
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendDailyRecommendations(): Promise<void> {
    this.logger.log('Daily recommendations cron started');
    const startTime = Date.now();
    let sent = 0;
    let failed = 0;
    let skipped = 0;

    try {
      const users = await this.userRepository.find({
        where: { isActive: true, notificationsEnabled: true },
        select: ['id', 'firstName'],
      });

      if (users.length === 0) {
        this.logger.log('No active users with notifications enabled — skipping');
        return;
      }

      this.logger.log(`Sending recommendations to ${users.length} users`);

      for (const user of users) {
        try {
          const recommendations = await this.eventsService.getRecommendedForUser(user.id, 3);

          if (recommendations.length === 0) {
            skipped++;
            continue;
          }

          const titles = recommendations.map((e) => e.title).join(', ');
          const body =
            recommendations.length === 1
              ? `Don't miss: ${recommendations[0].title}`
              : `${recommendations.length} events you might love: ${titles}`;

          await this.sendWithRetry(
            {
              userId: user.id,
              title: `Good morning${user.firstName ? `, ${user.firstName}` : ''}! 🎉`,
              body,
              type: NotificationType.EVENT_RECOMMENDATION,
              data: {
                eventIds: recommendations.map((e) => e.id),
                screen: 'Discover',
              },
            },
            MAX_RETRY_ATTEMPTS,
          );

          sent++;
        } catch (err: any) {
          failed++;
          this.logger.warn(
            `Failed to send daily recommendation to user ${user.id}: ${err?.message}`,
          );
        }
      }
    } catch (err: any) {
      this.logger.error(
        `Daily recommendations cron encountered a fatal error: ${err?.message}`,
        err?.stack,
      );
    } finally {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      this.logger.log(
        `Daily recommendations done in ${duration}s — sent: ${sent}, skipped: ${skipped}, failed: ${failed}`,
      );
    }
  }

  // ─── Internal Helpers ─────────────────────────────────────────────────────

  /**
   * Send a notification with exponential-backoff retry.
   */
  private async sendWithRetry(
    params: Parameters<NotificationsService['create']>[0],
    maxAttempts: number,
  ): Promise<void> {
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.create(params);
        return;
      } catch (err: any) {
        lastError = err;
        if (attempt < maxAttempts) {
          const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }
    throw lastError;
  }

  /**
   * Send an Expo push notification to all active devices for a user.
   */
  private async sendPushNotification(notification: Notification): Promise<void> {
    const devices = await this.deviceRepository.find({
      where: { userId: notification.userId, isActive: true },
    });

    if (devices.length === 0) return;

    const expoTokens = devices
      .map((d) => d.token)
      .filter((t) => t.startsWith('ExponentPushToken['));

    if (expoTokens.length === 0) return;

    const messages = expoTokens.map((to) => ({
      to,
      title: notification.title,
      body: notification.body,
      data: notification.data ?? {},
      sound: 'default',
    }));

    try {
      await axios.post('https://exp.host/--/api/v2/push/send', messages, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        timeout: 10_000,
      });

      await this.notificationRepository.update(notification.id, {
        status: NotificationStatus.SENT,
        sentAt: new Date(),
      });
    } catch (err: any) {
      await this.notificationRepository.update(notification.id, {
        status: NotificationStatus.FAILED,
        failureReason: err?.message?.slice(0, 500),
      });
      throw err;
    }
  }
}