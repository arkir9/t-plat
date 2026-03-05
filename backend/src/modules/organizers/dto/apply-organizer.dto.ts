import { IsString, IsNotEmpty, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApplyOrganizerDto {
  @ApiProperty({ description: 'Business or organizer name', example: 'Nairobi Events Co.' })
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @ApiProperty({ description: 'Business email for verification', example: 'hello@nairobievents.co.ke' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Business phone number', example: '+254712345678' })
  @IsString()
  @IsNotEmpty()
  phone: string;
}
