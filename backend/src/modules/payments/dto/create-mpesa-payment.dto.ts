import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMpesaPaymentDto {
  @ApiProperty({ description: 'Order ID' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({
    description: 'M-Pesa phone number (format: 254712345678)',
    example: '254712345678',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^254\d{9}$/, {
    message: 'Phone number must be in format 254712345678',
  })
  phoneNumber: string;
}
