import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsBoolean,
  Min,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency } from '../entities/ticket-type.entity';

export class CreateTicketTypeDto {
  @ApiProperty({ description: 'Ticket type name (e.g., "General Admission", "VIP")' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Ticket type description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Ticket price' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ enum: Currency, default: Currency.KES })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiProperty({ description: 'Available quantity' })
  @IsNumber()
  @Min(1)
  quantityAvailable: number;

  @ApiPropertyOptional({ description: 'Sale start date' })
  @IsOptional()
  @IsDateString()
  saleStartDate?: string;

  @ApiPropertyOptional({ description: 'Sale end date' })
  @IsOptional()
  @IsDateString()
  saleEndDate?: string;

  @ApiPropertyOptional({ description: 'Is ticket type active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
