import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({ description: '6-digit OTP sent to the business email', example: '482910' })
  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  emailOtp: string;
}
