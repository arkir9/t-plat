import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { OrganizersService } from './organizers.service';

@ApiTags('organizers')
@Controller('organizers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrganizersController {
  constructor(private readonly organizersService: OrganizersService) {}

  @Post('profile')
  async createProfile(@Request() req, @Body() createDto: any) {
    return this.organizersService.create(req.user.id, createDto);
  }

  @Get('me')
  async getMyProfiles(@Request() req) {
    return this.organizersService.findByUserId(req.user.id);
  }

  @Post('me/verify-pending')
  @ApiOperation({ summary: 'Verify all my pending Plat Pro profiles (dev/convenience)' })
  async verifyMyPending(@Request() req) {
    return this.organizersService.verifyMyPendingProfiles(req.user.id);
  }
}
