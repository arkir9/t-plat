import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { OrganizerProfile } from '../../organizers/entities/organizer-profile.entity';

export enum EventStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum LocationType {
  VENUE = 'venue',
  CUSTOM = 'custom',
}

export enum VenueFeeType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
  NONE = 'none',
}

// --- NEW STRICT EVENT TYPES ---
export enum EventType {
  CONCERT = 'concert',
  FESTIVAL = 'festival',
  NIGHTLIFE = 'nightlife',
  ARTS_CULTURE = 'arts_culture',
  SPORTS = 'sports',
  BUSINESS = 'business',
  COMMUNITY = 'community',
  OTHER = 'other',
}

// Source tracking for Hybrid Strategy
export enum EventSource {
  INTERNAL = 'internal',
  SCRAPED = 'scraped', // Hustlesasa single-page & product-grid stores
  PREDICTHQ = 'predicthq',
  TICKETMASTER = 'ticketmaster',
}

export interface CustomLocation {
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

@Entity('events')
@Index(['organizerId'])
@Index(['venueId'])
@Index(['startDate'])
@Index(['locationType', 'customLocation'])
@Index(['status'])
@Index(['isFeatured'])
@Index(['eventType']) // Index for fast filtering
@Index(['externalId', 'source'])
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organizer_id' })
  organizerId: string;

  @ManyToOne(() => OrganizerProfile)
  @JoinColumn({ name: 'organizer_id' })
  organizer: OrganizerProfile;

  @Column({ name: 'venue_id', nullable: true })
  venueId?: string;

  @ManyToOne(() => OrganizerProfile, { nullable: true })
  @JoinColumn({ name: 'venue_id' })
  venue?: OrganizerProfile;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  // --- UPDATED COLUMN ---
  @Column({
    name: 'event_type',
    type: 'enum',
    enum: EventType,
    default: EventType.OTHER,
  })
  eventType: EventType;
  // ----------------------

  @Column({ length: 50, nullable: true })
  category?: string; // Kept as optional secondary tag

  @Column({ name: 'start_date', type: 'timestamp' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp' })
  endDate: Date;

  @Column({ length: 50, default: 'Africa/Nairobi' })
  timezone: string;

  @Column({
    name: 'location_type',
    type: 'enum',
    enum: LocationType,
  })
  locationType: LocationType;

  @Column({
    name: 'custom_location',
    type: 'jsonb',
    nullable: true,
  })
  customLocation?: CustomLocation;

  @Column({ type: 'jsonb', nullable: true })
  images?: string[];

  // Rich media & attendance rules

  @Column({ name: 'video_url', nullable: true })
  videoUrl?: string;

  @Column({ name: 'age_restriction', length: 20, nullable: true })
  ageRestriction?: string;

  @Column({ name: 'dress_code', length: 100, nullable: true })
  dressCode?: string;

  @Column({ name: 'max_tickets_per_user', type: 'int', nullable: true })
  maxTicketsPerUser?: number;

  // --- HYBRID STRATEGY FIELDS ---
  @Column({
    type: 'enum',
    enum: EventSource,
    default: EventSource.INTERNAL,
  })
  source: EventSource;

  @Column({ name: 'external_id', nullable: true })
  externalId?: string;

  @Column({ name: 'is_claimed', default: false })
  isClaimed: boolean;

  @Column({ name: 'external_url', nullable: true })
  externalUrl?: string;
  // -----------------------------

  // Lightweight scraper metadata for hash-based freshness checks
  @Column({ name: 'content_hash', type: 'text', nullable: true })
  contentHash?: string | null;

  @Column({ name: 'last_scraped_at', type: 'timestamp', nullable: true })
  lastScrapedAt?: Date | null;

  // Pricing & fee configuration

  @Column({
    name: 'platform_fee_percentage',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 5.0,
  })
  platformFeePercentage: number;

  @Column({
    name: 'venue_fee_percentage',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  venueFeePercentage?: number;

  @Column({
    name: 'venue_fee_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  venueFeeAmount?: number;

  @Column({
    name: 'venue_fee_type',
    type: 'enum',
    enum: VenueFeeType,
    nullable: true,
  })
  venueFeeType?: VenueFeeType;

  @Column({
    type: 'enum',
    enum: EventStatus,
    default: EventStatus.DRAFT,
  })
  status: EventStatus;

  @Column({ name: 'is_featured', default: false })
  isFeatured: boolean;

  @Column({ name: 'is_sponsored', default: false })
  isSponsored: boolean;

  @Column({ name: 'sponsor_name', length: 255, nullable: true })
  sponsorName?: string;

  @Column({ name: 'banner_image_url', nullable: true })
  bannerImageUrl?: string;

  @Column({ type: 'jsonb', nullable: true })
  tags?: string[];

  @Column({ name: 'publish_date', type: 'timestamp', nullable: true })
  publishDate?: Date;

  @Column({ name: 'contact_info', type: 'jsonb', nullable: true })
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
  };

  @Column({ name: 'requirements', type: 'jsonb', nullable: true })
  requirements?: {
    items?: string[];
    notes?: string;
  };

  @Column({ name: 'ticket_types', type: 'jsonb', nullable: true })
  ticketTypes?: any[]; // Storing basic ticket info for list view optimization

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
