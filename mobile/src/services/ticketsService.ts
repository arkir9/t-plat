import { api } from './api';

export interface TicketType {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  quantityAvailable: number;
  quantitySold: number;
  isActive: boolean;
}

export interface OrderItem {
  ticketTypeId: string;
  quantity: number;
}

export interface CreateOrderDto {
  eventId: string;
  items: OrderItem[];
  paymentMethod: 'mpesa' | 'card' | 'stripe';
  phoneNumber?: string;
}

export interface Ticket {
  id: string;
  userId: string;
  eventId: string;
  ticketTypeId: string;
  orderId: string;
  qrCode: string;
  qrCodeHash: string;
  status: 'active' | 'used' | 'cancelled' | 'refunded' | 'transferred';
  isTransferred: boolean;
  checkedInAt?: string;
  createdAt: string;
  event?: any;
  ticketType?: any;
}

export const ticketsService = {
  /**
   * Get ticket types for an event
   */
  async getTicketTypes(eventId: string): Promise<TicketType[]> {
    const response = await api.get(`/tickets/events/${eventId}/ticket-types`);
    return response.data;
  },

  /**
   * Create order (purchase tickets)
   */
  async purchaseTickets(orderData: CreateOrderDto) {
    const payload = {
      ...orderData,
      // Map friendly "card" option to backend "stripe" payment method
      paymentMethod:
        orderData.paymentMethod === 'card' ? 'stripe' : orderData.paymentMethod,
    };
    const response = await api.post('/tickets/orders', payload);
    return response.data;
  },

  /**
   * Get user's tickets
   */
  async getMyTickets(): Promise<Ticket[]> {
    const response = await api.get('/tickets/my-tickets');
    return response.data;
  },

  /**
   * Get ticket by ID with QR code
   */
  async getTicketById(ticketId: string): Promise<Ticket> {
    const response = await api.get(`/tickets/${ticketId}`);
    return response.data;
  },

  /**
   * Transfer ticket to another user
   */
  async transferTicket(ticketId: string, recipientEmail: string, message?: string) {
    const response = await api.post(`/tickets/${ticketId}/transfer`, {
      recipientEmail,
      message,
    });
    return response.data;
  },

  /**
   * Gift ticket to another user
   */
  async giftTicket(ticketId: string, recipientEmail: string, message?: string) {
    const response = await api.post(`/tickets/${ticketId}/gift`, {
      recipientEmail,
      message,
    });
    return response.data;
  },

  /**
   * Join waitlist for sold-out event
   */
  async joinWaitlist(eventId: string, ticketTypeId?: string, quantity: number = 1) {
    const response = await api.post('/tickets/waitlist', {
      eventId,
      ticketTypeId,
      quantity,
    });
    return response.data;
  },

  /**
   * Get current user's waitlist entries
   */
  async getMyWaitlist() {
    const response = await api.get('/tickets/waitlist');
    return response.data;
  },

  /**
   * Leave / cancel a waitlist entry
   */
  async cancelWaitlistEntry(waitlistId: string) {
    const response = await api.delete(`/tickets/waitlist/${waitlistId}`);
    return response.data;
  },

  /**
   * Request refund for a ticket
   */
  async requestRefund(ticketId: string, reason: string) {
    const response = await api.post(`/tickets/${ticketId}/refund-request`, {
      reason,
    });
    return response.data;
  },
};
