import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckInDto {
  @ApiProperty({
    description: 'The raw QR code payload string scanned from the ticket',
    example: '{"t":"uuid","e":"uuid","sig":"hex"}',
  })
  @IsString()
  @IsNotEmpty()
  qrCode: string;
}
