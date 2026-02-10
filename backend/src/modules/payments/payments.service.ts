import {
  Injectable,
  Inject,
  forwardRef,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import Stripe from 'stripe';
import { Payment, PaymentMethod, PaymentStatus, Currency } from './entities/payment.entity';
import { Order, PaymentStatus as OrderPaymentStatus } from '../tickets/entities/order.entity';
import { CreateStripePaymentDto, CreateMpesaPaymentDto } from './dto';
import { WalletService } from '../wallet/wallet.service';
import { WalletTransactionType } from '../wallet/entities/wallet-transaction.entity';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;
  private readonly logger = new Logger(PaymentsService.name);

  // M-Pesa Configs
  private mpesaBaseUrl: string;
  private mpesaConsumerKey: string;
  private mpesaConsumerSecret: string;
  private mpesaShortcode: string;
  private mpesaPasskey: string;
  private mpesaCallbackUrl: string;

  // B2C Configs
  private mpesaInitiatorName: string;
  private mpesaInitiatorPassword: string;

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private configService: ConfigService,
    private dataSource: DataSource,
    private httpService: HttpService,
    @Inject(forwardRef(() => WalletService))
    private walletService: WalletService,
  ) {
    // Stripe Init
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (stripeSecretKey) {
      this.stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });
    }

    // M-Pesa Init
    this.mpesaBaseUrl =
      this.configService.get<string>('MPESA_ENVIRONMENT') === 'production'
        ? 'https://api.safaricom.co.ke'
        : 'https://sandbox.safaricom.co.ke';
    this.mpesaConsumerKey = this.configService.get<string>('MPESA_CONSUMER_KEY') || '';
    this.mpesaConsumerSecret = this.configService.get<string>('MPESA_CONSUMER_SECRET') || '';
    this.mpesaShortcode = this.configService.get<string>('MPESA_SHORTCODE') || '';
    this.mpesaPasskey = this.configService.get<string>('MPESA_PASSKEY') || '';
    this.mpesaCallbackUrl =
      this.configService.get<string>('MPESA_CALLBACK_URL') ||
      `${this.configService.get<string>('API_URL')}/api/payments/mpesa/callback`;

    this.mpesaInitiatorName = this.configService.get<string>('MPESA_INITIATOR_NAME') || '';
    this.mpesaInitiatorPassword = this.configService.get<string>('MPESA_INITIATOR_PASSWORD') || '';
  }

  /**
   * Helper: Get M-Pesa Access Token
   */
  private async getMpesaAccessToken(): Promise<string> {
    const auth = Buffer.from(`${this.mpesaConsumerKey}:${this.mpesaConsumerSecret}`).toString(
      'base64',
    );
    const response = await firstValueFrom(
      this.httpService.get(`${this.mpesaBaseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: { Authorization: `Basic ${auth}` },
      }),
    );
    return response.data.access_token;
  }

  /**
   * Helper: Generate M-Pesa Password
   */
  private generateMpesaPassword(): string {
    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, '')
      .slice(0, -3);
    return Buffer.from(`${this.mpesaShortcode}${this.mpesaPasskey}${timestamp}`).toString('base64');
  }

  /**
   * Helper: Calculate Revenue Split
   * Defaults to 5% if not specified on the event
   */
  private calculateSplit(totalAmount: number, platformFeePercent: number = 5) {
    const fee = (totalAmount * platformFeePercent) / 100;
    const net = totalAmount - fee;
    return { fee, net };
  }

  // ===========================================================================
  // STRIPE PAYMENTS (Instant Split)
  // ===========================================================================

  async createStripePayment(userId: string, createDto: CreateStripePaymentDto) {
    if (!this.stripe) throw new BadRequestException('Stripe is not configured');

    const order = await this.orderRepository.findOne({
      where: { id: createDto.orderId },
      relations: ['user', 'event', 'event.organizer'],
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new BadRequestException('Permission denied');
    if (order.paymentStatus === OrderPaymentStatus.COMPLETED)
      throw new BadRequestException('Already paid');

    const currency = order.currency.toLowerCase();
    const amountInCents = Math.round(order.totalAmount * 100);

    // Revenue Split Calculation (use order's platform commission or default 5%)
    const feePercentage = Number(order.platformCommissionPercentage) || 5;
    const appFeeInCents = Math.round(amountInCents * (feePercentage / 100));
    const organizerStripeId = order.event.organizer?.stripeAccountId ?? null;

    const params: Stripe.PaymentIntentCreateParams = {
      amount: amountInCents,
      currency: currency,
      metadata: { orderId: order.id, userId, eventId: order.eventId },
      automatic_payment_methods: { enabled: true },
    };

    // If Organizer has Stripe Connect, route funds instantly
    if (organizerStripeId) {
      params.application_fee_amount = appFeeInCents;
      params.transfer_data = { destination: organizerStripeId };
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create(params);

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
          feePercentage,
          isConnectSplit: !!organizerStripeId,
        },
      });

      await this.paymentRepository.save(payment);

      order.paymentIntentId = paymentIntent.id;
      await this.orderRepository.save(order);

      return {
        paymentId: payment.id,
        clientSecret: paymentIntent.client_secret,
      };
    } catch (error: any) {
      throw new InternalServerErrorException('Stripe init failed: ' + error.message);
    }
  }

  // ===========================================================================
  // M-PESA STK PUSH (Incoming Payment)
  // ===========================================================================

  async createMpesaPayment(userId: string, createDto: CreateMpesaPaymentDto) {
    if (!this.mpesaConsumerKey) throw new BadRequestException('M-Pesa not configured');

    const order = await this.orderRepository.findOne({
      where: { id: createDto.orderId },
      relations: ['user', 'event'],
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.paymentStatus === OrderPaymentStatus.COMPLETED)
      throw new BadRequestException('Already paid');

    try {
      const accessToken = await this.getMpesaAccessToken();
      const timestamp = new Date()
        .toISOString()
        .replace(/[^0-9]/g, '')
        .slice(0, -3);
      const password = this.generateMpesaPassword();
      const phoneNumber = createDto.phoneNumber.replace(/^\+/, '');

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
            TransactionDesc: `Order ${order.orderNumber}`,
          },
          { headers: { Authorization: `Bearer ${accessToken}` } },
        ),
      );

      if (stkPushResponse.data.ResponseCode !== '0') {
        throw new BadRequestException(
          `STK Push failed: ${stkPushResponse.data.ResponseDescription}`,
        );
      }

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
        },
      });

      await this.paymentRepository.save(payment);

      order.paymentMethod = PaymentMethod.MPESA;
      order.paymentIntentId = stkPushResponse.data.CheckoutRequestID;
      await this.orderRepository.save(order);

      return {
        paymentId: payment.id,
        message: 'STK Push sent.',
      };
    } catch (error: any) {
      throw new InternalServerErrorException('M-Pesa init failed: ' + error.message);
    }
  }

  async handleMpesaCallback(callbackData: any) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const stkCallback = callbackData.Body.stkCallback;
      const checkoutRequestID = stkCallback.CheckoutRequestID;
      const resultCode = stkCallback.ResultCode;

      // Find Payment by CheckoutRequestID (stored in metadata)
      // Note: We need deep relations to get organizer userId for wallet credit
      const payment = await queryRunner.manager
        .createQueryBuilder(Payment, 'payment')
        .leftJoinAndSelect('payment.order', 'order')
        .leftJoinAndSelect('order.event', 'event')
        .leftJoinAndSelect('event.organizer', 'organizer')
        .where("payment.metadata->>'checkoutRequestID' = :checkoutRequestID", { checkoutRequestID })
        .getOne();

      if (!payment) {
        this.logger.error(`Callback received for unknown checkoutID: ${checkoutRequestID}`);
        return { success: false };
      }

      if (resultCode === 0) {
        // --- PAYMENT SUCCESS ---
        const mpesaReceipt = stkCallback.CallbackMetadata.Item.find(
          (i: any) => i.Name === 'MpesaReceiptNumber',
        )?.Value;

        // 1. Calculate Split
        const feePercent = Number(payment.order.platformCommissionPercentage) || 5;
        const total = Number(payment.amount);
        const { fee, net } = this.calculateSplit(total, feePercent);

        // 2. Update Payment
        payment.paymentStatus = PaymentStatus.COMPLETED;
        payment.transactionId = mpesaReceipt;
        payment.metadata = {
          ...payment.metadata,
          mpesaReceiptNumber: mpesaReceipt,
          platformFee: fee,
          organizerNet: net,
        };

        const order = payment.order;
        order.paymentStatus = OrderPaymentStatus.COMPLETED;

        await queryRunner.manager.save(Payment, payment);
        await queryRunner.manager.save(Order, order);
        await queryRunner.commitTransaction();

        // 3. CREDIT WALLET (Instant Ledger Split)
        try {
          const organizerUserId = order.event.organizer.userId;

          // Invoke Wallet Service (Circular dependency handled via forwardRef)
          await this.walletService.credit(
            organizerUserId,
            net,
            WalletTransactionType.TICKET_SALE,
            payment.id,
            { orderId: order.id, feeCharged: fee },
          );

          this.logger.log(`Wallet credited: ${net} for user ${organizerUserId}`);
        } catch (walletError) {
          this.logger.error(`Failed to credit wallet for payment ${payment.id}`, walletError);
        }

        return { success: true };
      } else {
        // --- PAYMENT FAILED ---
        payment.paymentStatus = PaymentStatus.FAILED;
        payment.failureReason = stkCallback.ResultDesc;
        payment.order.paymentStatus = OrderPaymentStatus.FAILED;

        await queryRunner.manager.save(Payment, payment);
        await queryRunner.manager.save(Order, payment.order);
        await queryRunner.commitTransaction();

        return { success: false };
      }
    } catch (error) {
      if (queryRunner.isTransactionActive) await queryRunner.rollbackTransaction();
      this.logger.error('Callback processing failed', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ===========================================================================
  // M-PESA B2C (Withdrawal)
  // ===========================================================================

  /**
   * Generates Security Credential for B2C
   * In Production: Load Cert -> Public Encrypt -> Base64
   */
  private getSecurityCredential(): string {
    return 'MOCKED_ENCRYPTED_CREDENTIAL';
  }

  async initiateB2CWithdrawal(transactionId: string, phoneNumber: string, amount: number) {
    if (!this.mpesaConsumerKey) throw new BadRequestException('M-Pesa not configured');

    const accessToken = await this.getMpesaAccessToken();
    const securityCredential = this.getSecurityCredential();
    const commandID = 'BusinessPayment';

    const url = `${this.mpesaBaseUrl}/mpesa/b2c/v1/paymentrequest`;
    const payload = {
      InitiatorName: this.mpesaInitiatorName,
      SecurityCredential: securityCredential,
      CommandID: commandID,
      Amount: Math.round(amount),
      PartyA: this.mpesaShortcode,
      PartyB: phoneNumber.replace(/^\+/, ''),
      Remarks: `Withdrawal ${transactionId}`,
      QueueTimeOutURL: `${this.mpesaCallbackUrl}/b2c_timeout`,
      ResultURL: `${this.mpesaCallbackUrl}/b2c_result`,
      Occasion: 'Withdrawal',
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, payload, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      );

      this.logger.log(`B2C Initiated for ${phoneNumber}: ${response.data.ConversationID}`);

      return {
        conversationId: response.data.ConversationID,
        originatorConversationId: response.data.OriginatorConversationID,
      };
    } catch (error: any) {
      this.logger.error('B2C Failed', error.response?.data);
      throw new InternalServerErrorException(
        'Failed to initiate M-Pesa transfer: ' +
          (error.response?.data?.errorMessage || error.message),
      );
    }
  }

  async handleStripeWebhook(signature: string, payload: Buffer): Promise<{ received: boolean }> {
    if (!this.stripe) throw new BadRequestException('Stripe is not configured');
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || '',
      );

      this.logger.log(`Stripe webhook received: ${event.id} - ${event.type}`);

      switch (event.type) {
        case 'payment_intent.succeeded': {
          const intent = event.data.object as Stripe.PaymentIntent;
          const paymentIntentId = intent.id;

          const queryRunner = this.dataSource.createQueryRunner();
          await queryRunner.connect();
          await queryRunner.startTransaction();

          try {
            const payment = await queryRunner.manager.findOne(Payment, {
              where: { paymentIntentId },
              relations: ['order', 'order.event', 'order.event.organizer'],
            });

            if (!payment) {
              this.logger.error(`Stripe webhook: payment not found for intent ${paymentIntentId}`);
              await queryRunner.rollbackTransaction();
              return { received: true };
            }

            // Idempotency: if already completed/failed, do nothing
            if (payment.paymentStatus === PaymentStatus.COMPLETED) {
              await queryRunner.rollbackTransaction();
              return { received: true };
            }

            const order = payment.order;
            const feePercent =
              Number(order.platformCommissionPercentage) ||
              Number(payment.metadata?.feePercentage) ||
              5;
            const total = Number(payment.amount);
            const { fee, net } = this.calculateSplit(total, feePercent);

            // Extract charge id if available
            payment.paymentStatus = PaymentStatus.COMPLETED;
            payment.processedAt = new Date();
            payment.metadata = {
              ...(payment.metadata ?? {}),
              stripeEventId: event.id,
              platformFee: fee,
              organizerNet: net,
            };

            order.paymentStatus = OrderPaymentStatus.COMPLETED;
            order.paymentDate = new Date();

            await queryRunner.manager.save(Payment, payment);
            await queryRunner.manager.save(Order, order);
            await queryRunner.commitTransaction();

            // Credit organizer wallet (ledger view of split)
            try {
              const organizerUserId = order.event.organizer.userId;
              await this.walletService.credit(
                organizerUserId,
                net,
                WalletTransactionType.TICKET_SALE,
                payment.id,
                { orderId: order.id, feeCharged: fee, source: 'stripe' },
              );
              this.logger.log(
                `Stripe webhook: wallet credited ${net} for user ${organizerUserId} (payment ${payment.id})`,
              );
            } catch (walletError) {
              this.logger.error(
                `Stripe webhook: failed to credit wallet for payment ${payment.id}`,
                walletError as any,
              );
            } finally {
              await queryRunner.release();
            }

            break;
          } catch (err) {
            if (queryRunner.isTransactionActive) {
              await queryRunner.rollbackTransaction();
            }
            await queryRunner.release();
            this.logger.error('Stripe webhook processing failed (succeeded)', err as any);
            throw err;
          }
        }

        case 'payment_intent.payment_failed': {
          const intent = event.data.object as Stripe.PaymentIntent;
          const paymentIntentId = intent.id;

          const queryRunner = this.dataSource.createQueryRunner();
          await queryRunner.connect();
          await queryRunner.startTransaction();

          try {
            const payment = await queryRunner.manager.findOne(Payment, {
              where: { paymentIntentId },
              relations: ['order'],
            });

            if (!payment) {
              this.logger.error(
                `Stripe webhook: payment not found for failed intent ${paymentIntentId}`,
              );
              await queryRunner.rollbackTransaction();
              return { received: true };
            }

            // Idempotency
            if (payment.paymentStatus === PaymentStatus.FAILED) {
              await queryRunner.rollbackTransaction();
              return { received: true };
            }

            const lastError = intent.last_payment_error;

            payment.paymentStatus = PaymentStatus.FAILED;
            payment.failureReason = lastError?.message ?? 'Stripe payment failed';
            payment.processedAt = new Date();

            payment.order.paymentStatus = OrderPaymentStatus.FAILED;

            await queryRunner.manager.save(Payment, payment);
            await queryRunner.manager.save(Order, payment.order);
            await queryRunner.commitTransaction();
            await queryRunner.release();

            break;
          } catch (err) {
            if (queryRunner.isTransactionActive) {
              await queryRunner.rollbackTransaction();
            }
            await queryRunner.release();
            this.logger.error('Stripe webhook processing failed (failed)', err as any);
            throw err;
          }
        }

        default:
          // For other events we just acknowledge receipt
          this.logger.debug(`Stripe webhook: ignoring event type ${event.type}`);
      }

      return { received: true };
    } catch (err: any) {
      this.logger.warn('Stripe webhook signature verification failed', err.message);
      throw new BadRequestException('Webhook signature verification failed');
    }
  }

  async verifyPayment(paymentId: string, userId: string) {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId, userId },
      relations: ['order'],
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }
}
