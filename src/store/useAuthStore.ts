import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { storage } from '../lib/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
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
          if (isSupabaseConfigured) {
            // ── SUPABASE MODE ────────────────────────────────────────────────
            // 1. Look up profile by username or email to get the email for Auth
            const profileUser = await storage.findByIdentifier(identifier);
            if (!profileUser) {
              return { success: false, error: 'No account found. Check your username or email.' };
            }

            // 2. Authenticate with Supabase Auth
            const { error: authError } = await supabase!.auth.signInWithPassword({
              email: profileUser.email,
              password,
            });
            if (authError) {
              return { success: false, error: 'Incorrect password.' };
            }

            // 3. Check account status AFTER auth succeeds
            if (profileUser.accountStatus === 'pending') {
              await supabase!.auth.signOut();
              return { success: false, error: 'Your account is waiting for Main Admin approval.' };
            }
            if (profileUser.accountStatus === 'denied') {
              await supabase!.auth.signOut();
              return { success: false, error: 'Your account request was denied. Please contact the administrator.' };
            }
            if (profileUser.accountStatus === 'suspended') {
              await supabase!.auth.signOut();
              return { success: false, error: 'Your account has been suspended. Please contact an administrator.' };
            }

            set({ currentUser: profileUser });
            return { success: true, user: profileUser };

          } else {
            // ── DEMO (localStorage) MODE ─────────────────────────────────────
            const user = await storage.findByIdentifier(identifier);
            if (!user) {
              return { success: false, error: 'No account found. Check your username or email.' };
            }
            if (user.accountStatus === 'pending') {
              return { success: false, error: 'Your account is waiting for Main Admin approval.' };
            }
            if (user.accountStatus === 'denied') {
              return { success: false, error: 'Your account request was denied. Please contact the administrator.' };
            }
            if (user.accountStatus === 'suspended') {
              return { success: false, error: 'Your account has been suspended. Please contact an administrator.' };
            }
            if (user.passwordHash !== simpleHash(password)) {
              return { success: false, error: 'Incorrect password.' };
            }
            set({ currentUser: user });
            return { success: true, user };
          }
        } catch {
          return { success: false, error: 'Connection error. Please try again.' };
        }
      },

      logout: () => {
        if (isSupabaseConfigured) {
          supabase!.auth.signOut().catch(() => {});
        }
        set({ currentUser: null });
      },

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
