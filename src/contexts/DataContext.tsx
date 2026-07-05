import React, { createContext, useContext, useState, useCallback } from 'react';
import type { User, Activity, Submission, Badge, Notification, LeaderboardEntry } from '../types';
import { storage } from '../lib/storage';
import { generateId } from '../lib/utils';
import { getMonth, getYear } from 'date-fns';

interface DataContextType {
  users: User[];
  activities: Activity[];
  submissions: Submission[];
  badges: Badge[];
  notifications: Notification[];
  refresh: () => void;
  // Points helpers
  getAcceptedPoints: (userId: string) => number;
  getMonthlyPoints: (userId: string, month: number, year: number) => number;
  getYearlyPoints: (userId: string, year: number) => number;
  getBadgeForPoints: (points: number) => Badge | null;
  getNextBadge: (points: number) => Badge | null;
  // Leaderboard
  getLeaderboard: (type: 'overall' | 'monthly' | 'yearly', month?: number, year?: number) => LeaderboardEntry[];
  // Submission actions
  addSubmission: (s: Omit<Submission, 'id' | 'submittedAt' | 'status'>) => void;
  approveSubmission: (id: string, adminId: string) => void;
  denySubmission: (id: string, adminId: string, comment?: string) => void;
  deleteSubmission: (id: string) => void;
  // User actions
  addUser: (u: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;
  approveAccount: (userId: string) => void;
  denyAccount: (userId: string) => void;
  pendingAccounts: User[];
  // Activity actions
  addActivity: (a: Omit<Activity, 'id' | 'createdAt'>) => void;
  updateActivity: (id: string, data: Partial<Activity>) => void;
  deleteActivity: (id: string) => void;
  // Badge actions
  updateBadge: (id: string, data: Partial<Badge>) => void;
  addBadge: (b: Omit<Badge, 'id'>) => void;
  deleteBadge: (id: string) => void;
  // Notification actions
  addNotification: (n: Omit<Notification, 'id' | 'createdAt'>) => void;
  markNotificationsRead: () => void;
  unreadCount: number;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>(() => storage.getUsers());
  const [activities, setActivities] = useState<Activity[]>(() => storage.getActivities());
  const [submissions, setSubmissions] = useState<Submission[]>(() => storage.getSubmissions());
  const [badges, setBadges] = useState<Badge[]>(() => storage.getBadges());
  const [notifications, setNotifications] = useState<Notification[]>(() => storage.getNotifications());

  const refresh = useCallback(() => {
    setUsers(storage.getUsers());
    setActivities(storage.getActivities());
    setSubmissions(storage.getSubmissions());
    setBadges(storage.getBadges());
    setNotifications(storage.getNotifications());
  }, []);

  const getAcceptedPoints = useCallback((userId: string) => {
    return submissions
      .filter(s => s.participantId === userId && s.status === 'accepted')
      .reduce((sum, s) => sum + s.pointsValueAtSubmission, 0);
  }, [submissions]);

  const getMonthlyPoints = useCallback((userId: string, month: number, year: number) => {
    return submissions
      .filter(s => {
        if (s.participantId !== userId || s.status !== 'accepted') return false;
        const d = new Date(s.submittedAt);
        return getMonth(d) === month && getYear(d) === year;
      })
      .reduce((sum, s) => sum + s.pointsValueAtSubmission, 0);
  }, [submissions]);

  const getYearlyPoints = useCallback((userId: string, year: number) => {
    return submissions
      .filter(s => {
        if (s.participantId !== userId || s.status !== 'accepted') return false;
        return getYear(new Date(s.submittedAt)) === year;
      })
      .reduce((sum, s) => sum + s.pointsValueAtSubmission, 0);
  }, [submissions]);

  const getSortedBadges = useCallback(() => {
    return [...badges].sort((a, b) => a.requiredPoints - b.requiredPoints);
  }, [badges]);

  const getBadgeForPoints = useCallback((points: number): Badge | null => {
    const sorted = getSortedBadges();
    let current: Badge | null = null;
    for (const b of sorted) {
      if (points >= b.requiredPoints) current = b;
    }
    return current;
  }, [getSortedBadges]);

  const getNextBadge = useCallback((points: number): Badge | null => {
    const sorted = getSortedBadges();
    return sorted.find(b => b.requiredPoints > points) || null;
  }, [getSortedBadges]);

  const getLeaderboard = useCallback((type: 'overall' | 'monthly' | 'yearly', month?: number, year?: number): LeaderboardEntry[] => {
    const participants = users.filter(u => u.role === 'participant');
    const now = new Date();
    const m = month ?? getMonth(now);
    const y = year ?? getYear(now);

    const entries: LeaderboardEntry[] = participants.map(u => {
      let points = 0;
      if (type === 'overall') points = getAcceptedPoints(u.id);
      else if (type === 'monthly') points = getMonthlyPoints(u.id, m, y);
      else points = getYearlyPoints(u.id, y);

      const acceptedSubs = submissions.filter(s =>
        s.participantId === u.id && s.status === 'accepted'
      );

      return {
        rank: 0,
        user: u,
        points,
        acceptedCount: acceptedSubs.length,
        badge: getBadgeForPoints(getAcceptedPoints(u.id)),
      };
    });

    entries.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const aLast = submissions.filter(s => s.participantId === a.user.id && s.status === 'accepted').sort((x, y) => new Date(y.submittedAt).getTime() - new Date(x.submittedAt).getTime())[0]?.submittedAt || '';
      const bLast = submissions.filter(s => s.participantId === b.user.id && s.status === 'accepted').sort((x, y) => new Date(y.submittedAt).getTime() - new Date(x.submittedAt).getTime())[0]?.submittedAt || '';
      return bLast.localeCompare(aLast);
    });

    entries.forEach((e, i) => { e.rank = i + 1; });
    return entries;
  }, [users, submissions, getAcceptedPoints, getMonthlyPoints, getYearlyPoints, getBadgeForPoints]);

  const addSubmission = useCallback((s: Omit<Submission, 'id' | 'submittedAt' | 'status'>) => {
    const sub: Submission = { ...s, id: generateId(), submittedAt: new Date().toISOString(), status: 'pending' };
    storage.addSubmission(sub);
    const notif: Notification = {
      id: generateId(),
      type: 'new_submission',
      message: `New submission pending approval`,
      relatedSubmissionId: sub.id,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    storage.addNotification(notif);
    refresh();
  }, [refresh]);

  const approveSubmission = useCallback((id: string, adminId: string) => {
    storage.updateSubmission(id, { status: 'accepted', reviewedAt: new Date().toISOString(), reviewedBy: adminId });
    refresh();
  }, [refresh]);

  const denySubmission = useCallback((id: string, adminId: string, comment?: string) => {
    storage.updateSubmission(id, { status: 'denied', adminComment: comment, reviewedAt: new Date().toISOString(), reviewedBy: adminId });
    refresh();
  }, [refresh]);

  const deleteSubmission = useCallback((id: string) => {
    storage.deleteSubmission(id);
    refresh();
  }, [refresh]);

  const addUser = useCallback((u: Omit<User, 'id' | 'createdAt'>) => {
    const user: User = { ...u, id: generateId(), createdAt: new Date().toISOString() };
    storage.addUser(user);
    refresh();
  }, [refresh]);

  const updateUser = useCallback((id: string, data: Partial<User>) => {
    storage.updateUser(id, data);
    refresh();
  }, [refresh]);

  const deleteUser = useCallback((id: string) => {
    storage.deleteUser(id);
    storage.setSubmissions(storage.getSubmissions().filter(s => s.participantId !== id));
    refresh();
  }, [refresh]);

  const approveAccount = useCallback((userId: string) => {
    storage.updateUser(userId, { accountStatus: 'active' });
    refresh();
  }, [refresh]);

  const denyAccount = useCallback((userId: string) => {
    storage.updateUser(userId, { accountStatus: 'denied' });
    refresh();
  }, [refresh]);

  const pendingAccounts = users.filter(u => u.accountStatus === 'pending');

  const addActivity = useCallback((a: Omit<Activity, 'id' | 'createdAt'>) => {
    const act: Activity = { ...a, id: generateId(), createdAt: new Date().toISOString() };
    storage.addActivity(act);
    refresh();
  }, [refresh]);

  const updateActivity = useCallback((id: string, data: Partial<Activity>) => {
    storage.updateActivity(id, data);
    refresh();
  }, [refresh]);

  const deleteActivity = useCallback((id: string) => {
    storage.deleteActivity(id);
    refresh();
  }, [refresh]);

  const updateBadge = useCallback((id: string, data: Partial<Badge>) => {
    storage.updateBadge(id, data);
    refresh();
  }, [refresh]);

  const addBadge = useCallback((b: Omit<Badge, 'id'>) => {
    storage.addBadge({ ...b, id: generateId() });
    refresh();
  }, [refresh]);

  const deleteBadge = useCallback((id: string) => {
    storage.deleteBadge(id);
    refresh();
  }, [refresh]);

  const addNotification = useCallback((n: Omit<Notification, 'id' | 'createdAt'>) => {
    storage.addNotification({ ...n, id: generateId(), createdAt: new Date().toISOString() });
    refresh();
  }, [refresh]);

  const markNotificationsRead = useCallback(() => {
    storage.markAllRead();
    refresh();
  }, [refresh]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <DataContext.Provider value={{
      users, activities, submissions, badges, notifications, refresh,
      getAcceptedPoints, getMonthlyPoints, getYearlyPoints,
      getBadgeForPoints, getNextBadge, getLeaderboard,
      addSubmission, approveSubmission, denySubmission, deleteSubmission,
      addUser, updateUser, deleteUser, approveAccount, denyAccount, pendingAccounts,
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
