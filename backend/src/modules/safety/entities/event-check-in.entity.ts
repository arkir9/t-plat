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
import { Event } from '../../events/entities/event.entity';
import { Ticket } from '../../tickets/entities/ticket.entity';

export enum CheckInType {
  ARRIVAL = 'arrival',
  DEPARTURE = 'departure',
}

@Entity('event_check_ins')
@Index(['userId'])
@Index(['eventId'])
@Index(['ticketId'])
export class EventCheckIn {
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

  @Column({
    type: 'enum',
    enum: CheckInType,
    name: 'check_in_type',
  })
  checkInType: CheckInType;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true, name: 'location_latitude' })
  locationLatitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true, name: 'location_longitude' })
  locationLongitude: number;

  @Column({ type: 'boolean', default: false, name: 'shared_with_contacts' })
  sharedWithContacts: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
