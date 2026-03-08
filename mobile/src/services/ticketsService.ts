/**
 * ticketsService
 *
 * CHANGES FROM ORIGINAL:
 * 1. Added requestRefund() — POST /tickets/:id/refund-request
 * 2. Added checkInTicket() as alias for checkIn() so both names work.
 *    (CheckInScannerScreen uses ticketsService.checkInTicket())
 */

import { api } from './api';
import type { TicketType } from '../types';

export type { TicketType };

export const ticketsService = {
  async getTicketTypes(eventId: string) {
    const response = await api.get(`/tickets/events/${eventId}/ticket-types`);
    return response.data;
  },

  async createTicketType(eventId: string, data: Partial<TicketType>) {
    const response = await api.post(`/tickets/events/${eventId}/ticket-types`, data);
    return response.data;
  },

  async getMyTickets() {
    const response = await api.get('/tickets/my-tickets');
    return response.data;
  },

  async getTicketById(ticketId: string) {
    const response = await api.get(`/tickets/${ticketId}`);
    return response.data;
  },

  /**
   * Check in a ticket by QR code string. Used by CheckInScannerScreen.
   */
  async checkIn(qrCode: string) {
    const response = await api.post('/tickets/check-in', { qrCode });
    return response.data;
  },

  /**
   * Alias for checkIn() — CheckInScannerScreen calls this name.
   */
  async checkInTicket(qrCode: string) {
    return this.checkIn(qrCode);
  },

  async purchaseTickets(
    eventId: string,
    items: { ticketTypeId: string; quantity: number }[],
    paymentMethod: string,
    phoneNumber?: string,
  ) {
    const response = await api.post('/tickets/orders', {
      eventId,
      items,
      paymentMethod,
      phoneNumber,
    });
    return response.data;
  },

  async joinWaitlist(eventId: string, ticketTypeId?: string, quantity = 1) {
    const response = await api.post('/tickets/waitlist', { eventId, ticketTypeId, quantity });
    return response.data;
  },

  async getMyWaitlist() {
    const response = await api.get('/tickets/waitlist');
    return response.data;
  },

  async cancelWaitlistEntry(waitlistId: string) {
    const response = await api.delete(`/tickets/waitlist/${waitlistId}`);
    return response.data;
  },

  /**
   * Request a refund for a specific ticket.
   * Backend: POST /tickets/:id/refund-request
   * Body: { reason: string }
   *
   * Called from RefundRequestScreen.
   */
  async requestRefund(ticketId: string, reason: string) {
    const response = await api.post(`/tickets/${ticketId}/refund-request`, { reason });
    return response.data;
  },
};
