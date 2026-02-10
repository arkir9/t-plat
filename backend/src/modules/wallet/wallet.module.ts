import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { WalletAccount } from './entities/wallet-account.entity';
import { WalletTransaction } from './entities/wallet-transaction.entity';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WalletAccount, WalletTransaction]),
    forwardRef(() => PaymentsModule), // <--- Use forwardRef
  ],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
