import { IsArray, ValidateNested, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '../entities/order.entity';

export class OrderItemDto {
  @ApiProperty({ description: 'Ticket type ID' })
  ticketTypeId: string;

  @ApiProperty({ description: 'Quantity to purchase' })
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'Event ID' })
  eventId: string;

  @ApiProperty({
    description: 'Order items',
    type: [OrderItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ enum: PaymentMethod, description: 'Payment method' })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ description: 'M-Pesa phone number (required for M-Pesa payments)' })
  @IsOptional()
  phoneNumber?: string;
}
