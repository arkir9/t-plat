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
   * Create M-Pesa STK Push payment
   */
  async createMpesaPayment(
    orderId: string,
    phoneNumber: string,
  ): Promise<PaymentResponse> {
    const response = await api.post('/payments/mpesa/stk-push', {
      orderId,
      phoneNumber,
    });
    return response.data;
  },

  /**
   * Verify payment status
   */
  async verifyPayment(paymentId: string) {
    const response = await api.get(`/payments/${paymentId}/verify`);
    return response.data;
  },
};
