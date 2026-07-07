import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { setDir } from './lib/i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { StreakProvider } from './contexts/StreakContext';
import { AvatarProvider } from './contexts/AvatarContext';
import { storage } from './lib/storage';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { sampleActivities, sampleBadges, sampleUsers } from './lib/sampleData';
import { simpleHash, AVATAR_COLORS } from './lib/utils';
import type { User } from './types';
import { ParticipantLayout } from './components/layout/ParticipantLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { Home } from './pages/Home';
import { ParticipantLogin } from './pages/ParticipantLogin';
import { AdminLogin } from './pages/AdminLogin';
import { ParticipantSignup } from './pages/ParticipantSignup';
import { ParticipantDashboard } from './pages/participant/Dashboard';
import { SubmitActivity } from './pages/participant/SubmitActivity';
import { MyProgress } from './pages/participant/MyProgress';
import { Leaderboard } from './pages/participant/Leaderboard';
import { Achievements } from './pages/participant/Achievements';
import { AdminDashboard } from './pages/admin/Dashboard';
import { ParticipantsManagement } from './pages/admin/Participants';
import { ActivitiesManagement } from './pages/admin/Activities';
import { ProgressRecords } from './pages/admin/ProgressRecords';
import { ApprovalCenter } from './pages/admin/ApprovalCenter';
import { AdminManagement } from './pages/admin/AdminManagement';
import { BadgeSettings } from './pages/admin/BadgeSettings';
import { AccountRequests } from './pages/admin/AccountRequests';
import { AdminSignup } from './pages/AdminSignup';
import { Settings } from './pages/Settings';
import { AuthCallback } from './pages/AuthCallback';
import { AvatarPage } from './pages/participant/AvatarPage';
import { AvatarShop } from './pages/participant/AvatarShop';
import { StreakSettings } from './pages/admin/StreakSettings';

const queryClient = new QueryClient();

// ── Startup helpers ────────────────────────────────────────────────────────

function patchAuthSession(oldUsername: string, newUsername: string, newName: string) {
  try {
    const raw = localStorage.getItem('sp_auth_v2');
    if (!raw) return;
    const parsed = JSON.parse(raw) as { state?: { currentUser?: { username?: string; name?: string } } };
    if (parsed?.state?.currentUser?.username === oldUsername) {
      parsed.state.currentUser.username = newUsername;
      parsed.state.currentUser.name = newName;
      localStorage.setItem('sp_auth_v2', JSON.stringify(parsed));
    }
  } catch { /* ignore */ }
}

async function repairDemoMainAdmin() {
  const allUsers = await storage.getUsers();
  const expectedHash = simpleHash('MainAdmin@2026');

  // Find by role, or fall back to the well-known seed ID 'u_main'
  const mainAdmin: User | undefined =
    allUsers.find(u => u.role === 'main_admin') ??
    allUsers.find(u => u.id === 'u_main');

  if (!mainAdmin) {
    // No main admin at all — create from scratch without touching other accounts
    await storage.addUser({
      id: 'u_main',
      name: 'Sara',
      email: 'admin@starprogress.demo',
      username: 'Mainadmin',
      passwordHash: expectedHash,
      role: 'main_admin',
      accountStatus: 'active',
      createdAt: new Date().toISOString(),
      avatarColor: AVATAR_COLORS[0],
    });
    return;
  }

  // Fix any incorrect fields (username, name, role, status, password hash)
  const fixes: Partial<User> = {};
  if (mainAdmin.username      !== 'Mainadmin')     fixes.username      = 'Mainadmin';
  if (mainAdmin.name          !== 'Sara')          fixes.name          = 'Sara';
  if (mainAdmin.role          !== 'main_admin')    fixes.role          = 'main_admin';
  if (mainAdmin.accountStatus !== 'active')        fixes.accountStatus = 'active';
  if (mainAdmin.passwordHash  !== expectedHash)    fixes.passwordHash  = expectedHash;

  if (Object.keys(fixes).length > 0) {
    await storage.updateUser(mainAdmin.id, fixes);
    if (fixes.username) patchAuthSession(mainAdmin.username ?? '', 'Mainadmin', 'Sara');
  }
}

