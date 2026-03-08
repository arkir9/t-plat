import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('scraped_sources')
@Index(['url'], { unique: true })
@Index(['isActive'])
export class ScrapedSource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'boolean', nullable: true, name: 'is_event_store' })
  isEventStore: boolean | null;

  @Column({ type: 'timestamp', nullable: true, name: 'last_scraped_at' })
  lastScrapedAt: Date | null;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'last_scrape_status' })
  lastScrapeStatus: string | null;

  @Column({ type: 'text', nullable: true, name: 'last_scrape_error' })
  lastScrapeError: string | null;

  @Column({ type: 'int', default: 0, name: 'consecutive_failures' })
  consecutiveFailures: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
