import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { WalletAccount, WalletCurrency } from './entities/wallet-account.entity';
import {
  WalletTransaction,
  WalletTransactionType,
} from './entities/wallet-transaction.entity';

jest.mock('../payments/payments.service', () => ({
  PaymentsService: class MockPaymentsService {},
}));

import { WalletService } from './wallet.service';
import { PaymentsService } from '../payments/payments.service';

describe('WalletService', () => {
  let service: WalletService;
  let walletRepo: jest.Mocked<Repository<WalletAccount>>;
  let transactionRepo: jest.Mocked<Repository<WalletTransaction>>;
  let paymentsService: any;

  const mockWallet: Partial<WalletAccount> = {
    id: 'wallet-1',
    userId: 'user-1',
    balance: 5000,
    currency: WalletCurrency.KES,
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    isTransactionActive: false,
    manager: {
      findOne: jest.fn(),
      save: jest.fn(),
    },
  };

  beforeEach(async () => {
    mockQueryRunner.connect.mockReset();
    mockQueryRunner.startTransaction.mockReset();
    mockQueryRunner.commitTransaction.mockReset();
    mockQueryRunner.rollbackTransaction.mockReset();
    mockQueryRunner.release.mockReset();
    mockQueryRunner.manager.findOne.mockReset();
    mockQueryRunner.manager.save.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: getRepositoryToken(WalletAccount),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(WalletTransaction),
          useValue: {
            find: jest.fn(),
            create: jest.fn().mockImplementation((data) => data),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: { createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner) },
        },
        {
          provide: PaymentsService,
          useValue: { initiateB2CWithdrawal: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    walletRepo = module.get(getRepositoryToken(WalletAccount));
    transactionRepo = module.get(getRepositoryToken(WalletTransaction));
    paymentsService = module.get(PaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOrCreateWallet', () => {
    it('should return existing wallet', async () => {
      walletRepo.findOne.mockResolvedValue(mockWallet as WalletAccount);
      const result = await service.getOrCreateWallet('user-1');
      expect(result).toEqual(mockWallet);
    });

    it('should create wallet if none exists', async () => {
      walletRepo.findOne.mockResolvedValue(null);
      walletRepo.create.mockReturnValue({ ...mockWallet, balance: 0 } as WalletAccount);
      walletRepo.save.mockResolvedValue({ ...mockWallet, balance: 0 } as WalletAccount);

      const result = await service.getOrCreateWallet('user-1');
      expect(walletRepo.create).toHaveBeenCalledWith({
        userId: 'user-1',
        currency: WalletCurrency.KES,
        balance: 0,
      });
      expect(result.balance).toBe(0);
    });
  });

  describe('credit', () => {
    it('should credit wallet and create transaction record', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue({ ...mockWallet, balance: 5000 });
      mockQueryRunner.manager.save
        .mockResolvedValueOnce({ ...mockWallet, balance: 6000 })
        .mockResolvedValueOnce({ id: 'tx-1' });

      await service.credit('user-1', 1000, WalletTransactionType.TICKET_SALE, 'pay-1');

      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw if wallet not found', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue(null);

      await expect(
        service.credit('user-1', 1000, WalletTransactionType.CREDIT),
      ).rejects.toThrow(BadRequestException);

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('withdrawFunds', () => {
    it('should reject negative amounts', async () => {
      await expect(
        service.withdrawFunds('user-1', -100, '+254712345678'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject zero amounts', async () => {
      await expect(
        service.withdrawFunds('user-1', 0, '+254712345678'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject if wallet not found', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue(null);
      await expect(
        service.withdrawFunds('user-1', 1000, '+254712345678'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject insufficient funds', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue({ ...mockWallet, balance: 500 });
      await expect(
        service.withdrawFunds('user-1', 1000, '+254712345678'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should debit wallet and initiate B2C transfer on success', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue({ ...mockWallet, balance: 5000 });
      mockQueryRunner.manager.save
        .mockResolvedValueOnce({ ...mockWallet, balance: 4000 })
        .mockResolvedValueOnce({ id: 'tx-1', meta: {} });

      paymentsService.initiateB2CWithdrawal.mockResolvedValue({
        conversationId: 'conv-1',
        originatorConversationId: 'orig-1',
      });

      const result = await service.withdrawFunds('user-1', 1000, '+254712345678');

      expect(result.success).toBe(true);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(paymentsService.initiateB2CWithdrawal).toHaveBeenCalledWith(
        'tx-1',
        '+254712345678',
        1000,
      );
    });
  });

  describe('getTransactions', () => {
    it('should return recent transactions ordered by date DESC', async () => {
      walletRepo.findOne.mockResolvedValue(mockWallet as WalletAccount);
      transactionRepo.find.mockResolvedValue([]);

      await service.getTransactions('user-1');

      expect(transactionRepo.find).toHaveBeenCalledWith({
        where: { walletId: mockWallet.id },
        order: { createdAt: 'DESC' },
        take: 50,
      });
    });
  });
});
