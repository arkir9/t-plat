import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  /** Set by backend when user has organizer profile (for claim event UI) */
  role?: 'user' | 'organizer' | 'admin';
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setOnboarded: (value: boolean) => void;
  checkAuth: () => void;
}

// Separate store to signal when auth persistence has finished rehydrating (avoids crash on device)
export const useHydrationStore = create<{ authHydrated: boolean }>(() => ({
  authHydrated: false,
}));

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isOnboarded: true,
      setAuth: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
      setOnboarded: (value) => set({ isOnboarded: value }),
      checkAuth: () => {
        // Persist middleware rehydrates state from AsyncStorage; no extra work needed on mount.
        // Optionally: validate token with API or wait for useHydrationStore.authHydrated.
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        // When this runs, rehydration from AsyncStorage is done (or failed); safe to read auth state
        useHydrationStore.setState({ authHydrated: true });
      },
    },
  ),
);
