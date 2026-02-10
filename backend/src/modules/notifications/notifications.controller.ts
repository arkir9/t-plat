import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { DevicePlatform } from './entities/device-token.entity';

class RegisterDeviceDto {
  token: string;
  platform: DevicePlatform;
}

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('register-device')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Register or update a push notification device token for current user' })
  @ApiResponse({ status: 201, description: 'Device token registered' })
  async registerDevice(@CurrentUser() user: User, @Body() body: RegisterDeviceDto) {
    return this.notificationsService.registerDeviceToken(user.id, body.token, body.platform);
  }
}
