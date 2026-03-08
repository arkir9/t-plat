import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Order, PaymentStatus, PaymentMethod } from '../tickets/entities/order.entity';
import { WalletService } from '../wallet/wallet.service';

interface MpesaOAuthResponse {
  access_token: string;
  expires_in: string;
}

interface MpesaStkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

interface MpesaCallbackBody {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{ Name: string; Value?: string | number }>;
      };
    };
  };
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private walletService: WalletService,
    private configService: ConfigService,
  ) {}

  // ─── M-Pesa STK Push ──────────────────────────────────────────────────────

  async initiateMpesaPayment(orderId: string, phoneNumber: string): Promise<{
    checkoutRequestId: string;
    merchantRequestId: string;
    message: string;
  }> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['event'],
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.paymentStatus !== PaymentStatus.PENDING) {
      throw new BadRequestException(`Order is already ${order.paymentStatus}`);
    }

    const accessToken = await this.getMpesaAccessToken();
    const timestamp = this.getMpesaTimestamp();
    const shortCode = this.configService.getOrThrow<string>('MPESA_SHORTCODE');
    const passkey = this.configService.getOrThrow<string>('MPESA_PASSKEY');
    const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');
    const callbackUrl = this.configService.getOrThrow<string>('MPESA_CALLBACK_URL');

    const payload = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.ceil(order.totalAmount),
      PartyA: this.normalizeMpesaPhone(phoneNumber),
      PartyB: shortCode,
      PhoneNumber: this.normalizeMpesaPhone(phoneNumber),
      CallBackURL: callbackUrl,
      AccountReference: order.orderNumber,
      TransactionDesc: `Payment for ${order.event?.title ?? 'event'} - ${order.orderNumber}`,
    };

    try {
      const { data } = await axios.post<MpesaStkPushResponse>(
        'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (data.ResponseCode !== '0') {
        throw new BadRequestException(`M-Pesa error: ${data.ResponseDescription}`);
      }

      // Save checkout request ID for callback matching
      await this.orderRepository.update(orderId, {
        mpesaCheckoutRequestId: data.CheckoutRequestID,
        mpesaMerchantRequestId: data.MerchantRequestID,
        paymentStatus: PaymentStatus.PROCESSING,
      });

      return {
        checkoutRequestId: data.CheckoutRequestID,
        merchantRequestId: data.MerchantRequestID,
        message: 'STK push sent. Please check your phone and enter M-Pesa PIN.',
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`M-Pesa STK push failed: ${error?.message}`);
      throw new BadRequestException('Failed to initiate M-Pesa payment. Please try again.');
    }
  }

  // ─── M-Pesa Callback ──────────────────────────────────────────────────────

  async handleMpesaCallback(body: MpesaCallbackBody): Promise<void> {
    const callback = body?.Body?.stkCallback;
    if (!callback) {
      this.logger.warn('M-Pesa callback missing stkCallback body');
      return;
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callback;

    const order = await this.orderRepository.findOne({
      where: { mpesaCheckoutRequestId: CheckoutRequestID },
    });
    if (!order) {
      this.logger.warn(`No order found for M-Pesa CheckoutRequestID: ${CheckoutRequestID}`);
      return;
    }

    if (ResultCode === 0) {
      // Extract M-Pesa receipt number
      const receiptItem = CallbackMetadata?.Item?.find((i) => i.Name === 'MpesaReceiptNumber');
      const mpesaReceiptNumber = receiptItem?.Value?.toString();

      await this.orderRepository.update(order.id, {
        paymentStatus: PaymentStatus.COMPLETED,
        paymentDate: new Date(),
        mpesaTransactionCode: mpesaReceiptNumber,
      });

      // Credit organizer wallet (net amount minus platform commission)
      await this.creditOrganizerWallet(order);

      this.logger.log(`Payment completed for order ${order.orderNumber} — receipt: ${mpesaReceiptNumber}`);
    } else {
      await this.orderRepository.update(order.id, {
        paymentStatus: PaymentStatus.FAILED,
        paymentFailureReason: ResultDesc ?? 'Payment failed',
      });

      this.logger.warn(`Payment failed for order ${order.orderNumber}: ${ResultDesc}`);
    }
  }

  // ─── Verify M-Pesa Payment (poll by checkoutRequestId) ──────────────────────

  async verifyMpesaPayment(
    checkoutRequestId: string,
    userId: string,
  ): Promise<{ paymentStatus: string; order?: Order }> {
    const order = await this.orderRepository.findOne({
      where: { mpesaCheckoutRequestId: checkoutRequestId, userId },
      relations: ['event', 'tickets'],
    });
    if (!order) throw new NotFoundException('Order not found');
    return {
      paymentStatus: order.paymentStatus,
      order,
    };
  }

  // ─── Manual / Wallet Pay ──────────────────────────────────────────────────

  async payWithWallet(orderId: string, userId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, userId },
      relations: ['event'],
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.paymentStatus !== PaymentStatus.PENDING) {
      throw new BadRequestException(`Order is already ${order.paymentStatus}`);
    }

    await this.walletService.debit({
      userId,
      amount: order.totalAmount,
      description: `Payment for ${order.event?.title ?? 'event'} — ${order.orderNumber}`,
      referenceId: order.id,
    });

    await this.orderRepository.update(order.id, {
      paymentStatus: PaymentStatus.COMPLETED,
      paymentMethod: PaymentMethod.WALLET,
      paymentDate: new Date(),
    });

    return this.orderRepository.findOne({ where: { id: order.id } });
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private async creditOrganizerWallet(order: Order): Promise<void> {
    try {
      // order.event.organizerUserId must be set in the DB relation
      const organizerUserId = (order as any).event?.organizer?.userId;
      if (!organizerUserId) {
        this.logger.warn(`Cannot credit organizer — no organizer userId on order ${order.id}`);
        return;
      }

      await this.walletService.credit({
        userId: organizerUserId,
        amount: order.netAmount,
        description: `Earnings from order ${order.orderNumber}`,
        referenceId: order.id,
        metadata: {
          orderId: order.id,
          totalAmount: order.totalAmount,
          platformCommission: order.platformCommissionAmount,
        },
      });
    } catch (err: any) {
      // Non-fatal — log and continue so payment isn't marked as failed
      this.logger.error(`Failed to credit organizer wallet for order ${order.id}: ${err?.message}`);
    }
  }

  private async getMpesaAccessToken(): Promise<string> {
    const consumerKey = this.configService.getOrThrow<string>('MPESA_CONSUMER_KEY');
    const consumerSecret = this.configService.getOrThrow<string>('MPESA_CONSUMER_SECRET');
    const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    const { data } = await axios.get<MpesaOAuthResponse>(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      { headers: { Authorization: `Basic ${credentials}` } },
    );

    return data.access_token;
  }

  private getMpesaTimestamp(): string {
    return new Date()
      .toISOString()
      .replace(/[-:T.Z]/g, '')
      .slice(0, 14);
  }

  private normalizeMpesaPhone(phone: string): string {
    // Convert +254XXXXXXXXX or 07XXXXXXXX to 2547XXXXXXXX
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) return `254${cleaned.slice(1)}`;
    if (cleaned.startsWith('+')) return cleaned.slice(1);
    return cleaned;
  }
}