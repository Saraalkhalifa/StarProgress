export type UserRole = 'participant' | 'admin' | 'main_admin';
export type SubmissionStatus = 'pending' | 'accepted' | 'denied';
export type AccountStatus = 'pending' | 'active' | 'denied' | 'suspended' | 'deleted';

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  passwordHash?: string;  // demo mode only — Supabase Auth manages passwords
  role: UserRole;
  accountStatus: AccountStatus;
  createdAt: string;
  avatarColor: string;
  // Extended profile fields
  phoneNumber?: string;
  age?: number;
  dateOfBirth?: string;
  signupMessage?: string;   // optional note on signup (admin reason)
  denialReason?: string;    // filled by Main Admin on denial
  approvedBy?: string;      // user id of approver
  approvedAt?: string;      // ISO timestamp of approval
  // Soft-delete fields
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;       // user id of whoever triggered the soft delete
}

export interface Activity {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  points: number;
  icon: string;
  isActive: boolean;
  createdAt: string;
}

export interface Submission {
  id: string;
  participantId: string;
  activityId: string;
  note: string;
  pointsValueAtSubmission: number;
  status: SubmissionStatus;
  adminComment?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  activity_date?: string;  // YYYY-MM-DD in Asia/Riyadh; set by participant
  sourceType?: 'activity_submission' | 'streak_bonus';
}

export interface Badge {
  id: string;
  name: string;
  nameAr?: string;
  requiredPoints: number;
  icon: string;
  color: string;
  bgColor: string;
}

export interface Notification {
  id: string;
  userId?: string;  // target user; required in Supabase mode (used by RLS)
  type: string;
  message: string;
  relatedSubmissionId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  user: User;
  points: number;
  acceptedCount: number;
  badge: Badge | null;
}
