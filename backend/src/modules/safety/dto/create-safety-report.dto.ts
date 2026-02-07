import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReportType } from '../entities/safety-report.entity';

export class CreateSafetyReportDto {
  @ApiProperty({ description: 'Event ID' })
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @ApiProperty({ enum: ReportType, description: 'Report type' })
  @IsEnum(ReportType)
  reportType: ReportType;

  @ApiProperty({ description: 'Report description' })
  @IsString()
  @IsNotEmpty()
  description: string;
}
