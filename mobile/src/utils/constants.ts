import { Platform } from 'react-native';

// Get API base URL based on environment and platform
const getApiBaseUrl = () => {
  if (!__DEV__) {
    return 'https://api.tplat.com/api';
  }

  // Allow override via environment variable
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Platform-specific localhost handling
  if (Platform.OS === 'android') {
    // Android emulator uses 10.0.2.2 to access host machine's localhost
    return 'http://10.0.2.2:3000/api';
  } else if (Platform.OS === 'ios') {
    // iOS simulator can use localhost
    return 'http://localhost:3000/api';
  } else {
    // Web or other platforms
    return 'http://localhost:3000/api';
  }
};

// API Configuration
export const API_BASE_URL = getApiBaseUrl();

// App Configuration
export const APP_NAME = 'T-Plat';
export const APP_DESCRIPTION = 'Nightlife & Event Ticketing Platform';

// Map Configuration
export const MAP_DEFAULT_REGION = {
  latitude: -1.2921, // Nairobi, Kenya
  longitude: 36.8219,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

export const MAP_CLUSTER_THRESHOLD = 15; // Number of markers before clustering

// Currency
export const DEFAULT_CURRENCY = 'KES';
export const SUPPORTED_CURRENCIES = ['KES', 'USD'] as const;

// Date Formats
export const DATE_FORMAT = 'MMMM dd, yyyy';
export const TIME_FORMAT = 'h:mm a';
export const DATETIME_FORMAT = 'MMMM dd, yyyy h:mm a';

// Colors (to be defined in theme)
export const COLORS = {
  primary: '#000000',
  secondary: '#666666',
  accent: '#FFD700',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  error: '#FF0000',
  success: '#00FF00',
  warning: '#FFA500',
};
