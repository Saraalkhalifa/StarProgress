import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { storage } from '../lib/storage';
import { simpleHash } from '../lib/utils';

interface AuthState {
  currentUser: User | null;
  login: (identifier: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => void;
  refreshCurrentUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,

      login: async (identifier, password) => {
        if (!identifier || !password) {
          return { success: false, error: 'Please enter your credentials.' };
        }
        try {
          const user = await storage.findByIdentifier(identifier);
          if (!user) {
            return { success: false, error: 'No account found. Check your username or email.' };
          }
          if (user.accountStatus === 'pending') {
            return { success: false, error: 'Your account is pending approval. Please wait for admin review.' };
          }
          if (user.accountStatus === 'denied') {
            return { success: false, error: 'Your account request was denied. Please contact the administrator.' };
          }
          if (user.passwordHash !== simpleHash(password)) {
            return { success: false, error: 'Incorrect password.' };
          }
          set({ currentUser: user });
          return { success: true, user };
        } catch {
          return { success: false, error: 'Connection error. Please try again.' };
        }
      },

      logout: () => set({ currentUser: null }),

      refreshCurrentUser: async () => {
        const current = get().currentUser;
        if (!current) return;
        try {
          const users = await storage.getUsers();
          const fresh = users.find(u => u.id === current.id);
          if (fresh) set({ currentUser: fresh });
        } catch {
          // silently fail — stale session stays until next login
        }
      },
    }),
    {
      name: 'sp_auth_v2',
      partialize: state => ({ currentUser: state.currentUser }),
    }
  )
);
