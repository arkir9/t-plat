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
import { Ticket } from './ticket.entity';

export enum TransferType {
  TRANSFER = 'transfer',
  GIFT = 'gift',
}

export enum TransferStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

@Entity('ticket_transfers')
@Index(['ticketId'])
@Index(['originalUserId'])
@Index(['newUserId'])
@Index(['transferStatus'])
export class TicketTransfer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ticket_id' })
  ticketId: string;

  @ManyToOne(() => Ticket, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;

  @Column({ name: 'original_user_id' })
  originalUserId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'original_user_id' })
  originalUser: User;

  @Column({ nullable: true, name: 'new_user_id' })
  newUserId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'new_user_id' })
  newUser: User;

  @Column({
    type: 'enum',
    enum: TransferType,
    name: 'transfer_type',
  })
  transferType: TransferType;

  @Column({
    type: 'enum',
    enum: TransferStatus,
    default: TransferStatus.PENDING,
    name: 'transfer_status',
  })
  transferStatus: TransferStatus;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'recipient_email' })
  recipientEmail: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'recipient_phone' })
  recipientPhone: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
