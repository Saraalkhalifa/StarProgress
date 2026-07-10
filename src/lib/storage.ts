import type { User, Activity, Submission, Badge, Notification } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

// ─── Row → TypeScript mappers (Supabase snake_case → camelCase) ───────────────

const mapUser = (r: Record<string, unknown>): User => ({
  id: r.id as string,
  name: r.name as string,
  email: (r.email as string) ?? '',
  username: (r.username as string) ?? undefined,
  passwordHash: (r.password_hash as string) ?? undefined,
  role: r.role as User['role'],
  accountStatus: r.account_status as User['accountStatus'],
  createdAt: r.created_at as string,
  avatarColor: (r.avatar_color as string) ?? 'bg-blue-500',
  phoneNumber: (r.phone_number as string) ?? undefined,
  age: (r.age as number) ?? undefined,
  dateOfBirth: (r.date_of_birth as string) ?? undefined,
  signupMessage: (r.signup_message as string) ?? undefined,
  denialReason: (r.denial_reason as string) ?? undefined,
  approvedBy: (r.approved_by as string) ?? undefined,
  approvedAt: (r.approved_at as string) ?? undefined,
  isDeleted: (r.is_deleted as boolean) ?? false,
  deletedAt: (r.deleted_at as string) ?? undefined,
  deletedBy: (r.deleted_by as string) ?? undefined,
  emailVerifiedAt: (r.email_verified_at as string) ?? undefined,
  parentEmail: (r.parent_email as string) ?? undefined,
  parentUserId: (r.parent_user_id as string) ?? undefined,
});

const toUserDb = (u: Partial<User> & { id?: string }) => {
  const o: Record<string, unknown> = {};
  if (u.id            !== undefined) o.id             = u.id;
  if (u.name          !== undefined) o.name           = u.name;
  if (u.email         !== undefined) o.email          = u.email;
  if (u.username      !== undefined) o.username       = u.username;
  if (u.passwordHash  !== undefined) o.password_hash  = u.passwordHash;
  if (u.role          !== undefined) o.role           = u.role;
  if (u.accountStatus !== undefined) o.account_status = u.accountStatus;
  if (u.createdAt     !== undefined) o.created_at     = u.createdAt;
  if (u.avatarColor    !== undefined) o.avatar_color    = u.avatarColor;
  if (u.phoneNumber    !== undefined) o.phone_number    = u.phoneNumber;
  if (u.age            !== undefined) o.age             = u.age;
  if (u.dateOfBirth    !== undefined) o.date_of_birth   = u.dateOfBirth;
  if (u.signupMessage  !== undefined) o.signup_message  = u.signupMessage;
  if (u.denialReason   !== undefined) o.denial_reason   = u.denialReason;
  if (u.approvedBy     !== undefined) o.approved_by     = u.approvedBy;
  if (u.approvedAt     !== undefined) o.approved_at     = u.approvedAt;
  if (u.isDeleted      !== undefined) o.is_deleted      = u.isDeleted;
  if (u.deletedAt      !== undefined) o.deleted_at      = u.deletedAt;
  if (u.deletedBy      !== undefined) o.deleted_by      = u.deletedBy;
  if (u.emailVerifiedAt !== undefined) o.email_verified_at = u.emailVerifiedAt;
  if (u.parentEmail    !== undefined) o.parent_email    = u.parentEmail;
  if (u.parentUserId   !== undefined) o.parent_user_id  = u.parentUserId;
  return o;
};

const mapActivity = (r: Record<string, unknown>): Activity => ({
  id: r.id as string,
  name: r.name as string,
  nameAr: (r.name_ar as string) ?? undefined,
  description: (r.description as string) ?? undefined,
  points: r.points as number,
  icon: (r.icon as string) ?? '📌',
  isActive: r.is_active as boolean,
  createdAt: r.created_at as string,
});

const toActivityDb = (a: Partial<Activity> & { id?: string }) => {
  const o: Record<string, unknown> = {};
  if (a.id          !== undefined) o.id          = a.id;
  if (a.name        !== undefined) o.name        = a.name;
  if (a.nameAr      !== undefined) o.name_ar     = a.nameAr;
  if (a.description !== undefined) o.description = a.description;
  if (a.points      !== undefined) o.points      = a.points;
  if (a.icon        !== undefined) o.icon        = a.icon;
  if (a.isActive    !== undefined) o.is_active   = a.isActive;
  if (a.createdAt   !== undefined) o.created_at  = a.createdAt;
  return o;
};

