import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRefundRequestDto {
  @ApiProperty({ description: 'Refund reason' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
