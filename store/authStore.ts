import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:      null,
      token:     null,
      isLoading: true,

      setUser:  (user)  => set({ user }),
      setToken: (token) => set({ token }),

      // Set both user and token at once (used after login/register)
      // Also derives `role` from `roles[0]` for backward compatibility
      setAuth: (user, token) => {
        const normalized = {
          ...user,
          role: user.role ?? (Array.isArray(user.roles) && user.roles.length > 0 ? user.roles[0] : 'user'),
        };
        set({ user: normalized, token });
      },

      // Clear auth state (used on logout)
      logout: () => set({ user: null, token: null }),

      hydrate: () => set({ isLoading: false }),
    }),
    {
      name: 'exo-ticket-auth',
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrate();
      },
    }
  )
);
