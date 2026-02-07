import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';
import { eventsService } from './eventsService';
import { useAuthStore } from '../store/authStore';
import { Event } from './eventsService';

const FAVORITES_KEY = '@tplat_favorites';

export const favoritesService = {
  async add(eventId: string): Promise<void> {
    if (useAuthStore.getState().isAuthenticated) {
      await api.post(`/favorites/${eventId}`);
      return;
    }
    const raw = await AsyncStorage.getItem(FAVORITES_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    if (!ids.includes(eventId)) {
      ids.push(eventId);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
    }
  },

  async remove(eventId: string): Promise<void> {
    if (useAuthStore.getState().isAuthenticated) {
      await api.delete(`/favorites/${eventId}`);
      return;
    }
    const raw = await AsyncStorage.getItem(FAVORITES_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    const next = ids.filter((id) => id !== eventId);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  },

  async list(): Promise<Event[]> {
    if (useAuthStore.getState().isAuthenticated) {
      const res = await api.get('/favorites');
      const data = res?.data;
      return Array.isArray(data) ? data : [];
    }
    const raw = await AsyncStorage.getItem(FAVORITES_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    const events: Event[] = [];
    for (const id of ids) {
      try {
        const event = await eventsService.getEventById(id);
        if (event) events.push(event);
      } catch (_) {}
    }
    return events;
  },

  async isFavorite(eventId: string): Promise<boolean> {
    if (useAuthStore.getState().isAuthenticated) {
      try {
        const res = await api.get(`/favorites/check/${eventId}`);
        return res?.data?.isFavorite === true;
      } catch (_) {
        return false;
      }
    }
    const raw = await AsyncStorage.getItem(FAVORITES_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    return ids.includes(eventId);
  },
};
