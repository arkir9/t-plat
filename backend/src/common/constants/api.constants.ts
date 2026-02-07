export const API_VERSION = 'v1';
export const API_PREFIX = 'api';

export const ROUTES = {
  AUTH: {
    BASE: 'auth',
    REGISTER: 'register',
    LOGIN: 'login',
    LOGOUT: 'logout',
    REFRESH: 'refresh',
    ME: 'me',
  },
  USERS: {
    BASE: 'users',
    PROFILE: 'profile',
    ORGANIZER_PROFILES: 'organizer-profiles',
  },
  EVENTS: {
    BASE: 'events',
    NEARBY: 'nearby',
    SEARCH: 'search',
    FAVORITES: 'favorites',
  },
  TICKETS: {
    BASE: 'tickets',
    TRANSFER: 'transfer',
    GIFT: 'gift',
    QR_CODE: 'qr-code',
    CHECK_IN: 'check-in',
  },
  PAYMENTS: {
    BASE: 'payments',
    MPESA: 'mpesa',
    STRIPE: 'stripe',
    WEBHOOK: 'webhook',
  },
  REVIEWS: {
    BASE: 'reviews',
  },
  SAFETY: {
    BASE: 'safety',
    EMERGENCY_CONTACTS: 'emergency-contacts',
    CHECK_IN: 'check-in',
    REPORTS: 'reports',
  },
} as const;
