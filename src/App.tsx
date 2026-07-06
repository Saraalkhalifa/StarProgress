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
import { isSupabaseConfigured } from './lib/supabase';
import { sampleActivities, sampleBadges, sampleUsers } from './lib/sampleData';
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
import { AvatarPage } from './pages/participant/AvatarPage';
import { AvatarShop } from './pages/participant/AvatarShop';
import { StreakSettings } from './pages/admin/StreakSettings';

const queryClient = new QueryClient();

async function seedIfEmpty() {
  // Supabase mode: initial data (activities/badges) is seeded via schema.sql.
  // Users are real accounts created through the signup flow — never auto-seeded.
  if (isSupabaseConfigured) return;

  // Demo mode: seed everything into localStorage if empty
  if (await storage.isEmpty()) {
    await Promise.all([
      storage.setUsers(sampleUsers),
      storage.setActivities(sampleActivities),
      storage.setBadges(sampleBadges),
    ]);
    return;
  }

  // One-time migration: rename the old 'MainAdmin' account to 'Sara.admin'
  const allUsers = await storage.getUsers();
  const oldAdmin = allUsers.find(u => u.username === 'MainAdmin' && u.role === 'main_admin');
  if (oldAdmin) {
    await storage.updateUser(oldAdmin.id, { username: 'Sara.admin', name: 'Sara' });
    // Also update the persisted auth session if it references the old username
    try {
      const authRaw = localStorage.getItem('sp_auth_v2');
      if (authRaw) {
        const parsed = JSON.parse(authRaw) as { state?: { currentUser?: { username?: string; name?: string } } };
        if (parsed?.state?.currentUser?.username === 'MainAdmin') {
          parsed.state.currentUser.username = 'Sara.admin';
          parsed.state.currentUser.name = 'Sara';
          localStorage.setItem('sp_auth_v2', JSON.stringify(parsed));
        }
      }
    } catch { /* ignore parse errors */ }
  }
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
