import type { User, Activity, Submission, Badge, Notification } from '../types';
import { supabase } from './supabase';

// ─── Row → TypeScript mappers ────────────────────────────────────────────────

const mapUser = (r: Record<string, unknown>): User => ({
  id: r.id as string,
  name: r.name as string,
  email: (r.email as string) ?? '',
  username: (r.username as string) ?? undefined,
  passwordHash: r.password_hash as string,
  role: r.role as User['role'],
  accountStatus: r.account_status as User['accountStatus'],
  createdAt: r.created_at as string,
  avatarColor: (r.avatar_color as string) ?? 'bg-blue-500',
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
  if (u.avatarColor   !== undefined) o.avatar_color   = u.avatarColor;
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
  type: r.type as string,
  message: r.message as string,
  relatedSubmissionId: (r.related_submission_id as string) ?? undefined,
  isRead: r.is_read as boolean,
  createdAt: r.created_at as string,
});

const toNotificationDb = (n: Partial<Notification> & { id?: string }) => {
  const o: Record<string, unknown> = {};
  if (n.id                  !== undefined) o.id                    = n.id;
  if (n.type                !== undefined) o.type                  = n.type;
  if (n.message             !== undefined) o.message               = n.message;
  if (n.relatedSubmissionId !== undefined) o.related_submission_id = n.relatedSubmissionId;
  if (n.isRead              !== undefined) o.is_read               = n.isRead;
  if (n.createdAt           !== undefined) o.created_at            = n.createdAt;
  return o;
};

// ─── Storage API ─────────────────────────────────────────────────────────────

export const storage = {
  // ── Users ─────────────────────────────────────────────────────────────────
  getUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase.from('users').select('*').order('created_at');
    if (error) throw error;
    return (data ?? []).map(r => mapUser(r as Record<string, unknown>));
  },

  setUsers: async (users: User[]): Promise<void> => {
    const { error } = await supabase.from('users').upsert(users.map(toUserDb));
    if (error) throw error;
  },

  addUser: async (u: User): Promise<void> => {
    const { error } = await supabase.from('users').insert(toUserDb(u));
    if (error) throw error;
  },

  updateUser: async (id: string, data: Partial<User>): Promise<void> => {
    const { error } = await supabase.from('users').update(toUserDb(data)).eq('id', id);
    if (error) throw error;
  },

  deleteUser: async (id: string): Promise<void> => {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
  },

  // Used by login — find by username OR email (case-insensitive)
  findByIdentifier: async (identifier: string): Promise<User | null> => {
    const lower = identifier.toLowerCase();
    const { data: byUsername } = await supabase
      .from('users').select('*').ilike('username', lower).limit(1);
    if (byUsername?.length) return mapUser(byUsername[0] as Record<string, unknown>);
    const { data: byEmail } = await supabase
      .from('users').select('*').ilike('email', lower).limit(1);
    if (byEmail?.length) return mapUser(byEmail[0] as Record<string, unknown>);
    return null;
  },

  // ── Activities ────────────────────────────────────────────────────────────
  getActivities: async (): Promise<Activity[]> => {
    const { data, error } = await supabase.from('activities').select('*').order('created_at');
    if (error) throw error;
    return (data ?? []).map(r => mapActivity(r as Record<string, unknown>));
  },

  setActivities: async (activities: Activity[]): Promise<void> => {
    const { error } = await supabase.from('activities').upsert(activities.map(toActivityDb));
    if (error) throw error;
  },

  addActivity: async (a: Activity): Promise<void> => {
    const { error } = await supabase.from('activities').insert(toActivityDb(a));
    if (error) throw error;
  },

  updateActivity: async (id: string, data: Partial<Activity>): Promise<void> => {
    const { error } = await supabase.from('activities').update(toActivityDb(data)).eq('id', id);
    if (error) throw error;
  },

  deleteActivity: async (id: string): Promise<void> => {
    const { error } = await supabase.from('activities').delete().eq('id', id);
    if (error) throw error;
  },

  // ── Submissions ───────────────────────────────────────────────────────────
  getSubmissions: async (): Promise<Submission[]> => {
    const { data, error } = await supabase
      .from('submissions').select('*').order('submitted_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(r => mapSubmission(r as Record<string, unknown>));
  },

  addSubmission: async (s: Submission): Promise<void> => {
    const { error } = await supabase.from('submissions').insert(toSubmissionDb(s));
    if (error) throw error;
  },

  updateSubmission: async (id: string, data: Partial<Submission>): Promise<void> => {
    const { error } = await supabase.from('submissions').update(toSubmissionDb(data)).eq('id', id);
    if (error) throw error;
  },

  deleteSubmission: async (id: string): Promise<void> => {
    const { error } = await supabase.from('submissions').delete().eq('id', id);
    if (error) throw error;
  },

  // ── Badges ────────────────────────────────────────────────────────────────
  getBadges: async (): Promise<Badge[]> => {
    const { data, error } = await supabase
      .from('badges').select('*').order('required_points');
    if (error) throw error;
    return (data ?? []).map(r => mapBadge(r as Record<string, unknown>));
  },

  setBadges: async (badges: Badge[]): Promise<void> => {
    const { error } = await supabase.from('badges').upsert(badges.map(toBadgeDb));
    if (error) throw error;
  },

  updateBadge: async (id: string, data: Partial<Badge>): Promise<void> => {
    const { error } = await supabase.from('badges').update(toBadgeDb(data)).eq('id', id);
    if (error) throw error;
  },

  addBadge: async (b: Badge): Promise<void> => {
    const { error } = await supabase.from('badges').insert(toBadgeDb(b));
    if (error) throw error;
  },

  deleteBadge: async (id: string): Promise<void> => {
    const { error } = await supabase.from('badges').delete().eq('id', id);
    if (error) throw error;
  },

  // ── Notifications ─────────────────────────────────────────────────────────
  getNotifications: async (): Promise<Notification[]> => {
    const { data, error } = await supabase
      .from('notifications').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(r => mapNotification(r as Record<string, unknown>));
  },

  addNotification: async (n: Notification): Promise<void> => {
    const { error } = await supabase.from('notifications').insert(toNotificationDb(n));
    if (error) throw error;
  },

  markAllRead: async (): Promise<void> => {
    const { error } = await supabase
      .from('notifications').update({ is_read: true }).eq('is_read', false);
    if (error) throw error;
  },

  // ── Seed check ────────────────────────────────────────────────────────────
  isEmpty: async (): Promise<boolean> => {
    const { count } = await supabase
      .from('users').select('id', { count: 'exact', head: true });
    return (count ?? 0) === 0;
  },
};
