import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
// Redis store import (optional - only if REDIS_URL is set)
let redisStore: any;
try {
  redisStore = require('cache-manager-redis-store');
} catch (e) {
  // Redis store not available, will use in-memory cache
}

// Configuration
import { typeOrmConfig } from './config/typeorm.config';

// Middleware
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizersModule } from './modules/organizers/organizers.module';
import { EventsModule } from './modules/events/events.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { SafetyModule } from './modules/safety/safety.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(process.cwd(), '.env.local'),
        join(process.cwd(), '.env'),
        join(__dirname, '..', '..', '.env.local'),
        join(__dirname, '..', '..', '.env'),
      ],
      expandVariables: true,
      cache: true,
    }),

    // Database
    TypeOrmModule.forRootAsync({
      useFactory: typeOrmConfig,
    }),

    // Cache (Redis or In-Memory)
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => {
        const redisUrl = process.env.REDIS_URL;
        if (redisUrl && redisStore) {
          return {
            store: redisStore,
            url: redisUrl,
            ttl: 300, // 5 minutes default
          } as any;
        }
        // In-memory cache fallback
        return {
          ttl: 300,
          max: 100,
        };
      },
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 10, // 10 requests per second
      },
      {
        name: 'medium',
        ttl: 10000, // 10 seconds
        limit: 50, // 50 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Scheduled Tasks
    ScheduleModule.forRoot(),

    // Feature Modules
    AuthModule,
    UsersModule,
    OrganizersModule,
    EventsModule,
    TicketsModule,
    PaymentsModule,
    NotificationsModule,
    ReviewsModule,
    SafetyModule,
    FavoritesModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware, LoggerMiddleware).forRoutes('*');
  }
}
