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
import { User } from '../../users/entities/user.entity';
import { Event } from '../../events/entities/event.entity';
import { OrderItem } from './order-item.entity';
import type { Ticket } from './ticket.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  MPESA = 'mpesa',
  STRIPE = 'stripe',
}

export enum Currency {
  KES = 'KES',
  USD = 'USD',
}

@Entity('orders')
@Index(['userId'])
@Index(['eventId'])
@Index(['paymentStatus'])
@Index(['orderNumber'])
export class Order {
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

  @Column({ type: 'varchar', length: 50, unique: true, name: 'order_number' })
  orderNumber: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_amount' })
  totalAmount: number;

  @Column({ type: 'varchar', length: 3, default: Currency.KES })
  currency: Currency;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 5.0,
    name: 'platform_commission_percentage',
  })
  platformCommissionPercentage: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    name: 'platform_commission_amount',
  })
  platformCommissionAmount: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    name: 'venue_fee_amount',
  })
  venueFeeAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'net_amount' })
  netAmount: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
    name: 'payment_status',
  })
  paymentStatus: PaymentStatus;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'payment_method' })
  paymentMethod: PaymentMethod;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'payment_intent_id' })
  paymentIntentId: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'mpesa_transaction_code' })
  mpesaTransactionCode: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'mpesa_checkout_request_id' })
  mpesaCheckoutRequestId: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'mpesa_merchant_request_id' })
  mpesaMerchantRequestId: string;

  @Column({ type: 'text', nullable: true, name: 'payment_failure_reason' })
  paymentFailureReason: string;

  @Column({ type: 'timestamp', nullable: true, name: 'payment_date' })
  paymentDate: Date;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true })
  orderItems: OrderItem[];

  @OneToMany(() => Ticket, (ticket) => ticket.order)
  tickets: Ticket[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
