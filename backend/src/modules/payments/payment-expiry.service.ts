import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';

/**
 * Marks pending/processing payments as expired after a timeout (e.g. 30 minutes).
 * Run on a schedule; relies on PaymentStatus.EXPIRED and optional expiry metadata.
 */
@Injectable()
export class PaymentExpiryService {
  private readonly logger = new Logger(PaymentExpiryService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async markExpiredPayments(): Promise<void> {
    const cutoff = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
    const result = await this.paymentRepository.update(
      {
        paymentStatus: PaymentStatus.PENDING,
        createdAt: LessThan(cutoff),
      },
      { paymentStatus: PaymentStatus.EXPIRED },
    );
    if (result.affected && result.affected > 0) {
      this.logger.log(`Marked ${result.affected} payment(s) as expired.`);
    }
  }
}
