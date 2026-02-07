import { create } from 'zustand';
import { Event } from '../services/eventsService';

interface EventState {
  events: Event[];
  featuredEvents: Event[];
  favorites: string[];
  setEvents: (events: Event[]) => void;
  setFeaturedEvents: (events: Event[]) => void;
  addToFavorites: (eventId: string) => void;
  removeFromFavorites: (eventId: string) => void;
  isFavorite: (eventId: string) => boolean;
}

export const useEventStore = create<EventState>((set, get) => ({
  events: [],
  featuredEvents: [],
  favorites: [],
  setEvents: (events) => set({ events }),
  setFeaturedEvents: (featuredEvents) => set({ featuredEvents }),
  addToFavorites: (eventId) =>
    set((state) => ({
      favorites: [...state.favorites, eventId],
    })),
  removeFromFavorites: (eventId) =>
    set((state) => ({
      favorites: state.favorites.filter((id) => id !== eventId),
    })),
  isFavorite: (eventId) => get().favorites.includes(eventId),
}));
