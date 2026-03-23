import { create } from 'zustand';
import api from './api';
import {
  getTokens,
  storeTokens as saveTokensToStorage,
  clearTokens as clearTokensFromStorage,
} from './auth';
import { User } from '../types/user';
import { Category } from '../types/category';
import { Transaction } from '../types/transaction';
import { Loan } from '../types/loan';

interface StoreState {
  user: User | null;
  transactions: Transaction[];
  recentTransactions: Transaction[];
  summary: {
    currentMonth: {
      expenses: number;
      count: number;
    };
    dailyActivity: { date: string; total: number }[];
  } | null;
  transactionPagination: {
    page: number;
    totalPages: number;
    hasNextPage: boolean;
  };
  loans: Loan[];
  categories: Category[];
  isLoading: boolean;
  isLoggedIn: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  setLoggedIn: (isLoggedIn: boolean) => void;
  setError: (error: string | null) => void;
  fetchTransactions: (
    params?: {
      page?: number;
      limit?: number;
      start_date?: string;
      end_date?: string;
      categoryIds?: number[];
    },
    append?: boolean
  ) => Promise<void>;
  fetchSummary: () => Promise<void>;
  fetchLoans: (page?: number, limit?: number) => Promise<void>;
  fetchCategories: () => Promise<void>;
  login: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  user: null,
  transactions: [],
  recentTransactions: [],
  summary: null,
  transactionPagination: {
    page: 1,
    totalPages: 1,
    hasNextPage: false,
  },
  loans: [],
  categories: [],
  isLoading: true,
  isLoggedIn: false,
  error: null,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setLoggedIn: (isLoggedIn) => set({ isLoggedIn }),
  setError: (error) => set({ error }),

  fetchTransactions: async (params = {}, append = false) => {
    try {
      set({ error: null });
      const { page = 1, limit = 20, start_date, end_date, categoryIds } = params;
      let url = `/transactions?page=${page}&limit=${limit}`;
      if (start_date) url += `&start_date=${start_date}`;
      if (end_date) url += `&end_date=${end_date}`;
      if (categoryIds && categoryIds.length > 0) {
        url += `&categoryIds=${categoryIds.join(',')}`;
      }

      const response = await api.get(url);
      const { data, metadata } = response.data;

      set((state) => ({
        transactions: append ? [...state.transactions, ...data] : data,
        transactionPagination: {
          page: metadata.page,
          totalPages: metadata.totalPages,
          hasNextPage: metadata.hasNextPage,
        },
      }));
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      set({ error: error.response?.data?.message || 'Failed to fetch transactions' });
    }
  },

  fetchSummary: async () => {
    try {
      set({ error: null });
      const response = await api.get('/transactions/summary');
      const { currentMonth, dailyActivity, recentTransactions } = response.data;
      set({
        summary: { currentMonth, dailyActivity },
        recentTransactions: recentTransactions,
      });
    } catch (error: any) {
      console.error('Error fetching summary:', error);
      set({ error: error.response?.data?.message || 'Failed to fetch summary' });
    }
  },

  fetchCategories: async () => {
    try {
      set({ error: null });
      const response = await api.get('/categories');
      set({ categories: response.data.data });
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      set({ error: error.response?.data?.message || 'Failed to fetch categories' });
    }
  },

  fetchLoans: async (page = 1, limit = 10) => {
    try {
      set({ error: null });
      const response = await api.get(`/loans?page=${page}&limit=${limit}`);
      set({ loans: response.data.data });
    } catch (error: any) {
      console.error('Error fetching loans:', error);
      set({ error: error.response?.data?.message || 'Failed to fetch loans' });
    }
  },

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
