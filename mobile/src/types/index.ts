export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: 'user' | 'organizer' | 'admin';
  avatar?: string;
}

export interface CustomLocation {
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface VenueProfile {
  id: string;
  name: string;
  venueCity?: string;
  venueAddress?: string;
  venueLatitude?: number;
  venueLongitude?: number;
}

export interface TicketType {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  totalQuantity: number;
  availableQuantity: number;
  saleStartDate?: string;
  saleEndDate?: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  images?: string[];
  
  // --- Hybrid Strategy Fields ---
  source: 'internal' | 'scraped' | 'predicthq' | 'ticketmaster' | 'hustlesasa';
  isClaimed: boolean;
  externalUrl?: string;
  
  // --- Location ---
  locationType: 'venue' | 'custom';
  venue?: VenueProfile;
  customLocation?: CustomLocation;
  location?: any; 

  // --- Strict Categorization ---
  eventType: 'concert' | 'festival' | 'nightlife' | 'arts_culture' | 'sports' | 'business' | 'community' | 'other';
  category?: string;

  // --- Pricing ---
  price?: number; 
  currency?: string;
  ticketTypes?: TicketType[]; 

  // --- Meta ---
  organizer?: {
    id: string;
    name: string;
    avatar?: string;
  };
  status: 'draft' | 'published' | 'cancelled';
  isFeatured?: boolean;
}