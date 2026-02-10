import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsNumberString,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { EventStatus, LocationType } from '../entities/event.entity';

export class EventQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by event title or description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by organizer ID' })
  @IsOptional()
  @IsString()
  organizerId?: string;

  @ApiPropertyOptional({ description: 'Filter by venue ID' })
  @IsOptional()
  @IsString()
  venueId?: string;

  @ApiPropertyOptional({ description: 'Filter by event category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Filter by event type' })
  @IsOptional()
  @IsString()
  eventType?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: EventStatus,
  })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiPropertyOptional({
    description: 'Filter by location type',
    enum: LocationType,
  })
  @IsOptional()
  @IsEnum(LocationType)
  locationType?: LocationType;

  @ApiPropertyOptional({ description: 'Start date filter (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startDateFrom?: string;

  @ApiPropertyOptional({ description: 'End date filter (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startDateTo?: string;

  @ApiPropertyOptional({ description: 'Filter events starting on or after this date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter events starting on or before this date (alias for startDateTo)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filter by city' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Filter by country' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Show only featured events' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  featured?: boolean;

  @ApiPropertyOptional({ description: 'Show only sponsored events' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  sponsored?: boolean;

  @ApiPropertyOptional({ description: 'Show only upcoming events' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  upcoming?: boolean;

  @ApiPropertyOptional({ description: 'Filter by tags (comma-separated)' })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiPropertyOptional({ description: 'Latitude for location-based search' })
  @IsOptional()
  @IsNumberString()
  latitude?: string;

  @ApiPropertyOptional({ description: 'Longitude for location-based search' })
  @IsOptional()
  @IsNumberString()
  longitude?: string;

  @ApiPropertyOptional({ description: 'Radius in kilometers for location-based search' })
  @IsOptional()
  @IsNumberString()
  radius?: string;

  @ApiPropertyOptional({
    description: 'Sort by: date, title, created_at, featured, sponsored',
    default: 'start_date',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order: asc or desc',
    default: 'asc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}
