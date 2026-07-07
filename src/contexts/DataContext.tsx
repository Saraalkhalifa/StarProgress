import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User, Activity, Submission, Badge, Notification, LeaderboardEntry } from '../types';
import { storage } from '../lib/storage';
import { isSupabaseConfigured } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { generateId } from '../lib/utils';
import { getMonth, getYear } from 'date-fns';

interface DataContextType {
  users: User[];
  activities: Activity[];
  submissions: Submission[];
  badges: Badge[];
  notifications: Notification[];
  loading: boolean;
  refresh: () => Promise<void>;
  // Points helpers
  getAcceptedPoints: (userId: string) => number;
  getMonthlyPoints: (userId: string, month: number, year: number) => number;
  getYearlyPoints: (userId: string, year: number) => number;
  getBadgeForPoints: (points: number) => Badge | null;
  getNextBadge: (points: number) => Badge | null;
  // Leaderboard
  getLeaderboard: (type: 'overall' | 'monthly' | 'yearly', month?: number, year?: number) => LeaderboardEntry[];
  // Submission actions
  addSubmission: (s: Omit<Submission, 'id' | 'submittedAt' | 'status'>) => Promise<void>;
  approveSubmission: (id: string, adminId: string) => Promise<void>;
  denySubmission: (id: string, adminId: string, comment?: string) => Promise<void>;
  deleteSubmission: (id: string) => Promise<void>;
  // User actions
  addUser: (u: Omit<User, 'id' | 'createdAt'>) => Promise<void>;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  softDeleteUser: (id: string) => Promise<void>;
  restoreUser: (id: string) => Promise<void>;
  approveAccount: (userId: string) => Promise<void>;
  denyAccount: (userId: string, reason?: string) => Promise<void>;
  suspendAccount: (userId: string) => Promise<void>;
  pendingAccounts: User[];
  // Activity actions
  addActivity: (a: Omit<Activity, 'id' | 'createdAt'>) => Promise<void>;
  updateActivity: (id: string, data: Partial<Activity>) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  // Badge actions
  updateBadge: (id: string, data: Partial<Badge>) => Promise<void>;
  addBadge: (b: Omit<Badge, 'id'>) => Promise<void>;
  deleteBadge: (id: string) => Promise<void>;
  // Notification actions
  addNotification: (n: Omit<Notification, 'id' | 'createdAt'>) => Promise<void>;
  markNotificationsRead: () => Promise<void>;
  unreadCount: number;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [u, a, s, b, n] = await Promise.all([
      storage.getUsers(),
      storage.getActivities(),
      storage.getSubmissions(),
      storage.getBadges(),
      storage.getNotifications(),
    ]);
    setUsers(u);
    setActivities(a);
    setSubmissions(s);
    setBadges(b);
    setNotifications(n);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  // ── Points helpers ────────────────────────────────────────────────────────

  const getAcceptedPoints = useCallback((userId: string) =>
    submissions
      .filter(s => s.participantId === userId && s.status === 'accepted')
      .reduce((sum, s) => sum + s.pointsValueAtSubmission, 0),
  [submissions]);

  const getMonthlyPoints = useCallback((userId: string, month: number, year: number) =>
    submissions
      .filter(s => {
        if (s.participantId !== userId || s.status !== 'accepted') return false;
        const d = new Date(s.submittedAt);
        return getMonth(d) === month && getYear(d) === year;
      })
      .reduce((sum, s) => sum + s.pointsValueAtSubmission, 0),
  [submissions]);

  const getYearlyPoints = useCallback((userId: string, year: number) =>
    submissions
      .filter(s => {
        if (s.participantId !== userId || s.status !== 'accepted') return false;
        return getYear(new Date(s.submittedAt)) === year;
      })
      .reduce((sum, s) => sum + s.pointsValueAtSubmission, 0),
  [submissions]);

  const getSortedBadges = useCallback(() =>
    [...badges].sort((a, b) => a.requiredPoints - b.requiredPoints),
  [badges]);

