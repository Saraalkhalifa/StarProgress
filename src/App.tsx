import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { storage } from './lib/storage';
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

const queryClient = new QueryClient();

async function seedIfEmpty() {
  if (await storage.isEmpty()) {
    await Promise.all([
      storage.setUsers(sampleUsers),
      storage.setActivities(sampleActivities),
      storage.setBadges(sampleBadges),
    ]);
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

      {/* Participant */}
      <Route path="/participant" element={<ParticipantRoute><ParticipantDashboard /></ParticipantRoute>} />
      <Route path="/participant/submit" element={<ParticipantRoute><SubmitActivity /></ParticipantRoute>} />
      <Route path="/participant/history" element={<ParticipantRoute><MyProgress /></ParticipantRoute>} />
      <Route path="/participant/leaderboard" element={<ParticipantRoute><Leaderboard /></ParticipantRoute>} />
      <Route path="/participant/achievements" element={<ParticipantRoute><Achievements /></ParticipantRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/participants" element={<AdminRoute><ParticipantsManagement /></AdminRoute>} />
      <Route path="/admin/activities" element={<AdminRoute><ActivitiesManagement /></AdminRoute>} />
      <Route path="/admin/progress" element={<AdminRoute><ProgressRecords /></AdminRoute>} />
      <Route path="/admin/approvals" element={<AdminRoute><ApprovalCenter /></AdminRoute>} />
      <Route path="/admin/admins" element={<MainAdminRoute><AdminManagement /></MainAdminRoute>} />
      <Route path="/admin/badges" element={<AdminRoute><BadgeSettings /></AdminRoute>} />
      <Route path="/admin/account-requests" element={<AdminRoute><AccountRequests /></AdminRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    seedIfEmpty().finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="font-medium">Connecting…</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <DataProvider>
            <AppRoutes />
            <Toaster richColors position="top-right" />
          </DataProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
