import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScrapedSource } from './entities/scraped-source.entity';
import { Event } from './events/entities/event.entity';
import { TicketType } from './tickets/entities/ticket-type.entity';
import { AiExtractorModule } from './AI.extractor.module';
import { ScraperService } from './Scrapper.service';
import { ScraperQueueService } from './Scrapper.queue.service';

/**
 * ScraperModule provides the BullMQ-based scraping pipeline using
 * ScrapedSource entities, Claude AI extraction (AiExtractorModule),
 * and ScraperService for fetch + upsert.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ScrapedSource, Event, TicketType]),
    ConfigModule,
    AiExtractorModule,
  ],
  providers: [ScraperService, ScraperQueueService],
  exports: [ScraperQueueService, ScraperService],
})
export class ScraperModule {}
