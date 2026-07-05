export type UserRole = 'participant' | 'admin' | 'main_admin';
export type SubmissionStatus = 'pending' | 'accepted' | 'denied';
export type AccountStatus = 'pending' | 'active' | 'denied';

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  passwordHash: string;
  role: UserRole;
  accountStatus: AccountStatus;  // 'active' for normal use; 'pending' while awaiting approval
  createdAt: string;
  avatarColor: string;
}

export interface Activity {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
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
}

export interface Badge {
  id: string;
  name: string;
  requiredPoints: number;
  icon: string;
  color: string;
  bgColor: string;
}

export interface Notification {
  id: string;
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
