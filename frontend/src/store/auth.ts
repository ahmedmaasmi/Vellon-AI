import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const DEBUG_AUTH = process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true';

interface User {
  id: string;
  email: string;
  role: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setTokens: (accessToken: string, refreshToken?: string | null) => void;
  setUser: (user: User) => void;
  setHasHydrated: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      hasHydrated: false,

      setTokens: (accessToken, refreshToken = null) =>
        set({ accessToken, refreshToken: refreshToken ?? null, isAuthenticated: true }),

      setUser: (user) => set({ user }),

      setHasHydrated: (value) => set({ hasHydrated: value }),

      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: (state) => {
        if (DEBUG_AUTH) console.log('[auth-debug] store: rehydrate-start', { isAuthenticated: state?.isAuthenticated ?? false });
        return (rehydratedState, err) => {
          if (err) {
            if (DEBUG_AUTH) console.log('[auth-debug] store: rehydrate-end (error)', err);
          } else {
            if (DEBUG_AUTH) console.log('[auth-debug] store: rehydrate-end (ok)', { isAuthenticated: !!rehydratedState?.isAuthenticated });
          }
          useAuthStore.getState().setHasHydrated(true);
        };
      },
    }
  )
);
