import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { EventsService } from './services/events.service';
import { EventIngestionService } from './services/event-ingestion.service';
import { ScraperQueueService } from './services/scraper-queue.service';
import { ScraperSchedulerService } from './services/scraper-scheduler.service';
import { AiExtractorService } from './services/ai-extractor.service';
import { UniversalScraperService } from './services/universal-scraper.service';
import { TicketsasaScraperService } from './services/ticketsasa-scraper.service';
import { OrganiserOutreachService } from './services/organiser-outreach.service';
import { EventsController } from './events.controller';
import { Event } from './entities/event.entity';
import { EventInteraction } from './entities/event-interaction.entity';
import { User } from '../users/entities/user.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { TicketType } from '../tickets/entities/ticket-type.entity';
import { OrganizersModule } from '../organizers/organizers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, EventInteraction, User, Ticket, TicketType]),
    HttpModule,
    ConfigModule,
    OrganizersModule,
  ],
  controllers: [EventsController],
  providers: [
    EventsService,
    EventIngestionService,
    ScraperQueueService,
    ScraperSchedulerService,
    AiExtractorService,
    UniversalScraperService,
    TicketsasaScraperService,
    OrganiserOutreachService,
  ],
  exports: [EventsService],
})
export class EventsModule {}
