import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScrapedSource } from '../entities/scraped-source.entity';
import { ScraperService } from './Scrapper.service';

export interface ScrapeJobData {
  sourceId: string;
  url: string;
  priority?: number;
}

const QUEUE_NAME = 'event-scraping';

/**
 * ScraperQueueService manages the BullMQ scraping queue.
 *
 * FIX: Previously the Queue and Worker were instantiated directly in the
 * constructor which caused BullMQ to attempt an eager Redis connection.
 * If Redis was unavailable at startup the entire app would crash.
 *
 * Now:
 * - Connection is created lazily in onModuleInit (after DI is complete)
 * - Redis unavailability logs a warning but does NOT crash the app
 * - addJob() is a no-op when Redis is offline (logs warning instead of throwing)
 */
@Injectable()
export class ScraperQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ScraperQueueService.name);

  private queue: Queue | null = null;
  private worker: Worker | null = null;
  private queueEvents: QueueEvents | null = null;
  private redisAvailable = false;

  constructor(
    @InjectRepository(ScrapedSource)
    private sourceRepository: Repository<ScrapedSource>,
    private scraperService: ScraperService,
    private configService: ConfigService,
  ) {}

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    if (!redisUrl) {
      this.logger.warn(
        'REDIS_URL not configured — scraper queue is disabled. ' +
          'Set REDIS_URL in your .env to enable background scraping.',
      );
      return;
    }

    try {
      await this.initQueue(redisUrl);
    } catch (error: any) {
      this.logger.warn(
        `Could not connect to Redis (${error?.message}). ` +
          'Scraper queue is disabled for this session.',
      );
    }
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
    await this.queueEvents?.close();
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Enqueue a URL for scraping.
   * Returns false (and logs a warning) if Redis is unavailable.
   */
  async addJob(data: ScrapeJobData, opts?: { delay?: number }): Promise<boolean> {
    if (!this.queue || !this.redisAvailable) {
      this.logger.warn(`Cannot enqueue scrape job for ${data.url} — Redis not available`);
      return false;
    }

    await this.queue.add('scrape', data, {
      delay: opts?.delay,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5_000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    });

    this.logger.debug(`Enqueued scrape job for ${data.url}`);
    return true;
  }

  /**
   * Enqueue all active scraped sources for a fresh crawl.
   * Safe to call even when Redis is offline.
   */
  async enqueueAllSources(): Promise<{ queued: number; skipped: number }> {
    if (!this.redisAvailable) {
      this.logger.warn('Cannot enqueue sources — Redis not available');
      return { queued: 0, skipped: 0 };
    }

    const sources = await this.sourceRepository.find({ where: { isActive: true } });
    let queued = 0;

    for (const source of sources) {
      const staggerDelay = queued * 2_000; // 2s between each to avoid hammering
      const ok = await this.addJob(
        { sourceId: source.id, url: source.url },
        { delay: staggerDelay },
      );
      if (ok) queued++;
    }

    const skipped = sources.length - queued;
    this.logger.log(`Enqueued ${queued} scrape jobs, skipped ${skipped}`);
    return { queued, skipped };
  }

  async getQueueStats(): Promise<Record<string, number> | null> {
    if (!this.queue) return null;
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);
    return { waiting, active, completed, failed, delayed };
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private parseRedisUrl(redisUrl: string): { host: string; port: number } {
    try {
      const url = new URL(redisUrl);
      return {
        host: url.hostname,
        port: Number(url.port || 6379),
      };
    } catch {
      return { host: 'localhost', port: 6379 };
    }
  }

  private async initQueue(redisUrl: string): Promise<void> {
    const connection = this.parseRedisUrl(redisUrl);

    this.queue = new Queue(QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5_000 },
      },
    });

    this.queueEvents = new QueueEvents(QUEUE_NAME, { connection });

    this.worker = new Worker(QUEUE_NAME, async (job: Job<ScrapeJobData>) => this.processJob(job), {
      connection,
      concurrency: 3,
      limiter: { max: 10, duration: 60_000 },
    });

    this.worker.on('completed', (job) => {
      this.logger.debug(`Scrape job ${job.id} completed for ${job.data.url}`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.warn(
        `Scrape job ${job?.id} failed for ${job?.data?.url}: ${err?.message}`,
      );
    });

    // Test connectivity with a ping
    await this.queue.getWorkers();
    this.redisAvailable = true;
    this.logger.log('Scraper queue connected to Redis');
  }

  private async processJob(job: Job<ScrapeJobData>): Promise<void> {
    const { sourceId, url } = job.data;

    const source = await this.sourceRepository.findOne({ where: { id: sourceId } });
    if (!source) {
      this.logger.warn(`Source ${sourceId} not found, skipping job`);
      return;
    }

    if (!source.isActive) {
      this.logger.debug(`Source ${sourceId} is inactive, skipping`);
      return;
    }

    await job.updateProgress(10);

    try {
      await this.scraperService.scrapeSource(source);
      await job.updateProgress(100);

      await this.sourceRepository.update(sourceId, {
        lastScrapedAt: new Date(),
        lastScrapeStatus: 'success',
        consecutiveFailures: 0,
      });
    } catch (error: any) {
      await this.sourceRepository.increment({ id: sourceId }, 'consecutiveFailures', 1);
      await this.sourceRepository.update(sourceId, {
        lastScrapeStatus: 'failed',
        lastScrapeError: error?.message?.slice(0, 500),
      });

      // Auto-disable sources that fail too many times in a row
      const updated = await this.sourceRepository.findOne({ where: { id: sourceId } });
      if (updated && updated.consecutiveFailures >= 10) {
        await this.sourceRepository.update(sourceId, { isActive: false });
        this.logger.warn(
          `Source ${url} auto-disabled after ${updated.consecutiveFailures} consecutive failures`,
        );
      }

      throw error; // Re-throw so BullMQ handles retry logic
    }
  }
}