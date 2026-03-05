import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth('JWT-auth')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('applications')
  @ApiOperation({ summary: 'List all organizer applications pending admin review' })
  @ApiResponse({ status: 200, description: 'Pending applications retrieved' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async getApplications() {
    return this.adminService.getPendingApplications();
  }

  @Post('applications/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve an organizer application' })
  @ApiParam({ name: 'id', description: 'Application ID' })
  @ApiResponse({ status: 200, description: 'Application approved, organizer profile created' })
  @ApiResponse({ status: 400, description: 'Application not in correct state' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async approveApplication(@Param('id') id: string) {
    return this.adminService.approveApplication(id);
  }

  @Post('applications/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject an organizer application' })
  @ApiParam({ name: 'id', description: 'Application ID' })
  @ApiResponse({ status: 200, description: 'Application rejected' })
  @ApiResponse({ status: 400, description: 'Application not in correct state' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async rejectApplication(@Param('id') id: string) {
    return this.adminService.rejectApplication(id);
  }
}
