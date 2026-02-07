import { IsString, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransferTicketDto {
  @ApiProperty({ description: 'Recipient email address' })
  @IsEmail()
  recipientEmail: string;

  @ApiPropertyOptional({ description: 'Transfer message' })
  @IsOptional()
  @IsString()
  message?: string;
}
