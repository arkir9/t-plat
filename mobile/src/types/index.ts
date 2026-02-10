// mobile/src/types/index.ts

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
  role?: 'user' | 'organizer' | 'admin'; // Added role for permission checks
}

// Event Types
export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: EventLocation;
  // Backend EventResponseDto also exposes these for filtering/location:
  locationType?: 'venue' | 'custom';
  customLocation?: {
    address?: string;
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  venueId?: string;
  images: string[];
  ageRestriction?: string;
  dressCode?: string;
  // Simple pricing summary used on some lists (in addition to ticketTypes)
  price?: number;
  currency?: 'KES' | 'USD';
  ticketTypes: TicketType[];
  organizer: OrganizerProfile;
  venue?: VenueProfile;

  // --- NEW HYBRID FIELDS ---
  isClaimed: boolean;            // True if owned by a real organizer
  source: 'internal' | 'ticketmaster' | 'eventbrite' | 'predicthq';
  externalUrl?: string;          // Link to original source if unclaimed
  // ------------------------
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
  isVerified?: boolean; // Visual trust flag
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