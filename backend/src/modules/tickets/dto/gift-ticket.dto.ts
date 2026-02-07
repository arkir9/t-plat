import { IsString, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GiftTicketDto {
  @ApiProperty({ description: 'Recipient email address' })
  @IsEmail()
  recipientEmail: string;

  @ApiPropertyOptional({ description: 'Gift message' })
  @IsOptional()
  @IsString()
  message?: string;
}
