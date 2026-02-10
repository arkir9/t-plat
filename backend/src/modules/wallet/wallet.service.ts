import { Injectable, Inject, forwardRef, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { WalletAccount, WalletCurrency } from './entities/wallet-account.entity';
import { WalletTransaction, WalletTransactionType } from './entities/wallet-transaction.entity';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    @InjectRepository(WalletAccount)
    private walletRepository: Repository<WalletAccount>,
    @InjectRepository(WalletTransaction)
    private transactionRepository: Repository<WalletTransaction>,
    private dataSource: DataSource,
    @Inject(forwardRef(() => PaymentsService))
    private paymentsService: PaymentsService,
  ) {}

  async getOrCreateWallet(userId: string, currency: WalletCurrency = WalletCurrency.KES) {
    let wallet = await this.walletRepository.findOne({ where: { userId, currency } });
    if (!wallet) {
      wallet = this.walletRepository.create({ userId, currency, balance: 0 });
      await this.walletRepository.save(wallet);
    }
    return wallet;
  }

  async getWallet(userId: string) {
    return this.getOrCreateWallet(userId);
  }

  /**
   * Credit Wallet (Internal Transfer)
   */
  async credit(
    userId: string,
    amount: number,
    type: WalletTransactionType,
    referenceId?: string,
    meta?: any,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const wallet = await queryRunner.manager.findOne(WalletAccount, {
        where: { userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!wallet) throw new BadRequestException('Wallet not found');

      wallet.balance = Number(wallet.balance) + Number(amount);
      await queryRunner.manager.save(wallet);

      const tx = this.transactionRepository.create({
        walletId: wallet.id,
        amount: amount,
        type,
        referenceId,
        meta,
        balanceAfter: wallet.balance,
      });
      await queryRunner.manager.save(tx);
      await queryRunner.commitTransaction();
      return tx;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Withdraw funds from Wallet to M-Pesa
   */
  async withdrawFunds(userId: string, amount: number, phoneNumber: string) {
    if (amount <= 0) throw new BadRequestException('Invalid amount');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Lock Wallet row
      const wallet = await queryRunner.manager.findOne(WalletAccount, {
        where: { userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) throw new BadRequestException('Wallet not found');
      if (Number(wallet.balance) < amount) throw new BadRequestException('Insufficient funds');

      // 2. Debit Wallet
      wallet.balance = Number(wallet.balance) - amount;
      await queryRunner.manager.save(wallet);

      // 3. Record Pending Transaction
      const transaction = this.transactionRepository.create({
        walletId: wallet.id,
        amount: -amount,
        type: WalletTransactionType.WITHDRAWAL,
        meta: { phoneNumber, method: 'MPESA_B2C', status: 'PENDING' },
        balanceAfter: wallet.balance,
      });
      const savedTx = await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();

      // 4. Trigger M-Pesa B2C (Post-commit)
      try {
        const b2cResponse = await this.paymentsService.initiateB2CWithdrawal(
          savedTx.id,
          phoneNumber,
          amount,
        );

        await this.transactionRepository.update(savedTx.id, {
          meta: { ...(savedTx.meta ?? {}), ...b2cResponse, status: 'PROCESSING' },
        } as Partial<WalletTransaction>);

        return { success: true, message: 'Withdrawal initiated', transactionId: savedTx.id };
      } catch (apiError) {
        this.logger.error(`B2C Call failed for tx ${savedTx.id}, refunding wallet...`);
        await this.refundFailedWithdrawal(wallet.id, amount, savedTx.id);
        throw apiError;
      }
    } catch (error) {
      if (queryRunner.isTransactionActive) await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async refundFailedWithdrawal(walletId: string, amount: number, txId: string) {
    const wallet = await this.walletRepository.findOne({ where: { id: walletId } });
    if (wallet) {
      wallet.balance = Number(wallet.balance) + amount;
      await this.walletRepository.save(wallet);
      await this.transactionRepository.update(txId, {
        meta: { status: 'FAILED_API_ERROR' },
      } as Partial<WalletTransaction>);
    }
  }

  async getTransactions(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);
    return this.transactionRepository.find({
      where: { walletId: wallet.id },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }
}
