import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymentExpiryService } from './payment-expiry.service';
import { WalletModule } from '../wallet/wallet.module';
import { Order } from '../tickets/entities/order.entity';
import { Payment } from './entities/payment.entity';

/**
 * PaymentsModule imports WalletModule to access WalletService.
 *
 * FIX: Previously there was a circular dependency:
 *   PaymentsModule <-> WalletModule (both importing each other via forwardRef)
 *
 * The fix is unidirectional: PaymentsModule imports WalletModule.
 * WalletModule does NOT import PaymentsModule.
 * Any payment-triggered wallet ops go through PaymentsService → WalletService.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Payment, Order]), WalletModule, ConfigModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentExpiryService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
