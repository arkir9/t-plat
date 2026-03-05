import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Event } from '../../events/entities/event.entity';
import type { OrderItem } from './order-item.entity';

export enum Currency {
  KES = 'KES',
  USD = 'USD',
}

@Entity('ticket_types')
@Index(['eventId'])
@Index(['isActive'])
export class TicketType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'event_id' })
  eventId: string;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'varchar', length: 3, default: Currency.KES })
  currency: Currency;

  @Column({ type: 'integer', name: 'quantity_available' })
  quantityAvailable: number;

  @Column({ type: 'integer', default: 0, name: 'quantity_sold' })
  quantitySold: number;

  @Column({ type: 'timestamp', nullable: true, name: 'sale_start_date' })
  saleStartDate: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'sale_end_date' })
  saleEndDate: Date;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.ticketType)
  orderItems: OrderItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Helper methods
  get availableQuantity(): number {
    return this.quantityAvailable - this.quantitySold;
  }

  get isSoldOut(): boolean {
    return this.availableQuantity <= 0;
  }

  get isOnSale(): boolean {
    if (!this.isActive) return false;
    const now = new Date();
    if (this.saleStartDate && now < this.saleStartDate) return false;
    if (this.saleEndDate && now > this.saleEndDate) return false;
    return true;
  }
}
