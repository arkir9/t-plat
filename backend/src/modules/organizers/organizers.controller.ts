import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { OrganizersService } from './organizers.service';
import { ApplyOrganizerDto } from './dto/apply-organizer.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

@ApiTags('organizers')
@Controller('organizers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class OrganizersController {
  constructor(private readonly organizersService: OrganizersService) {}

  // ─── Existing profile endpoints ────────────────────────────────────────

  @Post('profile')
  @ApiOperation({ summary: 'Create organizer profile' })
  @ApiResponse({ status: 201, description: 'Profile created' })
  async createProfile(@CurrentUser() user: any, @Body() createDto: any) {
    return this.organizersService.create(user.id, createDto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my organizer profiles' })
  @ApiResponse({ status: 200, description: 'Profiles retrieved' })
  async getMyProfiles(@CurrentUser() user: any) {
    return this.organizersService.findByUserId(user.id);
  }

  @Post('me/verify-pending')
  @ApiOperation({ summary: 'Verify all my pending Plat Pro profiles (dev/convenience)' })
  async verifyMyPending(@CurrentUser() user: any) {
    return this.organizersService.verifyMyPendingProfiles(user.id);
  }

  // ─── Analytics ───────────────────────────────────────────────────────────

  @Get('me/analytics')
  @ApiOperation({ summary: 'Get financial analytics for the current organizer' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved' })
  async getAnalytics(@CurrentUser() user: any) {
    return this.organizersService.getAnalytics(user.id);
  }

  // ─── Application flow ──────────────────────────────────────────────────

  @Post('apply')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit organizer application (requires email verification)' })
  @ApiResponse({ status: 201, description: 'Application submitted, OTP sent to email' })
  @ApiResponse({ status: 409, description: 'Application already exists' })
  async apply(@CurrentUser() user: any, @Body() dto: ApplyOrganizerDto) {
    return this.organizersService.apply(user.id, dto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify business email with OTP' })
  @ApiResponse({ status: 200, description: 'Email verified, pending admin review' })
  @ApiResponse({ status: 400, description: 'Invalid OTP or wrong status' })
  @ApiResponse({ status: 404, description: 'No application found' })
  async verifyEmail(@CurrentUser() user: any, @Body() dto: VerifyEmailDto) {
    return this.organizersService.verifyEmail(user.id, dto);
  }

  @Get('my-application')
  @ApiOperation({ summary: 'Get current user organizer application status' })
  @ApiResponse({ status: 200, description: 'Application retrieved (or null)' })
  async getMyApplication(@CurrentUser() user: any) {
    const application = await this.organizersService.getMyApplication(user.id);
    if (!application) {
      return { application: null, message: 'No application found. Apply to become an organizer.' };
    }
    return {
      application: {
        id: application.id,
        businessName: application.businessName,
        email: application.email,
        phone: application.phone,
        status: application.status,
        createdAt: application.createdAt,
        updatedAt: application.updatedAt,
      },
    };
  }
}
