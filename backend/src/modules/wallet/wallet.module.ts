import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { Wallet } from './entities/wallet.entity';
import { WalletTransaction } from './entities/wallet-transaction.entity';

/**
 * WalletModule has NO circular dependency imports.
 *
 * FIX: Previously this module used `forwardRef` to import PaymentsModule
 * (and vice-versa), creating a fragile circular dependency. The fix is to
 * inject WalletService directly wherever it's needed instead of importing
 * the full module — or to use a shared DataSource QueryRunner pattern.
 *
 * Any module that needs WalletService should import WalletModule and it will
 * receive the service via NestJS DI without any circular wiring.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Wallet, WalletTransaction])],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}