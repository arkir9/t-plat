import { api } from './api';
import { useAuthStore } from '../store/authStore';

// Backend wraps responses as { success, data } via TransformInterceptor
function getPayload<T>(response: { data: T | { success?: boolean; data?: T } }): T {
  const body = response.data as { success?: boolean; data?: T };
  if (body && typeof body.data !== 'undefined') return body.data as T;
  return response.data as T;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
}

export const authService = {
  async login(credentials: LoginCredentials) {
    const response = await api.post('/auth/login', credentials);
    const payload = getPayload<{ user: any; accessToken: string; refreshToken: string }>(response);
    const { user, accessToken, refreshToken } = payload;

    useAuthStore.getState().setAuth(user, accessToken, refreshToken);
    return { user, accessToken, refreshToken };
  },

  async register(data: RegisterData) {
    const response = await api.post('/auth/register', data);
    const payload = getPayload<{ user: any; accessToken: string; refreshToken: string }>(response);
    const { user, accessToken, refreshToken } = payload;

    useAuthStore.getState().setAuth(user, accessToken, refreshToken);
    return { user, accessToken, refreshToken };
  },

  async logout() {
    useAuthStore.getState().logout();
  },

  async getProfile() {
    const response = await api.get('/auth/me');
    return getPayload(response);
  },

  async refreshToken(refreshToken: string) {
    const response = await api.post('/auth/refresh', { refreshToken });
    return getPayload(response);
  },

  async loginWithGoogle(idToken: string) {
    const response = await api.post('/auth/google', { idToken });
    const payload = getPayload<{ user: any; accessToken: string; refreshToken: string }>(response);
    const { user, accessToken, refreshToken } = payload;
    useAuthStore.getState().setAuth(user, accessToken, refreshToken);
    return { user, accessToken, refreshToken };
  },

  async loginWithApple(identityToken: string, fullName?: string) {
    const response = await api.post('/auth/apple', { identityToken, fullName });
    const payload = getPayload<{ user: any; accessToken: string; refreshToken: string }>(response);
    const { user, accessToken, refreshToken } = payload;
    useAuthStore.getState().setAuth(user, accessToken, refreshToken);
    return { user, accessToken, refreshToken };
  },
};
