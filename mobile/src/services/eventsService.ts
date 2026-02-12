import { api } from './api';
import type { Event } from '../types';

export type { Event };

export interface EventQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  eventType?: string; // Important for new filters
  startDate?: string;
  endDate?: string;
  minPrice?: number;
  maxPrice?: number;
  latitude?: number;
  longitude?: number;
  radius?: number;
}

function normalizeListResponse<T>(res: any): { data: T[]; total: number; page: number; limit: number } {
  if (Array.isArray(res)) return { data: res, total: res.length, page: 1, limit: res.length };
  const data = res?.data ?? res?.items ?? [];
  return {
    data: Array.isArray(data) ? data : [],
    total: res?.total ?? data?.length ?? 0,
    page: res?.page ?? 1,
    limit: res?.limit ?? data?.length ?? 10,
  };
}

export const eventsService = {
  async getEvents(params?: EventQueryParams) {
    const response = await api.get('/events', { params });
    return normalizeListResponse<Event>(response.data);
  },

  async getRecommendedEvents(limit: number = 10) {
    const response = await api.get('/events/recommended/me', { params: { limit } });
    return normalizeListResponse<Event>(response.data);
  },

  async getFeaturedEvents(params?: EventQueryParams) {
    const response = await api.get('/events/featured', { params });
    return normalizeListResponse<Event>(response.data);
  },

  async getNearbyEvents(latitude: number, longitude: number, radius: number = 25) {
    // Increased radius default to 25km to cover cities better
    const response = await api.get('/events/nearby', {
      params: { latitude, longitude, radius },
    });
    return normalizeListResponse<Event>(response.data);
  },

  async getEventById(eventId: string) {
    const response = await api.get(`/events/${eventId}`);
    return response.data;
  },

  async claimEvent(eventId: string) {
    const response = await api.post(`/events/${eventId}/claim`);
    return response.data;
  },

  async trackView(eventId: string) {
    try { await api.post(`/events/${eventId}/track-view`); } catch {}
  },

  async getMyEvents() {
    const response = await api.get('/events/my-events');
    return response.data;
  },

  async createEvent(eventData: Partial<Event>) {
    const response = await api.post('/events', eventData);
    return response.data;
  },

  async updateEvent(eventId: string, eventData: Partial<Event>) {
    const response = await api.patch(`/events/${eventId}`, eventData);
    return response.data;
  },

  async deleteEvent(eventId: string) {
    const response = await api.delete(`/events/${eventId}`);
    return response.data;
  },

  async publishEvent(eventId: string) {
    const response = await api.patch(`/events/${eventId}/publish`);
    return response.data;
  },

  async cancelEvent(eventId: string) {
    const response = await api.patch(`/events/${eventId}/cancel`);
    return response.data;
  },
};