  const getBadgeForPoints = useCallback((points: number): Badge | null => {
    let current: Badge | null = null;
    for (const b of getSortedBadges()) {
      if (points >= b.requiredPoints) current = b;
    }
    return current;
  }, [getSortedBadges]);

  const getNextBadge = useCallback((points: number): Badge | null =>
    getSortedBadges().find(b => b.requiredPoints > points) ?? null,
  [getSortedBadges]);

  const getLeaderboard = useCallback((
    type: 'overall' | 'monthly' | 'yearly',
    month?: number,
    year?: number,
  ): LeaderboardEntry[] => {
    const now = new Date();
    const m = month ?? getMonth(now);
    const y = year ?? getYear(now);
    const participants = users.filter(u => u.role === 'participant');

    const entries: LeaderboardEntry[] = participants.map(u => {
      let points = 0;
      if (type === 'overall') points = getAcceptedPoints(u.id);
      else if (type === 'monthly') points = getMonthlyPoints(u.id, m, y);
      else points = getYearlyPoints(u.id, y);

      const accepted = submissions.filter(s => s.participantId === u.id && s.status === 'accepted');
      return { rank: 0, user: u, points, acceptedCount: accepted.length, badge: getBadgeForPoints(getAcceptedPoints(u.id)) };
    });

    entries.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const lastOf = (uid: string) =>
        submissions
          .filter(s => s.participantId === uid && s.status === 'accepted')
          .sort((x, y) => new Date(y.submittedAt).getTime() - new Date(x.submittedAt).getTime())[0]?.submittedAt ?? '';
      return lastOf(b.user.id).localeCompare(lastOf(a.user.id));
    });
    entries.forEach((e, i) => { e.rank = i + 1; });
    return entries;
  }, [users, submissions, getAcceptedPoints, getMonthlyPoints, getYearlyPoints, getBadgeForPoints]);

  // ── Submission mutations ─────────────────────────────────────────���────────

  const addSubmission = useCallback(async (s: Omit<Submission, 'id' | 'submittedAt' | 'status'>) => {
    const sub: Submission = { ...s, id: generateId(), submittedAt: new Date().toISOString(), status: 'pending' };
    await storage.addSubmission(sub);
    await storage.addNotification({
      id: generateId(),
      userId: sub.participantId,
      type: 'new_submission',
      message: 'Your submission was received and is pending review.',
      relatedSubmissionId: sub.id,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
    await refresh();
  }, [refresh]);

  const approveSubmission = useCallback(async (id: string, adminId: string) => {
    await storage.updateSubmission(id, { status: 'accepted', reviewedAt: new Date().toISOString(), reviewedBy: adminId });
    const sub = submissions.find(s => s.id === id);
    if (sub) {
      await storage.addNotification({
        id: generateId(),
        userId: sub.participantId,
        type: 'submission_approved',
        message: 'Your submission was approved! Points have been added.',
        relatedSubmissionId: id,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }
    await refresh();
  }, [refresh, submissions]);

  const denySubmission = useCallback(async (id: string, adminId: string, comment?: string) => {
    await storage.updateSubmission(id, { status: 'denied', adminComment: comment, reviewedAt: new Date().toISOString(), reviewedBy: adminId });
    const sub = submissions.find(s => s.id === id);
    if (sub) {
      await storage.addNotification({
        id: generateId(),
        userId: sub.participantId,
        type: 'submission_denied',
        message: comment ? `Your submission was not approved: ${comment}` : 'Your submission was not approved.',
        relatedSubmissionId: id,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }
    await refresh();
  }, [refresh, submissions]);

  const deleteSubmission = useCallback(async (id: string) => {
    await storage.deleteSubmission(id);
    await refresh();
  }, [refresh]);

  // ── User mutations ────────────────────────────────────────────────────────

  const addUser = useCallback(async (u: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = { ...u, id: generateId(), createdAt: new Date().toISOString() };
    await storage.addUser(newUser);

    // Demo mode only: notify the main admin about the new pending account.
    // In Supabase mode this is handled by the notify_admin_on_signup DB trigger.
    if (!isSupabaseConfigured && u.accountStatus === 'pending') {
      const mainAdmin = users.find(u => u.role === 'main_admin');
      if (mainAdmin) {
        await storage.addNotification({
          id: generateId(),
          userId: mainAdmin.id,
          type: 'new_signup',
          message: `New ${u.role} account request from ${u.name} (@${u.username ?? u.email}).`,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    await refresh();
  }, [refresh, users]);

  const updateUser = useCallback(async (id: string, data: Partial<User>) => {
    await storage.updateUser(id, data);
    await refresh();
  }, [refresh]);

  const deleteUser = useCallback(async (id: string) => {
    await storage.deleteUser(id);
    await refresh();
  }, [refresh]);

  const softDeleteUser = useCallback(async (id: string) => {
    const deletedById = useAuthStore.getState().currentUser?.id ?? '';
    await storage.softDeleteUser(id, deletedById);
    await refresh();
  }, [refresh]);

  const restoreUser = useCallback(async (id: string) => {
    await storage.restoreUser(id);
    await refresh();
  }, [refresh]);

  const approveAccount = useCallback(async (userId: string) => {
    await storage.updateUser(userId, { accountStatus: 'active', approvedAt: new Date().toISOString() });
    await refresh();
  }, [refresh]);

  const denyAccount = useCallback(async (userId: string, reason?: string) => {
    await storage.updateUser(userId, { accountStatus: 'denied', denialReason: reason });
    await refresh();
  }, [refresh]);

  const suspendAccount = useCallback(async (userId: string) => {
    await storage.updateUser(userId, { accountStatus: 'suspended' });
    await refresh();
  }, [refresh]);

  const pendingAccounts = users.filter(u => u.accountStatus === 'pending');

  // ── Activity mutations ────────────────────────────────────────────────────

  const addActivity = useCallback(async (a: Omit<Activity, 'id' | 'createdAt'>) => {
    await storage.addActivity({ ...a, id: generateId(), createdAt: new Date().toISOString() });
    await refresh();
  }, [refresh]);

  const updateActivity = useCallback(async (id: string, data: Partial<Activity>) => {
    await storage.updateActivity(id, data);
    await refresh();
  }, [refresh]);

  const deleteActivity = useCallback(async (id: string) => {
    await storage.deleteActivity(id);
    await refresh();
  }, [refresh]);

  // ── Badge mutations ───────────────────────────────────────────────────────

  const updateBadge = useCallback(async (id: string, data: Partial<Badge>) => {
    await storage.updateBadge(id, data);
    await refresh();
  }, [refresh]);

  const addBadge = useCallback(async (b: Omit<Badge, 'id'>) => {
    await storage.addBadge({ ...b, id: generateId() });
    await refresh();
  }, [refresh]);

  const deleteBadge = useCallback(async (id: string) => {
    await storage.deleteBadge(id);
    await refresh();
  }, [refresh]);

  // ── Notification mutations ────────────────────────────────────────────────

  const addNotification = useCallback(async (n: Omit<Notification, 'id' | 'createdAt'>) => {
    await storage.addNotification({ ...n, id: generateId(), createdAt: new Date().toISOString() });
    await refresh();
  }, [refresh]);

  const markNotificationsRead = useCallback(async () => {
    await storage.markAllRead();
    await refresh();
  }, [refresh]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <DataContext.Provider value={{
      users, activities, submissions, badges, notifications, loading, refresh,
      getAcceptedPoints, getMonthlyPoints, getYearlyPoints,
      getBadgeForPoints, getNextBadge, getLeaderboard,
      addSubmission, approveSubmission, denySubmission, deleteSubmission,
      addUser, updateUser, deleteUser, softDeleteUser, restoreUser, approveAccount, denyAccount, suspendAccount, pendingAccounts,
      addActivity, updateActivity, deleteActivity,
      updateBadge, addBadge, deleteBadge,
      addNotification, markNotificationsRead, unreadCount,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
