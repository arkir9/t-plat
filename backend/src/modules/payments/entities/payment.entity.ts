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
import { Order } from '../../tickets/entities/order.entity';
import { User } from '../../users/entities/user.entity';

export enum PaymentMethod {
  MPESA = 'mpesa',
  STRIPE = 'stripe',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum Currency {
  KES = 'KES',
  USD = 'USD',
}

@Entity('payments')
@Index(['orderId'])
@Index(['userId'])
@Index(['paymentStatus'])
@Index(['transactionId'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: Currency.KES })
  currency: Currency;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    name: 'payment_method',
  })
  paymentMethod: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
    name: 'payment_status',
  })
  paymentStatus: PaymentStatus;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'transaction_id' })
  transactionId: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'payment_intent_id' })
  paymentIntentId: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'mpesa_transaction_code' })
  mpesaTransactionCode: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'mpesa_phone_number' })
  mpesaPhoneNumber: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'stripe_charge_id' })
  stripeChargeId: string;

  @Column({ type: 'jsonb', nullable: true, name: 'metadata' })
  metadata: Record<string, any>;

  @Column({ type: 'text', nullable: true, name: 'failure_reason' })
  failureReason: string;

  @Column({ type: 'timestamp', nullable: true, name: 'processed_at' })
  processedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