async function seedIfEmpty() {
  if (isSupabaseConfigured) {
    // In Supabase mode, call the bootstrap RPC (SECURITY DEFINER — safe to call as anon).
    // No-op when a main_admin already exists; returns 'exists' otherwise.
    try { await supabase!.rpc('bootstrap_main_admin'); } catch { /* not installed yet */ }
    return;
  }

  // Demo mode: seed everything into localStorage if completely empty
  if (await storage.isEmpty()) {
    await Promise.all([
      storage.setUsers(sampleUsers),
      storage.setActivities(sampleActivities),
      storage.setBadges(sampleBadges),
    ]);
    return;
  }

  // Demo mode: data exists — repair the Main Admin account.
  // Handles: wrong role/status, missing account, migrating old usernames.
  await repairDemoMainAdmin();
}

// ── Guards ──────────────────────────────────────────────
function ParticipantRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, isParticipant } = useAuth();
  if (!currentUser) return <Navigate to="/login/participant" replace />;
  if (!isParticipant) return <Navigate to="/admin" replace />;
  return <ParticipantLayout>{children}</ParticipantLayout>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, isAdmin } = useAuth();
  if (!currentUser) return <Navigate to="/login/admin" replace />;
  if (!isAdmin) return <Navigate to="/participant" replace />;
  return <AdminLayout>{children}</AdminLayout>;
}

function MainAdminRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, isMainAdmin } = useAuth();
  if (!currentUser) return <Navigate to="/login/admin" replace />;
  if (!isMainAdmin) return <Navigate to="/admin" replace />;
  return <AdminLayout>{children}</AdminLayout>;
}

// Home redirects already-logged-in users straight to their dashboard
function HomeRoute() {
  const { currentUser, isParticipant, isAdmin } = useAuth();
  if (currentUser && isParticipant) return <Navigate to="/participant" replace />;
  if (currentUser && isAdmin) return <Navigate to="/admin" replace />;
  return <Home />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Entry */}
      <Route path="/" element={<HomeRoute />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/login/participant" element={<ParticipantLogin />} />
      <Route path="/login/admin" element={<AdminLogin />} />
      <Route path="/signup" element={<ParticipantSignup />} />
      <Route path="/signup/admin" element={<AdminSignup />} />

      {/* Participant */}
      <Route path="/participant" element={<ParticipantRoute><ParticipantDashboard /></ParticipantRoute>} />
      <Route path="/participant/submit" element={<ParticipantRoute><SubmitActivity /></ParticipantRoute>} />
      <Route path="/participant/history" element={<ParticipantRoute><MyProgress /></ParticipantRoute>} />
      <Route path="/participant/leaderboard" element={<ParticipantRoute><Leaderboard /></ParticipantRoute>} />
      <Route path="/participant/achievements" element={<ParticipantRoute><Achievements /></ParticipantRoute>} />
      <Route path="/participant/avatar" element={<ParticipantRoute><AvatarPage /></ParticipantRoute>} />
      <Route path="/participant/shop" element={<ParticipantRoute><AvatarShop /></ParticipantRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/participants" element={<AdminRoute><ParticipantsManagement /></AdminRoute>} />
      <Route path="/admin/activities" element={<AdminRoute><ActivitiesManagement /></AdminRoute>} />
      <Route path="/admin/progress" element={<AdminRoute><ProgressRecords /></AdminRoute>} />
      <Route path="/admin/approvals" element={<AdminRoute><ApprovalCenter /></AdminRoute>} />
      <Route path="/admin/admins" element={<MainAdminRoute><AdminManagement /></MainAdminRoute>} />
      <Route path="/admin/badges" element={<AdminRoute><BadgeSettings /></AdminRoute>} />
      <Route path="/admin/account-requests" element={<AdminRoute><AccountRequests /></AdminRoute>} />
      <Route path="/admin/streak" element={<AdminRoute><StreakSettings /></AdminRoute>} />

      {/* Settings */}
      <Route path="/admin/settings" element={<AdminRoute><Settings /></AdminRoute>} />
      <Route path="/participant/settings" element={<ParticipantRoute><Settings /></ParticipantRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AppWithI18n() {
  const { i18n, t } = useTranslation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDir(i18n.language);
  }, [i18n.language]);

  useEffect(() => {
    seedIfEmpty().finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="font-medium">{t('common.connecting')}</p>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <AuthProvider>
        <DataProvider>
          <StreakProvider>
            <AvatarProvider>
              <AppRoutes />
              <Toaster richColors position="top-right" />
            </AvatarProvider>
          </StreakProvider>
        </DataProvider>
      </AuthProvider>
    </HashRouter>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppWithI18n />
    </QueryClientProvider>
  );
}
