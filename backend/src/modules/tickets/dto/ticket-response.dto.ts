import { ApiProperty } from '@nestjs/swagger';
import { TicketStatus } from '../entities/ticket.entity';

export class TicketResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  eventId: string;

  @ApiProperty()
  ticketTypeId: string;

  @ApiProperty()
  orderId: string;

  @ApiProperty()
  qrCode: string;

  @ApiProperty()
  qrCodeHash: string;

  @ApiProperty({ enum: TicketStatus })
  status: TicketStatus;

  @ApiProperty()
  isTransferred: boolean;

  @ApiProperty({ nullable: true })
  checkedInAt: Date | null;

  @ApiProperty()
  offlineDownloaded: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Related data
  @ApiProperty({ required: false })
  event?: any;

  @ApiProperty({ required: false })
  ticketType?: any;
}
