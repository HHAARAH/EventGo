import { create } from 'zustand';
import type { User } from '../types';
import { authApi } from '../api/client';

interface AuthState {
  user: User | null;
  token: string | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  clearError: () => void;
  init: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isInitialized: false,
  isLoading: false,
  error: null,

  init: () => {
    const token = localStorage.getItem('eventgo-token');
    const userStr = localStorage.getItem('eventgo-user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ token, user, isInitialized: true });
        return;
      } catch {
        localStorage.removeItem('eventgo-token');
        localStorage.removeItem('eventgo-user');
      }
    }
    set({ isInitialized: true });
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.login({ email, password });
      localStorage.setItem('eventgo-token', res.access_token);
      localStorage.setItem('eventgo-user', JSON.stringify(res.user));
      set({ token: res.access_token, user: res.user, isLoading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed, please check your email and password';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.register({ name, email, password });
      localStorage.setItem('eventgo-token', res.access_token);
      localStorage.setItem('eventgo-user', JSON.stringify(res.user));
      set({ token: res.access_token, user: res.user, isLoading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed, please try again';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('eventgo-token');
    localStorage.removeItem('eventgo-user');
    set({ user: null, token: null, error: null, isInitialized: true });
  },

  fetchMe: async () => {
    try {
      const user = await authApi.me();
      localStorage.setItem('eventgo-user', JSON.stringify(user));
      set({ user });
    } catch {
      useAuthStore.getState().logout();
    }
  },

  clearError: () => set({ error: null }),
}));
