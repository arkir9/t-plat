import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WalletAccount, WalletCurrency } from './entities/wallet-account.entity';
import { WalletTransaction, WalletTransactionType } from './entities/wallet-transaction.entity';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(WalletAccount)
    private walletRepository: Repository<WalletAccount>,
    @InjectRepository(WalletTransaction)
    private transactionRepository: Repository<WalletTransaction>,
  ) {}

  // Groundwork: method signatures only – implementation will be added later

  async getOrCreateWallet(userId: string, currency: WalletCurrency = WalletCurrency.KES) {
    // TODO: implement wallet creation + lookup
    return this.walletRepository.findOne({ where: { userId } });
  }

  async getWallet(userId: string) {
    // TODO: implement proper wallet retrieval
    return this.walletRepository.findOne({ where: { userId } });
  }

  async credit(
    walletId: string,
    amount: number,
    type: WalletTransactionType,
    referenceId?: string,
    meta?: Record<string, any>,
  ) {
    // TODO: implement atomic credit logic
    return { walletId, amount, type, referenceId, meta };
  }

  async debit(
    walletId: string,
    amount: number,
    type: WalletTransactionType,
    referenceId?: string,
    meta?: Record<string, any>,
  ) {
    // TODO: implement atomic debit with balance checks
    return { walletId, amount, type, referenceId, meta };
  }

  async getTransactions(userId: string, limit = 20, offset = 0) {
    // TODO: implement transaction history lookup
    return this.transactionRepository.find({
      where: {},
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });
  }
}

