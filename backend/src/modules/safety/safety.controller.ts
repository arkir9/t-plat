import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { SafetyService } from './safety.service';
import {
  CreateEmergencyContactDto,
  CheckInDto,
  CreateSafetyReportDto,
} from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('safety')
@Controller('safety')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class SafetyController {
  constructor(private readonly safetyService: SafetyService) {}

  @Get('emergency-contacts')
  @ApiOperation({ summary: 'Get user emergency contacts' })
  @ApiResponse({ status: 200, description: 'Emergency contacts retrieved successfully' })
  async getEmergencyContacts(@CurrentUser() user: User) {
    return this.safetyService.getEmergencyContacts(user.id);
  }

  @Post('emergency-contacts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add emergency contact' })
  @ApiResponse({ status: 201, description: 'Emergency contact added successfully' })
  async addEmergencyContact(
    @CurrentUser() user: User,
    @Body() createDto: CreateEmergencyContactDto,
  ) {
    return this.safetyService.addEmergencyContact(user.id, createDto);
  }

  @Put('emergency-contacts/:id')
  @ApiOperation({ summary: 'Update emergency contact' })
  @ApiParam({ name: 'id', description: 'Contact ID' })
  @ApiResponse({ status: 200, description: 'Emergency contact updated successfully' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  async updateEmergencyContact(
    @Param('id') contactId: string,
    @CurrentUser() user: User,
    @Body() updateDto: Partial<CreateEmergencyContactDto>,
  ) {
    return this.safetyService.updateEmergencyContact(contactId, user.id, updateDto);
  }

  @Delete('emergency-contacts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete emergency contact' })
  @ApiParam({ name: 'id', description: 'Contact ID' })
  @ApiResponse({ status: 204, description: 'Emergency contact deleted successfully' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  async deleteEmergencyContact(
    @Param('id') contactId: string,
    @CurrentUser() user: User,
  ) {
    return this.safetyService.deleteEmergencyContact(contactId, user.id);
  }

  @Post('check-in')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Check in to event' })
  @ApiResponse({ status: 201, description: 'Checked in successfully' })
  @ApiResponse({ status: 400, description: 'Already checked in' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async checkIn(@CurrentUser() user: User, @Body() checkInDto: CheckInDto) {
    return this.safetyService.checkIn(user.id, checkInDto);
  }

  @Post('check-out')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Check out from event' })
  @ApiResponse({ status: 201, description: 'Checked out successfully' })
  @ApiResponse({ status: 400, description: 'Not checked in' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async checkOut(
    @CurrentUser() user: User,
    @Body('eventId') eventId: string,
  ) {
    return this.safetyService.checkOut(user.id, eventId);
  }

  @Get('check-in/:eventId')
  @ApiOperation({ summary: 'Get check-in status for event' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Check-in status retrieved successfully' })
  async getCheckInStatus(
    @Param('eventId') eventId: string,
    @CurrentUser() user: User,
  ) {
    return this.safetyService.getCheckInStatus(user.id, eventId);
  }

  @Post('reports')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create safety report' })
  @ApiResponse({ status: 201, description: 'Safety report created successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async createSafetyReport(
    @CurrentUser() user: User,
    @Body() createDto: CreateSafetyReportDto,
  ) {
    return this.safetyService.createSafetyReport(user.id, createDto);
  }

  @Get('reports')
  @ApiOperation({ summary: 'Get user safety reports' })
  @ApiResponse({ status: 200, description: 'Safety reports retrieved successfully' })
  async getUserSafetyReports(@CurrentUser() user: User) {
    return this.safetyService.getUserSafetyReports(user.id);
  }
}
