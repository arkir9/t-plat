import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { DataSource } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';

jest.mock('../wallet/wallet.service', () => ({
  WalletService: class MockWalletService {},
}));

import { PaymentsService } from './payments.service';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { Order } from '../tickets/entities/order.entity';
import { WalletService } from '../wallet/wallet.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let paymentRepository: any;
  let orderRepository: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: getRepositoryToken(Payment),
          useValue: { create: jest.fn(), save: jest.fn(), findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(Order),
          useValue: { findOne: jest.fn(), save: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const map: Record<string, string> = {
                STRIPE_SECRET_KEY: '',
                MPESA_ENVIRONMENT: 'sandbox',
                MPESA_CONSUMER_KEY: '',
                MPESA_CONSUMER_SECRET: '',
                MPESA_SHORTCODE: '174379',
                MPESA_PASSKEY: 'test-passkey',
                MPESA_CALLBACK_URL: 'http://localhost:3000/api/payments/mpesa/callback',
                API_URL: 'http://localhost:3000',
                MPESA_INITIATOR_NAME: '',
                MPESA_INITIATOR_PASSWORD: '',
              };
              return map[key] ?? null;
            }),
          },
        },
        { provide: DataSource, useValue: { createQueryRunner: jest.fn() } },
        { provide: HttpService, useValue: { get: jest.fn(), post: jest.fn() } },
        { provide: WalletService, useValue: { credit: jest.fn() } },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    paymentRepository = module.get(getRepositoryToken(Payment));
    orderRepository = module.get(getRepositoryToken(Order));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createStripePayment', () => {
    it('should throw BadRequestException when Stripe is not configured', async () => {
      orderRepository.findOne.mockResolvedValue({
        id: 'order-1',
        userId: 'user-1',
        paymentStatus: 'pending',
      });
      await expect(
        service.createStripePayment('user-1', { orderId: 'order-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for missing order when Stripe not configured', async () => {
      orderRepository.findOne.mockResolvedValue(null);
      await expect(
        service.createStripePayment('user-1', { orderId: 'nonexistent' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createMpesaPayment', () => {
    it('should throw BadRequestException when M-Pesa is not configured', async () => {
      await expect(
        service.createMpesaPayment('user-1', {
          orderId: 'order-1',
          phoneNumber: '254712345678',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyPayment', () => {
    it('should throw NotFoundException for missing payment', async () => {
      paymentRepository.findOne.mockResolvedValue(null);
      await expect(service.verifyPayment('pay-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return the payment when found', async () => {
      const mockPayment = {
        id: 'pay-1',
        userId: 'user-1',
        paymentStatus: PaymentStatus.COMPLETED,
        order: {},
      };
      paymentRepository.findOne.mockResolvedValue(mockPayment);

      const result = await service.verifyPayment('pay-1', 'user-1');
      expect(result.id).toBe('pay-1');
      expect(result.paymentStatus).toBe(PaymentStatus.COMPLETED);
    });
  });

  describe('Revenue Split Calculation', () => {
    it('should calculate 5% platform fee correctly', () => {
      const split = (service as any).calculateSplit(1000, 5);
      expect(split.fee).toBe(50);
      expect(split.net).toBe(950);
    });

    it('should calculate custom fee percentage', () => {
      const split = (service as any).calculateSplit(2000, 10);
      expect(split.fee).toBe(200);
      expect(split.net).toBe(1800);
    });

    it('should default to 5% when no percentage specified', () => {
      const split = (service as any).calculateSplit(1000);
      expect(split.fee).toBe(50);
      expect(split.net).toBe(950);
    });

    it('should handle zero amount', () => {
      const split = (service as any).calculateSplit(0, 5);
      expect(split.fee).toBe(0);
      expect(split.net).toBe(0);
    });
  });
});
