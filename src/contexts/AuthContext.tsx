/**
 * AuthContext — thin wrapper over the Zustand auth store.
 * All components that call useAuth() continue to work unchanged.
 * State lives in useAuthStore (zustand/middleware persist).
 */
import React, { createContext, useContext } from 'react';
import type { User } from '../types';
import { useAuthStore } from '../store/useAuthStore';

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
