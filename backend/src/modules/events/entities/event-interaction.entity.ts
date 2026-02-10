import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Event } from './event.entity';

export enum EventInteractionType {
  VIEW = 'view',
  WISHLIST = 'wishlist',
  PURCHASE = 'purchase',
  SHARE = 'share',
  CHECKIN = 'checkin',
}

@Entity('event_interactions')
@Index(['userId'])
@Index(['eventId'])
@Index(['interactionType'])
export class EventInteraction {
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

  @Column({
    type: 'varchar',
    name: 'interaction_type',
  })
  interactionType: EventInteractionType;

  @Column({ type: 'integer', default: 1 })
  weight: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
