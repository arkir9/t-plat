import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { join } from 'path';

// Import all entities so TypeORM knows every table (required for DB connection and storage)
import { User } from '../modules/users/entities/user.entity';
import { OrganizerProfile } from '../modules/organizers/entities/organizer-profile.entity';
import { RefreshToken } from '../modules/auth/entities/refresh-token.entity';
import { Event } from '../modules/events/entities/event.entity';
import { EventInteraction } from '../modules/events/entities/event-interaction.entity';
import { Favorite } from '../modules/favorites/entities/favorite.entity';
import { Review } from '../modules/reviews/entities/review.entity';
import { EmergencyContact } from '../modules/safety/entities/emergency-contact.entity';
import { SafetyReport } from '../modules/safety/entities/safety-report.entity';
import { EventCheckIn } from '../modules/safety/entities/event-check-in.entity';
import { Payment } from '../modules/payments/entities/payment.entity';
import { TicketType } from '../modules/tickets/entities/ticket-type.entity';
import { Order } from '../modules/tickets/entities/order.entity';
import { OrderItem } from '../modules/tickets/entities/order-item.entity';
import { Ticket } from '../modules/tickets/entities/ticket.entity';
import { Waitlist } from '../modules/tickets/entities/waitlist.entity';
import { RefundRequest } from '../modules/tickets/entities/refund-request.entity';
import { TicketTransfer } from '../modules/tickets/entities/ticket-transfer.entity';

export const entities = [
  User,
  OrganizerProfile,
  RefreshToken,
  Event,
  EventInteraction,
  Favorite,
  Review,
  EmergencyContact,
  SafetyReport,
  EventCheckIn,
  Payment,
  TicketType,
  Order,
  OrderItem,
  Ticket,
  Waitlist,
  RefundRequest,
  TicketTransfer,
];

export const getDatabaseConfig = (): TypeOrmModuleOptions => {
  // Use process.env; default to postgres user (never use OS username)
  const username = (process.env.DB_USERNAME || '').trim() || 'postgres';
  const password = (process.env.DB_PASSWORD || '').trim() || 'postgres';
  const dbSslEnv = (process.env.DB_SSL || '').toLowerCase();
  const dbSslEnabled =
    dbSslEnv === 'true' ||
    (process.env.NODE_ENV === 'production' && dbSslEnv !== 'false');

  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username,
    password,
    database: process.env.DB_DATABASE || 't_plat',
    entities: entities,
    migrations: [join(__dirname, '../migrations/*{.ts,.js}')],
    synchronize: process.env.DB_SYNCHRONIZE === 'true' || false,
    logging: process.env.DB_LOGGING === 'true' || true,
    
    // Connection Pool Settings for Scalability
    extra: {
      max: parseInt(process.env.DB_POOL_MAX || '20'), // Maximum pool size
      min: parseInt(process.env.DB_POOL_MIN || '5'), // Minimum pool size
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'),
    },
    
    // Retry Configuration
    retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS || '3'),
    retryDelay: parseInt(process.env.DB_RETRY_DELAY || '3000'),
    
    // SSL for Production (override with DB_SSL=true/false)
    ssl: dbSslEnabled ? { rejectUnauthorized: false } : false,
    
    // Cache Configuration
    cache: {
      duration: parseInt(process.env.DB_CACHE_DURATION || '30000'),
    },
  };
};

// For TypeORM CLI migrations
export const getDataSourceOptions = (): DataSourceOptions => {
  const username = (process.env.DB_USERNAME || '').trim() || 'postgres';
  const password = (process.env.DB_PASSWORD || '').trim() || 'postgres';
  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username,
    password,
    database: process.env.DB_DATABASE || 't_plat',
    entities: entities,
    migrations: [join(__dirname, '../migrations/*{.ts,.js}')],
    synchronize: false,
  };
};
