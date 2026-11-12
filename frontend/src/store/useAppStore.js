import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create(persist(
  (set) => ({
    user: null,
    isAuthenticated: false,
    theme: 'light',
    setUser: (user) => set({ user, isAuthenticated: !!user }),
    updateUser: (updates) => set((state) => ({ user: { ...state.user, ...updates } })),
    logout: () => {
      localStorage.removeItem('auth_token');
      set({ user: null, isAuthenticated: false });
    },
    toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  }),
  {
    name: 'ielts-store',
    partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated, theme: state.theme }),
    // Version 1 introduced the bright theme: everyone moves to it once and can still switch back with the toggle.
    version: 1,
    migrate: (state, version) => (version < 1 ? { ...state, theme: 'light' } : state),
  }
));
