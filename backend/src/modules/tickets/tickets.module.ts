import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { TicketType } from './entities/ticket-type.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Ticket } from './entities/ticket.entity';
import { Waitlist } from './entities/waitlist.entity';
import { RefundRequest } from './entities/refund-request.entity';
import { TicketTransfer } from './entities/ticket-transfer.entity';
import { Event } from '../events/entities/event.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TicketType,
      Order,
      OrderItem,
      Ticket,
      Waitlist,
      RefundRequest,
      TicketTransfer,
      Event,
      User,
    ]),
  ],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
