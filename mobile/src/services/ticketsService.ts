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

  async checkIn(qrCode: string) {
    const response = await api.post('/tickets/check-in', { qrCode });
    return response.data;
  },

  async purchaseTickets(eventId: string, items: { ticketTypeId: string; quantity: number }[], paymentMethod: string, phoneNumber?: string) {
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
};