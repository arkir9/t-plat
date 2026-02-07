import { api } from './api';

export interface EmergencyContact {
  id: string;
  userId: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  relationship?: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmergencyContactDto {
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  relationship?: string;
  isPrimary?: boolean;
}

export interface CheckInDto {
  eventId: string;
  ticketId?: string;
  latitude?: number;
  longitude?: number;
  shareWithContacts?: boolean;
}

export interface CreateSafetyReportDto {
  eventId: string;
  reportType: 'safety_concern' | 'incident' | 'venue_issue' | 'other';
  description: string;
}

export const safetyService = {
  /**
   * Get user's emergency contacts
   */
  async getEmergencyContacts(): Promise<EmergencyContact[]> {
    const response = await api.get('/safety/emergency-contacts');
    return response.data;
  },

  /**
   * Add emergency contact
   */
  async addEmergencyContact(contact: CreateEmergencyContactDto): Promise<EmergencyContact> {
    const response = await api.post('/safety/emergency-contacts', contact);
    return response.data;
  },

  /**
   * Update emergency contact
   */
  async updateEmergencyContact(
    contactId: string,
    contact: Partial<CreateEmergencyContactDto>,
  ): Promise<EmergencyContact> {
    const response = await api.put(`/safety/emergency-contacts/${contactId}`, contact);
    return response.data;
  },

  /**
   * Delete emergency contact
   */
  async deleteEmergencyContact(contactId: string): Promise<void> {
    await api.delete(`/safety/emergency-contacts/${contactId}`);
  },

  /**
   * Check in to event
   */
  async checkIn(checkInData: CheckInDto) {
    const response = await api.post('/safety/check-in', checkInData);
    return response.data;
  },

  /**
   * Check out from event
   */
  async checkOut(eventId: string) {
    const response = await api.post('/safety/check-out', { eventId });
    return response.data;
  },

  /**
   * Get check-in status for event
   */
  async getCheckInStatus(eventId: string) {
    const response = await api.get(`/safety/check-in/${eventId}`);
    return response.data;
  },

  /**
   * Create safety report
   */
  async reportSafetyIssue(report: CreateSafetyReportDto) {
    const response = await api.post('/safety/reports', report);
    return response.data;
  },

  /**
   * Get user's safety reports
   */
  async getMySafetyReports() {
    const response = await api.get('/safety/reports');
    return response.data;
  },
};
