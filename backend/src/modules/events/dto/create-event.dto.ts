import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsEnum,
    IsDateString,
    IsNumber,
    IsArray,
    IsBoolean,
    IsUrl,
    MaxLength,
    Min,
    Max,
    ValidateNested,
    IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LocationType, VenueFeeType, CustomLocation } from '../entities/event.entity';

class CreateCustomLocationDto implements CustomLocation {
    @ApiProperty({ description: 'Street address' })
    @IsString()
    @IsNotEmpty()
    address: string;

    @ApiProperty({ description: 'City name' })
    @IsString()
    @IsNotEmpty()
    city: string;

    @ApiProperty({ description: 'Country name' })
    @IsString()
    @IsNotEmpty()
    country: string;

    @ApiProperty({ description: 'Latitude coordinate' })
    @IsNumber()
    @Min(-90)
    @Max(90)
    latitude: number;

    @ApiProperty({ description: 'Longitude coordinate' })
    @IsNumber()
    @Min(-180)
    @Max(180)
    longitude: number;
}

class CreateContactInfoDto {
    @ApiPropertyOptional({ description: 'Contact email' })
    @IsOptional()
    @IsString()
    email?: string;

    @ApiPropertyOptional({ description: 'Contact phone number' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({ description: 'Contact website URL' })
    @IsOptional()
    @IsUrl()
    website?: string;
}

class CreateRequirementsDto {
    @ApiPropertyOptional({ description: 'List of required items', type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    items?: string[];

    @ApiPropertyOptional({ description: 'Additional requirements notes' })
    @IsOptional()
    @IsString()
    notes?: string;
}

export class CreateEventDto {
    @ApiProperty({ description: 'Event title' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    title: string;

    @ApiPropertyOptional({ description: 'Event description' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: 'Type of event (e.g., concert, club_night)' })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    eventType?: string;

    @ApiPropertyOptional({ description: 'Event category (e.g., music, sports)' })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    category?: string;

    @ApiProperty({ description: 'Event start date and time (ISO 8601)' })
    @IsDateString()
    startDate: string;

    @ApiProperty({ description: 'Event end date and time (ISO 8601)' })
    @IsDateString()
    endDate: string;

    @ApiPropertyOptional({
        description: 'Timezone',
        default: 'Africa/Nairobi',
    })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    timezone?: string;

    @ApiProperty({
        description: 'Location type',
        enum: LocationType,
    })
    @IsEnum(LocationType)
    locationType: LocationType;

    @ApiPropertyOptional({
        description: 'Custom location details (required if locationType is custom)',
        type: CreateCustomLocationDto,
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => CreateCustomLocationDto)
    customLocation?: CreateCustomLocationDto;

    @ApiPropertyOptional({ description: 'Venue organizer ID (if event is at a venue)' })
    @IsOptional()
    @IsString()
    venueId?: string;

    @ApiPropertyOptional({
        description: 'Event images URLs',
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsUrl({}, { each: true })
    images?: string[];

    @ApiPropertyOptional({ description: 'Event video URL' })
    @IsOptional()
    @IsUrl()
    videoUrl?: string;

    @ApiPropertyOptional({ description: 'Age restriction (e.g., 18+, 21+, All Ages)' })
    @IsOptional()
    @IsString()
    @MaxLength(20)
    ageRestriction?: string;

    @ApiPropertyOptional({ description: 'Dress code requirements' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    dressCode?: string;

    @ApiPropertyOptional({ description: 'Maximum tickets per user' })
    @IsOptional()
    @IsNumber()
    @Min(1)
    maxTicketsPerUser?: number;

    @ApiPropertyOptional({ description: 'Venue fee percentage (if applicable)' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    venueFeePercentage?: number;

    @ApiPropertyOptional({ description: 'Fixed venue fee amount (if applicable)' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    venueFeeAmount?: number;

    @ApiPropertyOptional({
        description: 'Venue fee type',
        enum: VenueFeeType,
    })
    @IsOptional()
    @IsEnum(VenueFeeType)
    venueFeeType?: VenueFeeType;

    @ApiPropertyOptional({ description: 'Whether event should be featured' })
    @IsOptional()
    @IsBoolean()
    isFeatured?: boolean;

    @ApiPropertyOptional({ description: 'Whether event is a sponsored placement' })
    @IsOptional()
    @IsBoolean()
    isSponsored?: boolean;

    @ApiPropertyOptional({ description: 'Sponsor name (for sponsored placements)' })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    sponsorName?: string;

    @ApiPropertyOptional({ description: 'Banner image URL for ad display' })
    @IsOptional()
    @IsUrl()
    bannerImageUrl?: string;

    @ApiPropertyOptional({
        description: 'Event tags',
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @ApiPropertyOptional({ description: 'External website URL' })
    @IsOptional()
    @IsUrl()
    externalUrl?: string;

    @ApiPropertyOptional({
        description: 'Contact information',
        type: CreateContactInfoDto,
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => CreateContactInfoDto)
    contactInfo?: CreateContactInfoDto;

    @ApiPropertyOptional({
        description: 'Event requirements',
        type: CreateRequirementsDto,
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => CreateRequirementsDto)
    requirements?: CreateRequirementsDto;

    @ApiPropertyOptional({ description: 'Publish date (ISO 8601)' })
    @IsOptional()
    @IsDateString()
    publishDate?: string;
}