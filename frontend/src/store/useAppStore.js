import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create(persist(
  (set) => ({
    user: null,
    isAuthenticated: false,
    theme: 'dark',
    setUser: (user) => set({ user, isAuthenticated: !!user }),
    updateUser: (updates) => set((state) => ({ user: { ...state.user, ...updates } })),
    logout: () => {
      localStorage.removeItem('auth_token');
      set({ user: null, isAuthenticated: false });
    },
    toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  }),
  { name: 'ielts-store', partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated, theme: state.theme }) }
));
