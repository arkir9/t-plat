import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('organizer_profiles')
export class OrganizerProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.organizerProfiles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'profile_type',
  })
  profileType: 'event_organizer' | 'venue_organizer';

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'text', nullable: true, name: 'logo_url' })
  logoUrl: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website: string;

  @Column({ type: 'jsonb', nullable: true, name: 'social_links' })
  socialLinks: Record<string, string>;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending',
    name: 'verification_status',
  })
  verificationStatus: 'pending' | 'verified' | 'rejected';

  // Venue-specific fields (nullable for event organizers)
  @Column({ type: 'text', nullable: true, name: 'venue_address' })
  venueAddress: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'venue_city' })
  venueCity: string;

  @Column({ type: 'int', nullable: true, name: 'venue_capacity' })
  venueCapacity: number;

  @Column({ type: 'jsonb', nullable: true, name: 'venue_amenities' })
  venueAmenities: string[];

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true, name: 'venue_latitude' })
  venueLatitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true, name: 'venue_longitude' })
  venueLongitude: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
