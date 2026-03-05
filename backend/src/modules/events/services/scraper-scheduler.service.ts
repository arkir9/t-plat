import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ScraperQueueService } from './scraper-queue.service';

@Injectable()
export class ScraperSchedulerService {
  private readonly logger = new Logger(ScraperSchedulerService.name);

  constructor(private readonly scraperQueue: ScraperQueueService) {}

  /**
   * Today's / near-term events – more frequent refresh (every 2 hours).
   * This mirrors the PDF’s higher-frequency schedule for current events.
   */
  @Cron(CronExpression.EVERY_2_HOURS)
  async scheduleHighPriorityTicketsasaScrape() {
    this.logger.log('Scheduling high-priority Ticketsasa scrape (2-hour cadence)...');
    await this.scraperQueue.enqueueTicketsasaScrape('high');
  }

  /**
   * Broader upcoming events – less frequent (every 6 hours).
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async scheduleNormalTicketsasaScrape() {
    this.logger.log('Scheduling normal-priority Ticketsasa scrape (6-hour cadence)...');
    await this.scraperQueue.enqueueTicketsasaScrape('normal');
  }
}

