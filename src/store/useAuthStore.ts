import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { storage } from '../lib/storage';
import { simpleHash } from '../lib/utils';

interface AuthState {
  currentUser: User | null;
  login: (identifier: string, password: string) => { success: boolean; user?: User; error?: string };
  logout: () => void;
  refreshCurrentUser: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,

      login: (identifier, password) => {
        if (!identifier || !password) {
          return { success: false, error: 'Please enter your credentials.' };
        }
        const users = storage.getUsers();
        const lower = identifier.toLowerCase();
        const user = users.find(
          u =>
            u.email.toLowerCase() === lower ||
            (u.username && u.username.toLowerCase() === lower)
        );
        if (!user) {
          return { success: false, error: 'No account found. Check your username or email.' };
        }
        // Account status gate
        if (user.accountStatus === 'pending') {
          return {
            success: false,
            error: 'Your account is pending approval. Please wait for admin review.',
          };
        }
        if (user.accountStatus === 'denied') {
          return {
            success: false,
            error: 'Your account request was denied. Please contact the administrator.',
          };
        }
        if (user.passwordHash !== simpleHash(password)) {
          return { success: false, error: 'Incorrect password.' };
        }
        set({ currentUser: user });
        return { success: true, user };
      },

      logout: () => set({ currentUser: null }),

      // Call after admin updates a user's data so the session reflects changes
      refreshCurrentUser: () => {
        const current = get().currentUser;
        if (!current) return;
        const fresh = storage.getUsers().find(u => u.id === current.id);
        if (fresh) set({ currentUser: fresh });
      },
    }),
    {
      name: 'sp_auth_v1',
      // Only persist the user object, not the functions
      partialize: state => ({ currentUser: state.currentUser }),
    }
  )
);
