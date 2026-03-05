import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Queue, Worker, JobsOptions } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { TicketsasaScraperService } from './ticketsasa-scraper.service';

export type ScrapeJobData = {
  sourceUrl: string;
};

@Injectable()
export class ScraperQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ScraperQueueService.name);
  private queue: Queue<ScrapeJobData>;
  private worker: Worker<ScrapeJobData> | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly ticketsasaScraper: TicketsasaScraperService,
  ) {
    const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    const connection = this.parseRedisUrl(redisUrl);

    this.queue = new Queue<ScrapeJobData>('scrape-queue', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 10_000,
        },
        removeOnComplete: 50,
        removeOnFail: 200,
      },
    });
  }

  async onModuleInit(): Promise<void> {
    await this.startWorker();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
    await this.queue.close();
  }

  /**
   * Schedules a Ticketsasa scrape job.
   * This matches the PDF’s "one source, queued worker" pattern.
   */
  async enqueueTicketsasaScrape(priority: 'high' | 'normal' = 'normal'): Promise<void> {
    const options: JobsOptions = {
      priority: priority === 'high' ? 1 : 5,
    };

    await this.queue.add(
      'ticketsasa-scrape',
      {
        sourceUrl: 'https://www.ticketsasa.com/events',
      },
      options,
    );
  }

  private async startWorker(): Promise<void> {
    if (this.worker) return;

    const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    const connection = this.parseRedisUrl(redisUrl);

    this.worker = new Worker<ScrapeJobData>(
      'scrape-queue',
      async (job) => {
        this.logger.log(`Processing job ${job.id} (${job.name}) for ${job.data.sourceUrl}`);
        // For now we only support Ticketsasa; later we can switch on job.name/domain.
        await this.ticketsasaScraper.scrapeAndUpsert(job.data.sourceUrl);
      },
      {
        connection,
        concurrency: 3,
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`Scrape job ${job.id} completed.`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Scrape job ${job?.id} failed: ${err?.message}`);
    });
  }

  private parseRedisUrl(redisUrl: string): { host: string; port: number } {
    try {
      const url = new URL(redisUrl);
      return {
        host: url.hostname,
        port: Number(url.port || 6379),
      };
    } catch {
      return { host: 'redis', port: 6379 };
    }
  }
}

