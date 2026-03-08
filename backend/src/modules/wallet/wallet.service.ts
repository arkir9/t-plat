import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { WalletTransaction, TransactionType, TransactionStatus } from './entities/wallet-transaction.entity';

export interface WalletCreditOptions {
  userId: string;
  amount: number;
  description: string;
  referenceId?: string;
  metadata?: Record<string, any>;
}

export interface WalletDebitOptions {
  userId: string;
  amount: number;
  description: string;
  referenceId?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private transactionRepository: Repository<WalletTransaction>,
    private dataSource: DataSource,
  ) {}

  // ─── Core Wallet Operations ───────────────────────────────────────────────

  /**
   * Get a wallet by userId. Returns null if not found (use getOrCreateWallet
   * for upsert behaviour).
   */
  async getWallet(userId: string): Promise<Wallet | null> {
    return this.walletRepository.findOne({ where: { userId } });
  }

  /**
   * Idempotently fetch or create a wallet for a user.
   * This replaces the old pattern where credit/debit could throw if the wallet
   * didn't exist yet — now we always ensure one exists first.
   */
  async getOrCreateWallet(userId: string): Promise<Wallet> {
    let wallet = await this.walletRepository.findOne({ where: { userId } });

    if (!wallet) {
      wallet = this.walletRepository.create({
        userId,
        balance: 0,
        currency: 'KES',
        isActive: true,
      });
      await this.walletRepository.save(wallet);
      this.logger.log(`Created wallet for user ${userId}`);
    }

    return wallet;
  }

  /**
   * Credit a user's wallet.
   * FIX: Previously threw if wallet didn't exist. Now auto-creates.
   */
  async credit(options: WalletCreditOptions): Promise<WalletTransaction> {
    const { userId, amount, description, referenceId, metadata } = options;

    if (amount <= 0) {
      throw new BadRequestException('Credit amount must be positive');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lock the wallet row for update to prevent race conditions
      const wallet = await this.lockWallet(queryRunner, userId, true);
      const balanceBefore = Number(wallet.balance);
      const balanceAfter = balanceBefore + amount;

      wallet.balance = balanceAfter;
      await queryRunner.manager.save(Wallet, wallet);

      const transaction = queryRunner.manager.create(WalletTransaction, {
        walletId: wallet.id,
        userId,
        type: TransactionType.CREDIT,
        amount,
        balanceBefore,
        balanceAfter,
        description,
        referenceId,
        metadata,
        status: TransactionStatus.COMPLETED,
      });

      const saved = await queryRunner.manager.save(WalletTransaction, transaction);
      await queryRunner.commitTransaction();

      return saved;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Debit a user's wallet.
   * FIX: Throws if wallet doesn't exist (debit implies prior balance required).
   */
  async debit(options: WalletDebitOptions): Promise<WalletTransaction> {
    const { userId, amount, description, referenceId, metadata } = options;

    if (amount <= 0) {
      throw new BadRequestException('Debit amount must be positive');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const wallet = await this.lockWallet(queryRunner, userId, false);
      const balanceBefore = Number(wallet.balance);

      if (balanceBefore < amount) {
        throw new BadRequestException(
          `Insufficient balance. Available: KES ${balanceBefore.toFixed(2)}, Required: KES ${amount.toFixed(2)}`,
        );
      }

      const balanceAfter = balanceBefore - amount;
      wallet.balance = balanceAfter;
      await queryRunner.manager.save(Wallet, wallet);

      const transaction = queryRunner.manager.create(WalletTransaction, {
        walletId: wallet.id,
        userId,
        type: TransactionType.DEBIT,
        amount,
        balanceBefore,
        balanceAfter,
        description,
        referenceId,
        metadata,
        status: TransactionStatus.COMPLETED,
      });

      const saved = await queryRunner.manager.save(WalletTransaction, transaction);
      await queryRunner.commitTransaction();

      return saved;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ─── Transaction History ──────────────────────────────────────────────────

  async getTransactions(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ transactions: WalletTransaction[]; total: number; balance: number }> {
    const wallet = await this.walletRepository.findOne({ where: { userId } });

    if (!wallet) {
      return { transactions: [], total: 0, balance: 0 };
    }

    const [transactions, total] = await this.transactionRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      transactions,
      total,
      balance: Number(wallet.balance),
    };
  }

  // ─── Internal Helpers ─────────────────────────────────────────────────────

  /**
   * Acquire a pessimistic write lock on the wallet row within a transaction.
   * If `createIfMissing` is true, creates the wallet before locking.
   */
  private async lockWallet(
    queryRunner: QueryRunner,
    userId: string,
    createIfMissing: boolean,
  ): Promise<Wallet> {
    // Ensure wallet exists first (outside the lock, idempotent)
    if (createIfMissing) {
      const exists = await queryRunner.manager.findOne(Wallet, { where: { userId } });
      if (!exists) {
        const wallet = queryRunner.manager.create(Wallet, {
          userId,
          balance: 0,
          currency: 'KES',
          isActive: true,
        });
        await queryRunner.manager.save(Wallet, wallet);
      }
    }

    const wallet = await queryRunner.manager.findOne(Wallet, {
      where: { userId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!wallet) {
      throw new NotFoundException(
        `Wallet not found for user ${userId}. User must have received a credit before debiting.`,
      );
    }

    if (!wallet.isActive) {
      throw new BadRequestException('This wallet has been suspended');
    }

    return wallet;
  }
}