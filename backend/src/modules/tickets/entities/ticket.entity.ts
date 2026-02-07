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
import { User } from '../../users/entities/user.entity';
import { Event } from '../../events/entities/event.entity';
import { Order } from './order.entity';
import { TicketType } from './ticket-type.entity';
import { OrganizerProfile } from '../../organizers/entities/organizer-profile.entity';

export enum TicketStatus {
  ACTIVE = 'active',
  USED = 'used',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  TRANSFERRED = 'transferred',
}

@Entity('tickets')
@Index(['userId'])
@Index(['eventId'])
@Index(['orderId'])
@Index(['qrCodeHash'])
@Index(['status'])
export class Ticket {
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

  @Column({ name: 'ticket_type_id' })
  ticketTypeId: string;

  @ManyToOne(() => TicketType)
  @JoinColumn({ name: 'ticket_type_id' })
  ticketType: TicketType;

  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ type: 'text', unique: true, name: 'qr_code' })
  qrCode: string;

  @Column({ type: 'varchar', length: 255, unique: true, name: 'qr_code_hash' })
  qrCodeHash: string;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.ACTIVE,
  })
  status: TicketStatus;

  @Column({ type: 'boolean', default: false, name: 'is_transferred' })
  isTransferred: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'checked_in_at' })
  checkedInAt: Date;

  @Column({ nullable: true, name: 'checked_in_by' })
  checkedInById: string;

  @ManyToOne(() => OrganizerProfile, { nullable: true })
  @JoinColumn({ name: 'checked_in_by' })
  checkedInBy: OrganizerProfile;

  @Column({ type: 'boolean', default: false, name: 'offline_downloaded' })
  offlineDownloaded: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'last_downloaded_at' })
  lastDownloadedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
