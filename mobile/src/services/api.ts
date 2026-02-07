import axios, { AxiosInstance, AxiosError } from 'axios';
import { Platform } from 'react-native';
import { useAuthStore } from '../store/authStore';

// Get API base URL based on environment and platform (backend uses /api/v1 with versioning)
const getApiBaseUrl = () => {
  if (!__DEV__) {
    return 'https://api.tplat.com/api/v1';
  }

  // Allow override via environment variable
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Platform-specific localhost handling
  if (Platform.OS === 'android') {
    // Android emulator uses 10.0.2.2 to access host machine's localhost
    return 'http://10.0.2.2:3000/api/v1';
  } else if (Platform.OS === 'ios') {
    // iOS simulator can use localhost
    return 'http://localhost:3000/api/v1';
  } else {
    // Web or other platforms
    return 'http://localhost:3000/api/v1';
  }
};

const API_BASE_URL = getApiBaseUrl();

// Log the API URL in development for debugging
if (__DEV__) {
  console.log('API Base URL:', API_BASE_URL);
  console.log('Platform:', Platform.OS);
  if (API_BASE_URL.includes('localhost') && Platform.OS !== 'web') {
    console.log(
      'Tip: If you see "Network Error" (e.g. on a physical device or some simulators), set EXPO_PUBLIC_API_URL in .env to your machine IP, e.g. EXPO_PUBLIC_API_URL=http://192.168.1.x:3000/api/v1'
    );
  }
}

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Log requests in development
    if (__DEV__) {
      this.api.interceptors.request.use(
        (config) => {
          console.log('API Request:', config.method?.toUpperCase(), config.url);
          return config;
        },
        (error) => {
          console.error('API Request Error:', error);
          return Promise.reject(error);
        },
      );
    }

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const { accessToken } = useAuthStore.getState();
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // Response interceptor: unwrap backend { success, data } and handle token refresh
    this.api.interceptors.response.use(
      (response) => {
        if (__DEV__) {
          console.log('API Response:', response.status, response.config.url);
        }
        // Backend wraps all responses in { success: true, data: payload }
        if (response?.data && response.data.success === true && 'data' in response.data) {
          response.data = response.data.data;
        }
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as any;
        const is401 = error.response?.status === 401;

        if (__DEV__) {
          // 401 is expected when session expired; don't log as error to reduce noise
          if (!is401) {
            console.error('API Error:', {
              url: error.config?.url,
              method: error.config?.method,
              status: error.response?.status,
              message: error.message,
              code: error.code,
            });
          }
          // Helpful error message for connection issues
          if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
            console.error('Connection Error - App cannot reach the backend:');
            console.error('  1. Is the backend running? (e.g. npm run start:dev in backend/)');
            console.error('  2. On a physical device or some simulators, localhost does not work.');
            console.error('  3. Set EXPO_PUBLIC_API_URL in mobile/.env to your Mac IP:');
            console.error('     EXPO_PUBLIC_API_URL=http://YOUR_MAC_IP:3000/api/v1');
            console.error('  4. Find your Mac IP: System Settings > Network (or run: ipconfig getifaddr en0)');
          }
        }

        if (is401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const { refreshToken, logout } = useAuthStore.getState();
            if (refreshToken) {
              const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                refreshToken,
              });
              // Backend wraps in { success, data: { accessToken, refreshToken } }
              const payload = response.data?.data ?? response.data;
              const newAccessToken = payload?.accessToken;
              if (newAccessToken) {
                useAuthStore.setState({ accessToken: newAccessToken });
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return this.api(originalRequest);
              }
            }
          } catch (refreshError) {
            logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      },
    );
  }

  get instance() {
    return this.api;
  }
}

export const apiService = new ApiService();
export const api = apiService.instance;
