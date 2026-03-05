import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { EventsService } from './events.service';
import { EventIngestionService } from './services/event-ingestion.service';
import { AiExtractorService } from './services/ai-extractor.service';
import { UniversalScraperService } from './services/universal-scraper.service';
import { TicketsasaScraperService } from './services/ticketsasa-scraper.service';
import { ScraperQueueService } from './services/scraper-queue.service';
import { ScraperSchedulerService } from './services/scraper-scheduler.service';
import { EventsController } from './events.controller';
import { Event } from './entities/event.entity';
import { EventInteraction } from './entities/event-interaction.entity';
import { OrganizersModule } from '../organizers/organizers.module';

@Module({
  imports: [TypeOrmModule.forFeature([Event, EventInteraction]), HttpModule, OrganizersModule],
  controllers: [EventsController],
  providers: [
    EventsService,
    EventIngestionService,
    AiExtractorService,
    UniversalScraperService,
    TicketsasaScraperService,
    ScraperQueueService,
    ScraperSchedulerService,
  ],
  exports: [EventsService],
})
export class EventsModule {}
