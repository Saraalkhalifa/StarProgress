export type UserRole = 'participant' | 'admin' | 'main_admin' | 'parent';
export type SubmissionStatus = 'pending' | 'accepted' | 'denied' | 'flagged' | 'needs_info';
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
  signupMessage?: string;
  denialReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  // Soft-delete fields
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  // Parent-child link (for participants: optional parent email/id)
  parentEmail?: string;
  parentUserId?: string;
}

export interface HeroLevel {
  level: number;
  name: string;
  nameAr?: string;
  pointsRequired: number;
  color: string;
  icon: string;
}

export interface RewardType {
  id: string;
  name: string;
  description?: string;
  pointCost: number;
  costType: 'fixed' | 'per_hour';
  maxDuration?: number;
  isActive: boolean;
  createdAt: string;
}

export interface RewardRequest {
  id: string;
  participantId: string;
  participantName?: string;
  parentId?: string;
  parentEmail?: string;
  rewardTypeId: string;
  rewardName?: string;
  requestedDuration?: number;
  totalPointsRequired: number;
  childMessage?: string;
  status: 'pending' | 'approved' | 'denied' | 'cancelled';
  parentNote?: string;
  requestedAt: string;
  decidedAt?: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  authorId: string;
  authorName?: string;
  isActive: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface Activity {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  descriptionPrompt?: string;
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
  activity_date?: string;
  sourceType?: 'activity_submission' | 'streak_bonus';
  isFlagged?: boolean;
  flagNote?: string;
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
  userId?: string;
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
