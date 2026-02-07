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

export const organizersService = {
  async getMyProfiles(): Promise<OrganizerProfile[]> {
    const res = await api.get('/organizers/me');
    return res.data ?? [];
  },

  async createProfile(dto: CreateOrganizerProfileDto): Promise<OrganizerProfile> {
    const res = await api.post('/organizers/profile', dto);
    return res.data;
  },

  /** Verify all my pending Plat Pro profiles (dev/convenience). */
  async verifyMyPending(): Promise<{ updated: number }> {
    const res = await api.post('/organizers/me/verify-pending');
    return res.data ?? { updated: 0 };
  },
};

