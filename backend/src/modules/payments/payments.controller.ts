import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Public } from '@/common/decorators/public.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('mpesa/initiate/:orderId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Initiate M-Pesa STK push for an order' })
  @ApiResponse({ status: 200, description: 'STK push sent to phone' })
  async initiateMpesa(
    @Param('orderId') orderId: string,
    @Body('phoneNumber') phoneNumber: string,
  ) {
    return this.paymentsService.initiateMpesaPayment(orderId, phoneNumber);
  }

  @Public()
  @Post('mpesa/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'M-Pesa payment callback (Safaricom webhook)' })
  async mpesaCallback(@Body() body: any) {
    await this.paymentsService.handleMpesaCallback(body);
    return { ResultCode: 0, ResultDesc: 'Success' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('verify/:checkoutRequestId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Verify M-Pesa payment status (poll by checkoutRequestId)' })
  @ApiResponse({ status: 200, description: 'Payment status and order' })
  async verifyPayment(
    @Param('checkoutRequestId') checkoutRequestId: string,
    @CurrentUser() user: User,
  ) {
    return this.paymentsService.verifyMpesaPayment(checkoutRequestId, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('wallet/:orderId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Pay for an order using wallet balance' })
  async payWithWallet(
    @Param('orderId') orderId: string,
    @CurrentUser() user: User,
  ) {
    return this.paymentsService.payWithWallet(orderId, user.id);
  }
}