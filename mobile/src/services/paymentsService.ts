import { api } from './api';

export interface CreateStripePaymentDto {
  orderId: string;
}

export interface CreateMpesaPaymentDto {
  orderId: string;
  phoneNumber: string;
}

export interface PaymentResponse {
  paymentId: string;
  clientSecret?: string; // For Stripe
  paymentIntentId?: string;
  checkoutRequestID?: string; // For M-Pesa
  message?: string;
}

export const paymentsService = {
  /**
   * Create Stripe payment intent
   */
  async createStripePayment(orderId: string): Promise<PaymentResponse> {
    const response = await api.post('/payments/stripe/create-intent', {
      orderId,
    });
    return response.data;
  },

  /**
   * Create M-Pesa STK Push payment.
   * Backend returns checkoutRequestId — we use it as paymentId for polling.
   */
  async createMpesaPayment(
    orderId: string,
    phoneNumber: string,
  ): Promise<PaymentResponse> {
    const response = await api.post(`/payments/mpesa/initiate/${orderId}`, {
      phoneNumber,
    });
    const data = response.data;
    return {
      paymentId: data.checkoutRequestId ?? data.paymentId,
      checkoutRequestID: data.checkoutRequestId,
      merchantRequestId: data.merchantRequestId,
      message: data.message,
    };
  },

  /**
   * Verify payment status by checkoutRequestId (M-Pesa) or paymentId.
   */
  async verifyPayment(paymentId: string) {
    const response = await api.get(`/payments/verify/${paymentId}`);
    return response.data;
  },
};
