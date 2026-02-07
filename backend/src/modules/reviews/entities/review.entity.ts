import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Event } from '../../events/entities/event.entity';
import { Ticket } from '../../tickets/entities/ticket.entity';

@Entity('reviews')
@Index(['userId'])
@Index(['eventId'])
@Index(['rating'])
@Unique(['userId', 'eventId'])
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'event_id' })
  eventId: string;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column({ nullable: true, name: 'ticket_id' })
  ticketId: string;

  @ManyToOne(() => Ticket, { nullable: true })
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;

  @Column({ type: 'integer' })
  rating: number;

  @Column({ type: 'text', nullable: true, name: 'review_text' })
  reviewText: string;

  @Column({ type: 'integer', nullable: true, name: 'venue_rating' })
  venueRating: number;

  @Column({ type: 'integer', nullable: true, name: 'organizer_rating' })
  organizerRating: number;

  @Column({ type: 'text', nullable: true, name: 'organizer_response' })
  organizerResponse: string;

  @Column({ type: 'boolean', default: false, name: 'is_verified' })
  isVerified: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
