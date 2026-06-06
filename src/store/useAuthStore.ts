import { create } from 'zustand';
import { api } from '../utils/api';
import { User, LoginResponse } from '../../shared/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: true,

  login: async (email: string, password: string) => {
    try {
      const response = await api.auth.login(email, password);
      if (response.success && response.data) {
        const { token, user } = response.data as LoginResponse;
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
        return { success: true };
      }
      return { success: false, error: response.error || '登录失败' };
    } catch (error) {
      return { success: false, error: '网络错误，请稍后重试' };
    }
  },

  register: async (email: string, password: string, name: string) => {
    try {
      const response = await api.auth.register(email, password, name);
      if (response.success && response.data) {
        const { token, user } = response.data as LoginResponse;
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
        return { success: true };
      }
      return { success: false, error: response.error || '注册失败' };
    } catch (error) {
      return { success: false, error: '网络错误，请稍后重试' };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadUser: async () => {
    try {
      const response = await api.auth.me();
      if (response.success && response.data) {
        set({ user: (response.data as { user: User }).user, isLoading: false });
      } else {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
