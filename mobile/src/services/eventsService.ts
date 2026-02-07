import { api } from './api';

export interface Event {
  id: string;
  title: string;
  description?: string;
  organizerId: string;
  venueId?: string;
  startDate: string;
  endDate: string;
  locationType: 'venue' | 'custom';
  customLocation?: {
    address: string;
    city: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  price?: number;
  currency?: string;
  image?: string;
  category?: string;
  eventType?: string;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  isFeatured?: boolean;
}

export interface EventQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  eventType?: string;
  startDate?: string;
  endDate?: string;
  minPrice?: number;
  maxPrice?: number;
  latitude?: number;
  longitude?: number;
  radius?: number;
}

/** Normalize API response: backend returns { data: T[], total, page, limit, totalPages } */
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
  /**
   * Get all events with filtering
   */
  async getEvents(params?: EventQueryParams) {
    const response = await api.get('/events', { params });
    return normalizeListResponse(response.data);
  },

  /**
   * Get personalized recommended events for the current user
   */
  async getRecommendedEvents(limit: number = 10) {
    const response = await api.get('/events/recommended/me', {
      params: { limit },
    });
    return normalizeListResponse(response.data);
  },

  /**
   * Get featured events
   */
  async getFeaturedEvents(params?: EventQueryParams) {
    const response = await api.get('/events/featured', { params });
    return normalizeListResponse(response.data);
  },

  /**
   * Get nearby events (for map view)
   */
  async getNearbyEvents(latitude: number, longitude: number, radius: number = 10) {
    const response = await api.get('/events/nearby', {
      params: { latitude, longitude, radius },
    });
    return normalizeListResponse(response.data);
  },

  /**
   * Get event by ID
   */
  async getEventById(eventId: string) {
    const response = await api.get(`/events/${eventId}`);
    return response.data;
  },

  /**
   * Track a view interaction for personalization
   */
  async trackView(eventId: string) {
    try {
      await api.post(`/events/${eventId}/track-view`);
    } catch {
      // non-critical, ignore
    }
  },

  /**
   * Get user's events (organizer)
   */
  async getMyEvents() {
    const response = await api.get('/events/my-events');
    return response.data;
  },

  /**
   * Create event (organizer)
   */
  async createEvent(eventData: Partial<Event>) {
    const response = await api.post('/events', eventData);
    return response.data;
  },

  /**
   * Update event (organizer)
   */
  async updateEvent(eventId: string, eventData: Partial<Event>) {
    const response = await api.patch(`/events/${eventId}`, eventData);
    return response.data;
  },

  /**
   * Delete event (organizer)
   */
  async deleteEvent(eventId: string) {
    const response = await api.delete(`/events/${eventId}`);
    return response.data;
  },

  /**
   * Publish event (organizer)
   */
  async publishEvent(eventId: string) {
    const response = await api.patch(`/events/${eventId}/publish`);
    return response.data;
  },

  /**
   * Cancel event (organizer)
   */
  async cancelEvent(eventId: string) {
    const response = await api.patch(`/events/${eventId}/cancel`);
    return response.data;
  },
};
