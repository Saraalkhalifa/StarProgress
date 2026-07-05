import type { User, Activity, Submission, Badge, Notification } from '../types';

const KEYS = {
  USERS: 'sp_users',
  ACTIVITIES: 'sp_activities',
  SUBMISSIONS: 'sp_submissions',
  BADGES: 'sp_badges',
  NOTIFICATIONS: 'sp_notifications',
  INITIALIZED: 'sp_init_v4',
};

function get<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

function set<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export const storage = {
  // Users
  getUsers: () => get<User>(KEYS.USERS),
  setUsers: (u: User[]) => set(KEYS.USERS, u),
  addUser: (u: User) => set(KEYS.USERS, [...get<User>(KEYS.USERS), u]),
  updateUser: (id: string, data: Partial<User>) => {
    set(KEYS.USERS, get<User>(KEYS.USERS).map(u => u.id === id ? { ...u, ...data } : u));
  },
  deleteUser: (id: string) => set(KEYS.USERS, get<User>(KEYS.USERS).filter(u => u.id !== id)),

  // Activities
  getActivities: () => get<Activity>(KEYS.ACTIVITIES),
  setActivities: (a: Activity[]) => set(KEYS.ACTIVITIES, a),
  addActivity: (a: Activity) => set(KEYS.ACTIVITIES, [...get<Activity>(KEYS.ACTIVITIES), a]),
  updateActivity: (id: string, data: Partial<Activity>) => {
    set(KEYS.ACTIVITIES, get<Activity>(KEYS.ACTIVITIES).map(a => a.id === id ? { ...a, ...data } : a));
  },
  deleteActivity: (id: string) => set(KEYS.ACTIVITIES, get<Activity>(KEYS.ACTIVITIES).filter(a => a.id !== id)),

  // Submissions
  getSubmissions: () => get<Submission>(KEYS.SUBMISSIONS),
  setSubmissions: (s: Submission[]) => set(KEYS.SUBMISSIONS, s),
  addSubmission: (s: Submission) => set(KEYS.SUBMISSIONS, [...get<Submission>(KEYS.SUBMISSIONS), s]),
  updateSubmission: (id: string, data: Partial<Submission>) => {
    set(KEYS.SUBMISSIONS, get<Submission>(KEYS.SUBMISSIONS).map(s => s.id === id ? { ...s, ...data } : s));
  },
  deleteSubmission: (id: string) => set(KEYS.SUBMISSIONS, get<Submission>(KEYS.SUBMISSIONS).filter(s => s.id !== id)),

  // Badges
  getBadges: () => get<Badge>(KEYS.BADGES),
  setBadges: (b: Badge[]) => set(KEYS.BADGES, b),
  updateBadge: (id: string, data: Partial<Badge>) => {
    set(KEYS.BADGES, get<Badge>(KEYS.BADGES).map(b => b.id === id ? { ...b, ...data } : b));
  },
  addBadge: (b: Badge) => set(KEYS.BADGES, [...get<Badge>(KEYS.BADGES), b]),
  deleteBadge: (id: string) => set(KEYS.BADGES, get<Badge>(KEYS.BADGES).filter(b => b.id !== id)),

  // Notifications
  getNotifications: () => get<Notification>(KEYS.NOTIFICATIONS),
  addNotification: (n: Notification) => set(KEYS.NOTIFICATIONS, [n, ...get<Notification>(KEYS.NOTIFICATIONS)]),
  markAllRead: () => set(KEYS.NOTIFICATIONS, get<Notification>(KEYS.NOTIFICATIONS).map(n => ({ ...n, isRead: true }))),
  markRead: (id: string) => {
    set(KEYS.NOTIFICATIONS, get<Notification>(KEYS.NOTIFICATIONS).map(n => n.id === id ? { ...n, isRead: true } : n));
  },

  isInitialized: () => localStorage.getItem(KEYS.INITIALIZED) === 'true',
  setInitialized: () => localStorage.setItem(KEYS.INITIALIZED, 'true'),
  clearAll: () => Object.values(KEYS).forEach(k => localStorage.removeItem(k)),
};
