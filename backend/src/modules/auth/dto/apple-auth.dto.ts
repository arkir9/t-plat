import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AppleAuthDto {
  @ApiProperty({ description: 'Apple identity token (JWT) from the client' })
  @IsString()
  @IsNotEmpty()
  identityToken: string;

  @ApiPropertyOptional({ description: 'Full name from Apple (only on first sign-in)' })
  @IsOptional()
  @IsString()
  fullName?: string;
}