const mapSubmission = (r: Record<string, unknown>): Submission => ({
  id: r.id as string,
  participantId: r.participant_id as string,
  activityId: r.activity_id as string,
  note: (r.note as string) ?? '',
  pointsValueAtSubmission: r.points_value_at_submission as number,
  status: r.status as Submission['status'],
  adminComment: (r.admin_comment as string) ?? undefined,
  submittedAt: r.submitted_at as string,
  reviewedAt: (r.reviewed_at as string) ?? undefined,
  reviewedBy: (r.reviewed_by as string) ?? undefined,
  activity_date: (r.activity_date as string) ?? undefined,
  sourceType: (r.source_type as Submission['sourceType']) ?? undefined,
  isFlagged: (r.is_flagged as boolean) ?? false,
  flagNote: (r.flag_note as string) ?? undefined,
});

const toSubmissionDb = (s: Partial<Submission> & { id?: string }) => {
  const o: Record<string, unknown> = {};
  if (s.id                       !== undefined) o.id                          = s.id;
  if (s.participantId            !== undefined) o.participant_id              = s.participantId;
  if (s.activityId               !== undefined) o.activity_id                = s.activityId;
  if (s.note                     !== undefined) o.note                        = s.note;
  if (s.pointsValueAtSubmission  !== undefined) o.points_value_at_submission  = s.pointsValueAtSubmission;
  if (s.status                   !== undefined) o.status                      = s.status;
  if (s.adminComment             !== undefined) o.admin_comment               = s.adminComment;
  if (s.submittedAt              !== undefined) o.submitted_at                = s.submittedAt;
  if (s.reviewedAt               !== undefined) o.reviewed_at                 = s.reviewedAt;
  if (s.reviewedBy               !== undefined) o.reviewed_by                 = s.reviewedBy;
  if (s.activity_date            !== undefined) o.activity_date               = s.activity_date;
  if (s.sourceType               !== undefined) o.source_type                 = s.sourceType;
  if (s.isFlagged                !== undefined) o.is_flagged                  = s.isFlagged;
  if (s.flagNote                 !== undefined) o.flag_note                   = s.flagNote;
  return o;
};

const mapBadge = (r: Record<string, unknown>): Badge => ({
  id: r.id as string,
  name: r.name as string,
  requiredPoints: r.required_points as number,
  icon: (r.icon as string) ?? '⭐',
  color: (r.color as string) ?? '',
  bgColor: (r.bg_color as string) ?? '',
});

const toBadgeDb = (b: Partial<Badge> & { id?: string }) => {
  const o: Record<string, unknown> = {};
  if (b.id             !== undefined) o.id              = b.id;
  if (b.name           !== undefined) o.name            = b.name;
  if (b.requiredPoints !== undefined) o.required_points = b.requiredPoints;
  if (b.icon           !== undefined) o.icon            = b.icon;
  if (b.color          !== undefined) o.color           = b.color;
  if (b.bgColor        !== undefined) o.bg_color        = b.bgColor;
  return o;
};

const mapNotification = (r: Record<string, unknown>): Notification => ({
  id: r.id as string,
  userId: (r.user_id as string) ?? undefined,
  type: r.type as string,
  message: r.message as string,
  relatedSubmissionId: (r.related_submission_id as string) ?? undefined,
  isRead: r.is_read as boolean,
  createdAt: r.created_at as string,
});

const toNotificationDb = (n: Partial<Notification> & { id?: string }) => {
  const o: Record<string, unknown> = {};
  if (n.id                  !== undefined) o.id                    = n.id;
  if (n.userId              !== undefined) o.user_id               = n.userId;
  if (n.type                !== undefined) o.type                  = n.type;
  if (n.message             !== undefined) o.message               = n.message;
  if (n.relatedSubmissionId !== undefined) o.related_submission_id = n.relatedSubmissionId;
  if (n.isRead              !== undefined) o.is_read               = n.isRead;
  if (n.createdAt           !== undefined) o.created_at            = n.createdAt;
  return o;
};

