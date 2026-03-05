import { api } from './api';

export type OrganizerProfileType = 'event_organizer' | 'venue_organizer';

export interface OrganizerProfile {
  id: string;
  userId: string;
  profileType: OrganizerProfileType;
  name: string;
  bio?: string;
  logoUrl?: string;
  website?: string;
  socialLinks?: Record<string, string>;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  venueAddress?: string;
  venueCity?: string;
  venueCapacity?: number;
  venueAmenities?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizerProfileDto {
  profileType: OrganizerProfileType;
  name: string;
  bio?: string;
  website?: string;
}

export type ApplicationStatus = 'pending_email' | 'pending_admin' | 'approved' | 'rejected';

export interface OrganizerApplication {
  id: string;
  businessName: string;
  email: string;
  phone: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; email: string; firstName?: string; lastName?: string };
}

export interface OrganizerAnalytics {
  totalTicketsSold: number;
  currentBalance: number;
  projectedIncome: number;
  pastIncome: number;
  currency: string;
  activeEvents: Array<{
    id: string;
    title: string;
    startDate: string;
    status: string;
    ticketsSold: number;
    revenue: number;
    bannerImageUrl: string | null;
  }>;
}

export const organizersService = {
  // ─── Profile ─────────────────────────────────────────────────────────
  async getMyProfiles(): Promise<OrganizerProfile[]> {
    const res = await api.get('/organizers/me');
    return res.data ?? [];
  },

  async createProfile(dto: CreateOrganizerProfileDto): Promise<OrganizerProfile> {
    const res = await api.post('/organizers/profile', dto);
    return res.data;
  },

  async verifyMyPending(): Promise<{ updated: number }> {
    const res = await api.post('/organizers/me/verify-pending');
    return res.data ?? { updated: 0 };
  },

  // ─── Analytics ──────────────────────────────────────────────────────────
  async getAnalytics(): Promise<OrganizerAnalytics> {
    const res = await api.get('/organizers/me/analytics');
    return res.data;
  },

  // ─── Application Flow ────────────────────────────────────────────────
  async apply(dto: { businessName: string; email: string; phone: string }): Promise<{ message: string }> {
    const res = await api.post('/organizers/apply', dto);
    return res.data;
  },

  async verifyEmail(emailOtp: string): Promise<{ message: string }> {
    const res = await api.post('/organizers/verify-email', { emailOtp });
    return res.data;
  },

  async getMyApplication(): Promise<{ application: OrganizerApplication | null; message?: string }> {
    const res = await api.get('/organizers/my-application');
    return res.data;
  },

  // ─── Admin ───────────────────────────────────────────────────────────
  async getAdminApplications(): Promise<OrganizerApplication[]> {
    const res = await api.get('/admin/applications');
    return res.data ?? [];
  },

  async approveApplication(id: string): Promise<{ message: string }> {
    const res = await api.post(`/admin/applications/${id}/approve`);
    return res.data;
  },

  async rejectApplication(id: string): Promise<{ message: string }> {
    const res = await api.post(`/admin/applications/${id}/reject`);
    return res.data;
  },
};
