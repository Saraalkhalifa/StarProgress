/**
 * AuthContext — thin wrapper over the Zustand auth store.
 * In Supabase mode, also listens for session expiry via onAuthStateChange.
 */
import React, { createContext, useContext, useEffect } from 'react';
import type { User } from '../types';
import { useAuthStore } from '../store/useAuthStore';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  currentUser: User | null;
  login: (identifier: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => void;
  refreshCurrentUser: () => Promise<void>;
  isAdmin: boolean;
  isMainAdmin: boolean;
  isParticipant: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, login, logout, refreshCurrentUser } = useAuthStore();

  // In Supabase mode: clear the local user when the Supabase session expires
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const { data: { subscription } } = supabase!.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        useAuthStore.setState({ currentUser: null });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value: AuthContextType = {
    currentUser,
    login,
    logout,
    refreshCurrentUser,
    isAdmin: currentUser?.role === 'admin' || currentUser?.role === 'main_admin',
    isMainAdmin: currentUser?.role === 'main_admin',
    isParticipant: currentUser?.role === 'participant',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