// ─── localStorage helpers — DEMO MODE ONLY ───────────────────────────────────
// This adapter stores data in the browser's localStorage.
// It is intended for local development and testing only.
// Data is NOT shared between devices or users and is NOT secure for production.
// To use a real database, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.

const LS_KEYS = {
  users:         'sp_users',
  activities:    'sp_activities',
  submissions:   'sp_submissions',
  badges:        'sp_badges',
  notifications: 'sp_notifications',
};

function lsGet<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]') as T[]; }
  catch { return []; }
}

function lsSet<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// ─── localStorage-backed storage ──────────────────────────────────────────────

const localStore = {
  getUsers: async (): Promise<User[]> =>
    lsGet<User>(LS_KEYS.users).filter(u => !u.isDeleted),

  setUsers: async (users: User[]): Promise<void> =>
    lsSet(LS_KEYS.users, users),

  addUser: async (u: User): Promise<void> => {
    const users = lsGet<User>(LS_KEYS.users);
    lsSet(LS_KEYS.users, [...users, u]);
  },

  updateUser: async (id: string, data: Partial<User>): Promise<void> => {
    const users = lsGet<User>(LS_KEYS.users);
    lsSet(LS_KEYS.users, users.map(u => u.id === id ? { ...u, ...data } : u));
  },

  deleteUser: async (id: string): Promise<void> => {
    lsSet(LS_KEYS.users, lsGet<User>(LS_KEYS.users).filter(u => u.id !== id));
  },

  softDeleteUser: async (id: string, deletedById: string): Promise<void> => {
    const users = lsGet<User>(LS_KEYS.users);
    lsSet(LS_KEYS.users, users.map(u =>
      u.id === id
        ? { ...u, isDeleted: true, deletedAt: new Date().toISOString(), deletedBy: deletedById, accountStatus: 'deleted' as const }
        : u
    ));
  },

  restoreUser: async (id: string): Promise<void> => {
    const users = lsGet<User>(LS_KEYS.users);
    lsSet(LS_KEYS.users, users.map(u =>
      u.id === id
        ? { ...u, isDeleted: false, deletedAt: undefined, deletedBy: undefined, accountStatus: 'active' as const }
        : u
    ));
  },

  getArchivedUsers: async (): Promise<User[]> =>
    lsGet<User>(LS_KEYS.users).filter(u => u.isDeleted),

  findByIdentifier: async (identifier: string): Promise<User | null> => {
    const lower = identifier.toLowerCase();
    const users = lsGet<User>(LS_KEYS.users);
    return users.find(u =>
      u.username?.toLowerCase() === lower || u.email.toLowerCase() === lower
    ) ?? null;
  },

  getActivities: async (): Promise<Activity[]> =>
    lsGet<Activity>(LS_KEYS.activities),

  setActivities: async (activities: Activity[]): Promise<void> =>
    lsSet(LS_KEYS.activities, activities),

  addActivity: async (a: Activity): Promise<void> => {
    const list = lsGet<Activity>(LS_KEYS.activities);
    lsSet(LS_KEYS.activities, [...list, a]);
  },

  updateActivity: async (id: string, data: Partial<Activity>): Promise<void> => {
    const list = lsGet<Activity>(LS_KEYS.activities);
    lsSet(LS_KEYS.activities, list.map(a => a.id === id ? { ...a, ...data } : a));
  },

  deleteActivity: async (id: string): Promise<void> => {
    lsSet(LS_KEYS.activities, lsGet<Activity>(LS_KEYS.activities).filter(a => a.id !== id));
  },

  getSubmissions: async (): Promise<Submission[]> =>
    lsGet<Submission>(LS_KEYS.submissions),

  addSubmission: async (s: Submission): Promise<void> => {
    const list = lsGet<Submission>(LS_KEYS.submissions);
    lsSet(LS_KEYS.submissions, [s, ...list]);
  },

  updateSubmission: async (id: string, data: Partial<Submission>): Promise<void> => {
    const list = lsGet<Submission>(LS_KEYS.submissions);
    lsSet(LS_KEYS.submissions, list.map(s => s.id === id ? { ...s, ...data } : s));
  },

  deleteSubmission: async (id: string): Promise<void> => {
    lsSet(LS_KEYS.submissions, lsGet<Submission>(LS_KEYS.submissions).filter(s => s.id !== id));
  },

  getBadges: async (): Promise<Badge[]> =>
    lsGet<Badge>(LS_KEYS.badges),

  setBadges: async (badges: Badge[]): Promise<void> =>
    lsSet(LS_KEYS.badges, badges),

  updateBadge: async (id: string, data: Partial<Badge>): Promise<void> => {
    const list = lsGet<Badge>(LS_KEYS.badges);
    lsSet(LS_KEYS.badges, list.map(b => b.id === id ? { ...b, ...data } : b));
  },

  addBadge: async (b: Badge): Promise<void> => {
    const list = lsGet<Badge>(LS_KEYS.badges);
    lsSet(LS_KEYS.badges, [...list, b]);
  },

  deleteBadge: async (id: string): Promise<void> => {
    lsSet(LS_KEYS.badges, lsGet<Badge>(LS_KEYS.badges).filter(b => b.id !== id));
  },

  getNotifications: async (): Promise<Notification[]> =>
    lsGet<Notification>(LS_KEYS.notifications),

  addNotification: async (n: Notification): Promise<void> => {
    const list = lsGet<Notification>(LS_KEYS.notifications);
    lsSet(LS_KEYS.notifications, [n, ...list]);
  },

  markAllRead: async (): Promise<void> => {
    const list = lsGet<Notification>(LS_KEYS.notifications);
    lsSet(LS_KEYS.notifications, list.map(n => ({ ...n, isRead: true })));
  },

  isEmpty: async (): Promise<boolean> =>
    lsGet<User>(LS_KEYS.users).length === 0,

  getLeaderboardData: async (): Promise<Array<{ participant_id: string; points_value: number; submitted_at: string }>> => {
    // In localStorage mode all submissions are local, so just filter accepted ones.
    return lsGet<Submission>(LS_KEYS.submissions)
      .filter(s => s.status === 'accepted')
      .map(s => ({ participant_id: s.participantId, points_value: s.pointsValueAtSubmission, submitted_at: s.submittedAt }));
  },
};

