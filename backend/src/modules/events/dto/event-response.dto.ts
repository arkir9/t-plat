import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  EventStatus,
  LocationType,
  VenueFeeType,
  CustomLocation,
  EventSource,
} from '../entities/event.entity';

export class EventResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  organizerId: string;

  @ApiPropertyOptional()
  source?: EventSource;

  @ApiPropertyOptional()
  isClaimed?: boolean;

  @ApiPropertyOptional()
  externalUrl?: string;

  @ApiProperty()
  organizer: {
    id: string;
    name: string;
    profileImageUrl?: string;
    isVerified: boolean;
  };

  @ApiPropertyOptional()
  venueId?: string;

  @ApiPropertyOptional()
  venue?: {
    id: string;
    name: string;
    profileImageUrl?: string;
    address?: string;
    city?: string;
    country?: string;
  };

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  eventType?: string;

  @ApiPropertyOptional()
  category?: string;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  timezone: string;

  @ApiProperty({ enum: LocationType })
  locationType: LocationType;

  @ApiPropertyOptional()
  customLocation?: CustomLocation;

  @ApiPropertyOptional({ type: [String] })
  images?: string[];

  @ApiPropertyOptional()
  ticketTypes?: Array<{ name?: string; price: number; currency?: string }>;

  @ApiPropertyOptional()
  videoUrl?: string;

  @ApiPropertyOptional()
  ageRestriction?: string;

  @ApiPropertyOptional()
  dressCode?: string;

  @ApiPropertyOptional()
  maxTicketsPerUser?: number;

  @ApiPropertyOptional()
  venueFeePercentage?: number;

  @ApiPropertyOptional()
  venueFeeAmount?: number;

  @ApiPropertyOptional({ enum: VenueFeeType })
  venueFeeType?: VenueFeeType;

  @ApiProperty({ enum: EventStatus })
  status: EventStatus;

  @ApiProperty()
  isFeatured: boolean;

  @ApiProperty()
  isSponsored: boolean;

  @ApiPropertyOptional()
  sponsorName?: string;

  @ApiPropertyOptional()
  bannerImageUrl?: string;

  @ApiPropertyOptional()
  publishDate?: Date;

  @ApiPropertyOptional({ type: [String] })
  tags?: string[];

  @ApiPropertyOptional()
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
  };

  @ApiPropertyOptional()
  requirements?: {
    items?: string[];
    notes?: string;
  };

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Additional computed fields
  @ApiPropertyOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  isPast?: boolean;

  @ApiPropertyOptional()
  isUpcoming?: boolean;

  @ApiPropertyOptional()
  ticketsSold?: number;

  @ApiPropertyOptional()
  revenue?: number;

  @ApiPropertyOptional()
  capacity?: number;

  @ApiPropertyOptional()
  availableTickets?: number;

  @ApiPropertyOptional()
  distance?: number; // Distance in km for location-based searches
}
