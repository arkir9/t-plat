import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import Stripe from 'stripe';
import * as crypto from 'crypto';
import { Payment, PaymentMethod, PaymentStatus, Currency } from './entities/payment.entity';
import { Order, PaymentStatus as OrderPaymentStatus } from '../tickets/entities/order.entity';
import { CreateStripePaymentDto, CreateMpesaPaymentDto, RefundPaymentDto } from './dto';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;
  private mpesaBaseUrl: string;
  private mpesaConsumerKey: string;
  private mpesaConsumerSecret: string;
  private mpesaShortcode: string;
  private mpesaPasskey: string;
  private mpesaEnvironment: string;
  private mpesaCallbackUrl: string;

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private configService: ConfigService,
    private dataSource: DataSource,
    private httpService: HttpService,
  ) {
    // Initialize Stripe
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (stripeSecretKey) {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2023-10-16',
      });
    }

    // Initialize M-Pesa
    this.mpesaBaseUrl =
      this.configService.get<string>('MPESA_ENVIRONMENT') === 'production'
        ? 'https://api.safaricom.co.ke'
        : 'https://sandbox.safaricom.co.ke';
    this.mpesaConsumerKey = this.configService.get<string>('MPESA_CONSUMER_KEY') || '';
    this.mpesaConsumerSecret = this.configService.get<string>('MPESA_CONSUMER_SECRET') || '';
    this.mpesaShortcode = this.configService.get<string>('MPESA_SHORTCODE') || '';
    this.mpesaPasskey = this.configService.get<string>('MPESA_PASSKEY') || '';
    this.mpesaEnvironment = this.configService.get<string>('MPESA_ENVIRONMENT') || 'sandbox';
    this.mpesaCallbackUrl =
      this.configService.get<string>('MPESA_CALLBACK_URL') ||
      `${this.configService.get<string>('API_URL')}/api/payments/mpesa/callback`;
  }

  /**
   * Get M-Pesa access token
   */
  private async getMpesaAccessToken(): Promise<string> {
    try {
      const auth = Buffer.from(`${this.mpesaConsumerKey}:${this.mpesaConsumerSecret}`).toString(
        'base64',
      );
      const response = await firstValueFrom(
        this.httpService.get(`${this.mpesaBaseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }),
      );
      return response.data.access_token;
    } catch (error: any) {
      throw new InternalServerErrorException('Failed to get M-Pesa access token: ' + error.message);
    }
  }

  /**
   * Generate M-Pesa password
   */
  private generateMpesaPassword(): string {
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(`${this.mpesaShortcode}${this.mpesaPasskey}${timestamp}`).toString(
      'base64',
    );
    return password;
  }

  /**
   * Create Stripe payment intent
   */
  async createStripePayment(userId: string, createDto: CreateStripePaymentDto) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    const order = await this.orderRepository.findOne({
      where: { id: createDto.orderId },
      relations: ['user', 'event'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new BadRequestException('You do not have permission to pay for this order');
    }

    if (order.paymentStatus === OrderPaymentStatus.COMPLETED) {
      throw new BadRequestException('Order is already paid');
    }

    // Convert amount to cents (Stripe uses smallest currency unit)
    const amountInCents = Math.round(order.totalAmount * 100);

    try {
      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency: order.currency.toLowerCase(),
        metadata: {
          orderId: order.id,
          userId: userId,
          eventId: order.eventId,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Create payment record
      const payment = this.paymentRepository.create({
        orderId: order.id,
        userId: userId,
        amount: order.totalAmount,
        currency: order.currency as Currency,
        paymentMethod: PaymentMethod.STRIPE,
        paymentStatus: PaymentStatus.PENDING,
        paymentIntentId: paymentIntent.id,
        metadata: {
          stripeClientSecret: paymentIntent.client_secret,
        },
      });

      await this.paymentRepository.save(payment);

      // Update order with payment intent ID
      order.paymentIntentId = paymentIntent.id;
      await this.orderRepository.save(order);

      return {
        paymentId: payment.id,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error: any) {
      throw new InternalServerErrorException('Failed to create Stripe payment: ' + error.message);
    }
  }

  /**
   * Create M-Pesa STK Push payment
   */
  async createMpesaPayment(userId: string, createDto: CreateMpesaPaymentDto) {
    if (!this.mpesaConsumerKey || !this.mpesaConsumerSecret) {
      throw new BadRequestException('M-Pesa is not configured');
    }

    const order = await this.orderRepository.findOne({
      where: { id: createDto.orderId },
      relations: ['user', 'event'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new BadRequestException('You do not have permission to pay for this order');
    }

    if (order.paymentStatus === OrderPaymentStatus.COMPLETED) {
      throw new BadRequestException('Order is already paid');
    }

    try {
      // Get access token
      const accessToken = await this.getMpesaAccessToken();

      // Generate password
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
      const password = this.generateMpesaPassword();

      // Format phone number (remove + if present)
      const phoneNumber = createDto.phoneNumber.replace(/^\+/, '');

      // STK Push request
      const stkPushResponse = await firstValueFrom(
        this.httpService.post(
          `${this.mpesaBaseUrl}/mpesa/stkpush/v1/processrequest`,
          {
            BusinessShortCode: this.mpesaShortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: Math.round(order.totalAmount),
            PartyA: phoneNumber,
            PartyB: this.mpesaShortcode,
            PhoneNumber: phoneNumber,
            CallBackURL: this.mpesaCallbackUrl,
            AccountReference: `T-PLAT-${order.orderNumber}`,
            TransactionDesc: `Payment for order ${order.orderNumber}`,
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      if (stkPushResponse.data.ResponseCode !== '0') {
        throw new BadRequestException(
          `M-Pesa STK Push failed: ${stkPushResponse.data.ResponseDescription}`,
        );
      }

      // Create payment record
      const payment = this.paymentRepository.create({
        orderId: order.id,
        userId: userId,
        amount: order.totalAmount,
        currency: order.currency as Currency,
        paymentMethod: PaymentMethod.MPESA,
        paymentStatus: PaymentStatus.PROCESSING,
        mpesaPhoneNumber: phoneNumber,
        metadata: {
          checkoutRequestID: stkPushResponse.data.CheckoutRequestID,
          merchantRequestID: stkPushResponse.data.MerchantRequestID,
        },
      });

      await this.paymentRepository.save(payment);

      // Update order
      order.paymentMethod = PaymentMethod.MPESA;
      order.paymentIntentId = stkPushResponse.data.CheckoutRequestID;
      await this.orderRepository.save(order);

      return {
        paymentId: payment.id,
        checkoutRequestID: stkPushResponse.data.CheckoutRequestID,
        message: 'M-Pesa STK Push initiated. Please check your phone to complete payment.',
      };
    } catch (error: any) {
      if (error.response) {
        throw new BadRequestException(
          `M-Pesa payment failed: ${error.response.data?.errorMessage || error.message}`,
        );
      }
      throw new InternalServerErrorException('Failed to create M-Pesa payment: ' + error.message);
    }
  }

  /**
   * Handle M-Pesa callback
   */
  async handleMpesaCallback(callbackData: any) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { Body } = callbackData;
      const stkCallback = Body.stkCallback;
      const checkoutRequestID = stkCallback.CheckoutRequestID;
      const resultCode = stkCallback.ResultCode;
      const resultDesc = stkCallback.ResultDesc;

      // Find payment by checkout request ID (stored in metadata JSONB)
      // TypeORM doesn't support nested JSONB queries easily, so we use a query builder
      const payment = await queryRunner.manager
        .createQueryBuilder(Payment, 'payment')
        .leftJoinAndSelect('payment.order', 'order')
        .where("payment.metadata->>'checkoutRequestID' = :checkoutRequestID", {
          checkoutRequestID,
        })
        .getOne();

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      if (resultCode === 0) {
        // Payment successful
        const callbackMetadata = stkCallback.CallbackMetadata;
        const item = callbackMetadata.Item.find((i: any) => i.Name === 'MpesaReceiptNumber');
        const mpesaReceiptNumber = item?.Value;

        payment.paymentStatus = PaymentStatus.COMPLETED;
        payment.mpesaTransactionCode = mpesaReceiptNumber;
        payment.transactionId = mpesaReceiptNumber;
        payment.processedAt = new Date();
        payment.metadata = {
          ...payment.metadata,
          mpesaReceiptNumber,
          resultCode,
          resultDesc,
        };

        // Update order
        const order = payment.order;
        order.paymentStatus = OrderPaymentStatus.COMPLETED;
        order.mpesaTransactionCode = mpesaReceiptNumber;
        order.paymentDate = new Date();

        await queryRunner.manager.save(Payment, payment);
        await queryRunner.manager.save(Order, order);

        await queryRunner.commitTransaction();

        return { success: true, message: 'Payment processed successfully' };
      } else {
        // Payment failed
        payment.paymentStatus = PaymentStatus.FAILED;
        payment.failureReason = resultDesc;
        payment.metadata = {
          ...payment.metadata,
          resultCode,
          resultDesc,
        };

        // Update order
        const order = payment.order;
        order.paymentStatus = OrderPaymentStatus.FAILED;

        await queryRunner.manager.save(Payment, payment);
        await queryRunner.manager.save(Order, order);

        await queryRunner.commitTransaction();

        return { success: false, message: resultDesc };
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Handle Stripe webhook
   */
  async handleStripeWebhook(signature: string, payload: Buffer) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new BadRequestException('Stripe webhook secret not configured');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error: any) {
      throw new BadRequestException(`Webhook signature verification failed: ${error.message}`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          await this.processStripePaymentSuccess(paymentIntent, queryRunner);
          break;

        case 'payment_intent.payment_failed':
          const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
          await this.processStripePaymentFailure(failedPaymentIntent, queryRunner);
          break;

        case 'charge.refunded':
          const charge = event.data.object as Stripe.Charge;
          await this.processStripeRefund(charge, queryRunner);
          break;
      }

      await queryRunner.commitTransaction();
      return { received: true };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Process successful Stripe payment
   */
  private async processStripePaymentSuccess(
    paymentIntent: Stripe.PaymentIntent,
    queryRunner: any,
  ) {
    const payment = await queryRunner.manager.findOne(Payment, {
      where: { paymentIntentId: paymentIntent.id },
      relations: ['order'],
    });

    if (!payment) {
      return;
    }

    payment.paymentStatus = PaymentStatus.COMPLETED;
    payment.stripeChargeId = paymentIntent.latest_charge as string;
    payment.transactionId = paymentIntent.id;
    payment.processedAt = new Date();

    const order = payment.order;
    order.paymentStatus = OrderPaymentStatus.COMPLETED;
    order.paymentDate = new Date();

    await queryRunner.manager.save(Payment, payment);
    await queryRunner.manager.save(Order, order);
  }

  /**
   * Process failed Stripe payment
   */
  private async processStripePaymentFailure(
    paymentIntent: Stripe.PaymentIntent,
    queryRunner: any,
  ) {
    const payment = await queryRunner.manager.findOne(Payment, {
      where: { paymentIntentId: paymentIntent.id },
      relations: ['order'],
    });

    if (!payment) {
      return;
    }

    payment.paymentStatus = PaymentStatus.FAILED;
    payment.failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';

    const order = payment.order;
    order.paymentStatus = OrderPaymentStatus.FAILED;

    await queryRunner.manager.save(Payment, payment);
    await queryRunner.manager.save(Order, order);
  }

  /**
   * Process Stripe refund
   */
  private async processStripeRefund(charge: Stripe.Charge, queryRunner: any) {
    // Find payment by charge ID
    const payment = await queryRunner.manager.findOne(Payment, {
      where: { stripeChargeId: charge.id },
      relations: ['order'],
    });

    if (!payment) {
      return;
    }

    // Update payment status based on refund amount
    if (charge.amount_refunded === charge.amount) {
      // Full refund
      payment.paymentStatus = PaymentStatus.REFUNDED;
      const order = payment.order;
      order.paymentStatus = OrderPaymentStatus.REFUNDED;
      await queryRunner.manager.save(Order, order);
    } else {
      // Partial refund
      payment.paymentStatus = PaymentStatus.PARTIALLY_REFUNDED;
    }

    payment.metadata = {
      ...payment.metadata,
      refundAmount: charge.amount_refunded,
      refundedAt: new Date().toISOString(),
    };

    await queryRunner.manager.save(Payment, payment);
  }

  /**
   * Verify payment status
   */
  async verifyPayment(paymentId: string, userId: string) {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['order', 'user'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.userId !== userId) {
      throw new BadRequestException('You do not have permission to view this payment');
    }

    return {
      id: payment.id,
      status: payment.paymentStatus,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.paymentMethod,
      transactionId: payment.transactionId,
      processedAt: payment.processedAt,
    };
  }
}