// ─── Supabase-backed storage ──────────────────────────────────────────────────

const supabaseStore = {
  getUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase!.from('users').select('*').eq('is_deleted', false).order('created_at');
    if (error) throw error;
    return (data ?? []).map(r => mapUser(r as Record<string, unknown>));
  },

  setUsers: async (users: User[]): Promise<void> => {
    const { error } = await supabase!.from('users').upsert(users.map(toUserDb));
    if (error) throw error;
  },

  addUser: async (u: User): Promise<void> => {
    const { error } = await supabase!.from('users').insert(toUserDb(u));
    if (error) throw error;
  },

  updateUser: async (id: string, data: Partial<User>): Promise<void> => {
    const { error } = await supabase!.from('users').update(toUserDb(data)).eq('id', id);
    if (error) throw error;
  },

  deleteUser: async (id: string): Promise<void> => {
    const { error } = await supabase!.from('users').delete().eq('id', id);
    if (error) throw error;
  },

  softDeleteUser: async (id: string, deletedById: string): Promise<void> => {
    const { error } = await supabase!.from('users').update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: deletedById,
      account_status: 'deleted',
    }).eq('id', id);
    if (error) throw error;
  },

  restoreUser: async (id: string): Promise<void> => {
    const { error } = await supabase!.from('users').update({
      is_deleted: false,
      deleted_at: null,
      deleted_by: null,
      account_status: 'active',
    }).eq('id', id);
    if (error) throw error;
  },

  getArchivedUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase!.from('users').select('*').eq('is_deleted', true).order('deleted_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(r => mapUser(r as Record<string, unknown>));
  },

  findByIdentifier: async (identifier: string): Promise<User | null> => {
    const lower = identifier.toLowerCase();
    const { data: byUsername } = await supabase!
      .from('users').select('*').ilike('username', lower).limit(1);
    if (byUsername?.length) return mapUser(byUsername[0] as Record<string, unknown>);
    const { data: byEmail } = await supabase!
      .from('users').select('*').ilike('email', lower).limit(1);
    if (byEmail?.length) return mapUser(byEmail[0] as Record<string, unknown>);
    return null;
  },

  getActivities: async (): Promise<Activity[]> => {
    const { data, error } = await supabase!.from('activities').select('*').order('created_at');
    if (error) throw error;
    return (data ?? []).map(r => mapActivity(r as Record<string, unknown>));
  },

  setActivities: async (activities: Activity[]): Promise<void> => {
    const { error } = await supabase!.from('activities').upsert(activities.map(toActivityDb));
    if (error) throw error;
  },

  addActivity: async (a: Activity): Promise<void> => {
    const { error } = await supabase!.from('activities').insert(toActivityDb(a));
    if (error) throw error;
  },

  updateActivity: async (id: string, data: Partial<Activity>): Promise<void> => {
    const { error } = await supabase!.from('activities').update(toActivityDb(data)).eq('id', id);
    if (error) throw error;
  },

  deleteActivity: async (id: string): Promise<void> => {
    const { error } = await supabase!.from('activities').delete().eq('id', id);
    if (error) throw error;
  },

  getSubmissions: async (): Promise<Submission[]> => {
    const { data, error } = await supabase!
      .from('submissions').select('*').order('submitted_at', { ascending: false }).limit(500);
    if (error) throw error;
    return (data ?? []).map(r => mapSubmission(r as Record<string, unknown>));
  },

  addSubmission: async (s: Submission): Promise<void> => {
    const { error } = await supabase!.from('submissions').insert(toSubmissionDb(s));
    if (error) throw error;
  },

  updateSubmission: async (id: string, data: Partial<Submission>): Promise<void> => {
    const { error } = await supabase!.from('submissions').update(toSubmissionDb(data)).eq('id', id);
    if (error) throw error;
  },

  deleteSubmission: async (id: string): Promise<void> => {
    const { error } = await supabase!.from('submissions').delete().eq('id', id);
    if (error) throw error;
  },

  getBadges: async (): Promise<Badge[]> => {
    const { data, error } = await supabase!
      .from('badges').select('*').order('required_points');
    if (error) throw error;
    return (data ?? []).map(r => mapBadge(r as Record<string, unknown>));
  },

  setBadges: async (badges: Badge[]): Promise<void> => {
    const { error } = await supabase!.from('badges').upsert(badges.map(toBadgeDb));
    if (error) throw error;
  },

  updateBadge: async (id: string, data: Partial<Badge>): Promise<void> => {
    const { error } = await supabase!.from('badges').update(toBadgeDb(data)).eq('id', id);
    if (error) throw error;
  },

  addBadge: async (b: Badge): Promise<void> => {
    const { error } = await supabase!.from('badges').insert(toBadgeDb(b));
    if (error) throw error;
  },

  deleteBadge: async (id: string): Promise<void> => {
    const { error } = await supabase!.from('badges').delete().eq('id', id);
    if (error) throw error;
  },

  getNotifications: async (): Promise<Notification[]> => {
    const { data, error } = await supabase!
      .from('notifications').select('*').order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    return (data ?? []).map(r => mapNotification(r as Record<string, unknown>));
  },

  addNotification: async (n: Notification): Promise<void> => {
    const { error } = await supabase!.from('notifications').insert(toNotificationDb(n));
    if (error) throw error;
  },

  markAllRead: async (): Promise<void> => {
    // RLS automatically scopes this to the current user's notifications
    const { data: { user } } = await supabase!.auth.getUser();
    if (!user) return;
    const { error } = await supabase!
      .from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    if (error) throw error;
  },

  isEmpty: async (): Promise<boolean> => {
    const { count } = await supabase!
      .from('users').select('id', { count: 'exact', head: true });
    return (count ?? 0) === 0;
  },

  getLeaderboardData: async (): Promise<Array<{ participant_id: string; points_value: number; submitted_at: string }>> => {
    const { data, error } = await supabase!.rpc('get_leaderboard_data');
    if (error) throw error;
    return (data ?? []) as Array<{ participant_id: string; points_value: number; submitted_at: string }>;
  },
};

// ─── Export the right adapter ─────────────────────────────────────────────────

export const storage = isSupabaseConfigured ? supabaseStore : localStore;
