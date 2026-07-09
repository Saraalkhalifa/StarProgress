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
  // Email verification (synced from auth.users.email_confirmed_at via trigger)
  emailVerifiedAt?: string;
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
  imageUrl?: string;   // public URL (Supabase Storage) or base64 data URL (localStorage mode)
  imagePath?: string;  // Supabase Storage path for deletion; absent in localStorage mode
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

// ── Parent / Guardian System ──────────────────────────────────────────────────

export type RelationshipType = 'father' | 'mother' | 'guardian' | 'older_sibling' | 'relative' | 'other';
export type LinkStatus = 'pending' | 'approved' | 'denied' | 'revoked';
export type AccessRequestStatus = 'pending' | 'approved' | 'denied' | 'more_info_needed' | 'cancelled' | 'revoked';

export interface ParentPermissions {
  viewPoints: boolean;
  viewLevel: boolean;
  viewBadges: boolean;
  viewAnimals: boolean;
  viewApprovedActivities: boolean;
  viewPendingActivities: boolean;
  viewDeniedActivities: boolean;
  viewProofImages: boolean;
  viewRewardRequests: boolean;
  approveRewardRequests: boolean;
  denyRewardRequests: boolean;
  addParentNote: boolean;
  viewRewardHistory: boolean;
  createCustomRewards: boolean;
  receiveEmailMilestone: boolean;
  receiveEmailLevel: boolean;
  receiveEmailBadge: boolean;
  receiveEmailAnimal: boolean;
  receiveEmailReward: boolean;
  receiveEmailPenalty: boolean;
}

export const DEFAULT_PARENT_PERMISSIONS: ParentPermissions = {
  viewPoints: true,
  viewLevel: true,
  viewBadges: true,
  viewAnimals: true,
  viewApprovedActivities: true,
  viewPendingActivities: false,
  viewDeniedActivities: false,
  viewProofImages: false,
  viewRewardRequests: true,
  approveRewardRequests: true,
  denyRewardRequests: true,
  addParentNote: true,
  viewRewardHistory: true,
  createCustomRewards: false,
  receiveEmailMilestone: true,
  receiveEmailLevel: true,
  receiveEmailBadge: true,
  receiveEmailAnimal: false,
  receiveEmailReward: true,
  receiveEmailPenalty: false,
};

export interface ParentChildLink {
  id: string;
  parentId: string;
  participantId: string;
  relationshipType: RelationshipType;
  status: LinkStatus;
  permissions: ParentPermissions;
  requestedBy: 'parent' | 'admin' | 'main_admin';
  approvedBy?: string;
  approvedAt?: string;
  revokedBy?: string;
  revokedAt?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
  // Joined
  parentName?: string;
  participantName?: string;
  participantUsername?: string;
}

export interface ParentAccessRequest {
  id: string;
  parentId: string;
  requestedChildUsername?: string;
  requestedChildCode?: string;
  matchedParticipantId?: string;
  relationshipType: RelationshipType;
  requestMessage?: string;
  status: AccessRequestStatus;
  reviewedBy?: string;
  reviewNote?: string;
  createdAt: string;
  reviewedAt?: string;
  // Joined
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  matchedParticipantName?: string;
  matchedParticipantUsername?: string;
}

export interface ChildConnectionCode {
  id: string;
  participantId: string;
  code: string;
  status: 'active' | 'used' | 'expired' | 'revoked';
  expiresAt?: string;
  createdAt: string;
  createdBy?: string;
}
