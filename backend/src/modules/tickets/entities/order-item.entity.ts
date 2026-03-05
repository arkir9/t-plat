import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import type { Order } from './order.entity';
import type { TicketType } from './ticket-type.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne(() => Order, (order) => order.orderItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'ticket_type_id' })
  ticketTypeId: string;

  @ManyToOne(() => TicketType)
  @JoinColumn({ name: 'ticket_type_id' })
  ticketType: TicketType;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'unit_price' })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_price' })
  totalPrice: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
