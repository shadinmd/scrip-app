import { create } from 'zustand';
import api from './api';
import {
  getTokens,
  storeTokens as saveTokensToStorage,
  clearTokens as clearTokensFromStorage,
} from './auth';

interface User {
  id: number;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: number;
  name: string;
}

interface Transaction {
  id: number;
  amount: string;
  description: string;
  date: string;
  categoryId: number | null;
  category: Category | null;
  createdAt: string;
}

interface LoanInstallment {
  id: number;
  amount: string;
  date: string;
  isPaid: boolean;
  loanId: number;
}

interface Loan {
  id: number;
  name: string;
  installments: LoanInstallment[];
  userId: number;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  transactions: Transaction[];
  transactionPagination: {
    page: number;
    totalPages: number;
    hasNextPage: boolean;
  };
  loans: Loan[];
  categories: Category[];
  isLoading: boolean;
  isLoggedIn: boolean;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  setLoggedIn: (isLoggedIn: boolean) => void;
  fetchTransactions: (params?: { page?: number; limit?: number; start_date?: string; end_date?: string; categoryIds?: number[] }, append?: boolean) => Promise<void>;
  fetchLoans: (page?: number, limit?: number) => Promise<void>;
  fetchCategories: () => Promise<void>;
  login: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  transactions: [],
  transactionPagination: {
    page: 1,
    totalPages: 1,
    hasNextPage: false,
  },
  loans: [],
  categories: [],
  isLoading: true,
  isLoggedIn: false,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setLoggedIn: (isLoggedIn) => set({ isLoggedIn }),

  fetchTransactions: async (params = {}, append = false) => {
    try {
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
        }
      }));
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  },

  fetchCategories: async () => {
    try {
      const response = await api.get('/categories');
      set({ categories: response.data.data });
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  },

  fetchLoans: async (page = 1, limit = 10) => {
    try {
      const response = await api.get(`/loans?page=${page}&limit=${limit}`);
      set({ loans: response.data.data });
    } catch (error) {
      console.error('Error fetching loans:', error);
    }
  },

  login: async (accessToken, refreshToken) => {
    await saveTokensToStorage(accessToken, refreshToken);
    set({ isLoading: true });
    try {
      const response = await api.get('/users/me');
      set({ user: response.data, isLoggedIn: true, isLoading: false });
    } catch (error) {
      console.error('Error fetching user after login:', error);
      set({ isLoggedIn: true, isLoading: false }); // Still logged in if tokens were saved
    }
  },

  logout: async () => {
    await clearTokensFromStorage();
    set({ user: null, isLoggedIn: false });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const tokens = await getTokens();
      if (tokens?.accessToken) {
        const response = await api.get('/users/me');
        set({ user: response.data, isLoggedIn: true });
      } else {
        set({ isLoggedIn: false, user: null });
      }
    } catch (error) {
      console.error('Check auth error:', error);
      set({ isLoggedIn: false, user: null });
      await clearTokensFromStorage();
    } finally {
      set({ isLoading: false });
    }
  },
}));
