import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balance')
  async getBalance(@CurrentUser() user: User) {
    const wallet = await this.walletService.getOrCreateWallet(user.id);
    return { balance: wallet.balance, currency: wallet.currency };
  }

  @Get('transactions')
  async getTransactions(@CurrentUser() user: User) {
    return this.walletService.getTransactions(user.id);
  }

  @Post('withdraw')
  async withdraw(@CurrentUser() user: User, @Body() body: { amount: number; phoneNumber: string }) {
    return this.walletService.withdrawFunds(user.id, body.amount, body.phoneNumber);
  }
}
