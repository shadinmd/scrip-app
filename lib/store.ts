import { create } from 'zustand';
import api from './api';
import {
  getTokens,
  storeTokens as saveTokensToStorage,
  clearTokens as clearTokensFromStorage,
} from './auth';
import { User } from '../types/user';

interface StoreState {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  setLoggedIn: (isLoggedIn: boolean) => void;
  setError: (error: string | null) => void;
  login: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useStore = create<StoreState>((set) => ({
  user: null,
  isLoading: true,
  isLoggedIn: false,
  error: null,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setLoggedIn: (isLoggedIn) => set({ isLoggedIn }),
  setError: (error) => set({ error }),

  login: async (accessToken, refreshToken) => {
    await saveTokensToStorage(accessToken, refreshToken);
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/users/me');
      set({ user: response.data, isLoggedIn: true, isLoading: false });
    } catch (error: any) {
      console.error('Error fetching user after login:', error);
      set({
        isLoggedIn: true,
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch user data after login',
      });
    }
  },

  logout: async () => {
    await clearTokensFromStorage();
    set({ user: null, isLoggedIn: false, error: null });
  },

  checkAuth: async () => {
    set({ isLoading: true, error: null });
    try {
      const tokens = await getTokens();
      if (tokens?.accessToken) {
        const response = await api.get('/users/me');
        set({ user: response.data, isLoggedIn: true });
      } else {
        set({ isLoggedIn: false, user: null });
      }
    } catch (error: any) {
      console.error('Check auth error:', error);
      set({
        isLoggedIn: false,
        user: null,
        error:
          error.response?.status !== 401
            ? error.response?.data?.message || 'Authentication check failed'
            : null,
      });
      await clearTokensFromStorage();
    } finally {
      set({ isLoading: false });
    }
  },
}));
