// User Types
export interface User {
  id: string;
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
}

// Event Types
export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: EventLocation;
  images: string[];
  ageRestriction?: string;
  dressCode?: string;
  ticketTypes: TicketType[];
  organizer: OrganizerProfile;
  venue?: VenueProfile;
}

export interface EventLocation {
  type: 'venue' | 'custom';
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

// Organizer Types
export interface OrganizerProfile {
  id: string;
  name: string;
  bio?: string;
  logoUrl?: string;
  profileType: 'event_organizer' | 'venue_organizer';
}

export interface VenueProfile extends OrganizerProfile {
  address?: string;
  city?: string;
  capacity?: number;
  amenities?: string[];
}

// Ticket Types
export interface TicketType {
  id: string;
  name: string;
  price: number;
  currency: 'KES' | 'USD';
  quantityAvailable: number;
  quantitySold: number;
}

export interface Ticket {
  id: string;
  eventId: string;
  ticketTypeId: string;
  qrCode: string;
  status: 'active' | 'used' | 'cancelled' | 'refunded';
  checkedInAt?: string;
}

// Order Types
export interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  currency: 'KES' | 'USD';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  tickets: Ticket[];
  createdAt: string;
}

// Review Types
export interface Review {
  id: string;
  eventId: string;
  userId: string;
  rating: number;
  reviewText?: string;
  venueRating?: number;
  organizerRating?: number;
  createdAt: string;
}
