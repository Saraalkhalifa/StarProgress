// ── Legacy types (kept for backward compatibility with existing localStorage data) ──

export interface DailyWinner {
  date: string;          // YYYY-MM-DD (Asia/Riyadh)
  winnerId: string;
  points: number;
  determinedAt: string;  // ISO timestamp
}

export interface TopStreak {
  participantId: string;
  currentStreak: number;    // consecutive days at top (0 if broken)
  bestStreak: number;       // all-time best
  lastWinDate: string;      // YYYY-MM-DD or ''
  streakStartDate: string;  // start of current active streak or ''
  updatedAt: string;
}

export interface StreakBonus {
  id: string;
  participantId: string;
  streakMilestone: number;  // 7, 14, 21, ...
  streakStartDate: string;  // identifies which streak run earned this
  bonusPoints: number;
  submissionId: string;
  awardedAt: string;
}

export interface StreakSettings {
  enabled: boolean;
  streakLengthForBonus: number;  // default 7
  bonusPoints: number;           // default 30
  updatedAt: string;
}

// ── New multi-rule streak system ──────────────────────────────────────────────

export type StreakRuleType = 'daily_action' | 'specific_activities' | 'top_hero';

export interface StreakMilestoneConfig {
  id: string;
  ruleId: string;
  daysRequired: number;
  bonusPoints: number;
  badgeId?: string;
}

export interface StreakRule {
  id: string;
  name: string;
  description: string;
  type: StreakRuleType;
  /** Activity IDs that qualify (used when type = 'specific_activities'; empty = all activities for daily_action) */
  activityIds: string[];
  /** Only admin-approved activities count (recommended: true) */
  requireApproved: boolean;
  graceDaysEnabled: boolean;
  graceDaysAllowed: number;
  /** A confirmed-cheating penalty can reset this streak */
  cheatPenaltyBreaks: boolean;
  /** Multiple submissions on same day still count as exactly 1 streak day */
  duplicateDaysAllowed: boolean;
  isActive: boolean;
  milestones: StreakMilestoneConfig[];
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParticipantStreakRecord {
  id: string;
  participantId: string;
  ruleId: string;
  currentStreak: number;
  bestStreak: number;
  lastActivityDate: string;   // YYYY-MM-DD
  streakStartDate: string;    // YYYY-MM-DD
  graceDaysUsed: number;
  updatedAt: string;
}

export interface StreakRewardRecord {
  id: string;
  participantId: string;
  ruleId: string;
  milestoneDays: number;
  streakStartDate: string;
  bonusPoints: number;
  submissionId: string;
  awardedAt: string;
}

export interface StreakAuditLog {
  id: string;
  participantId: string;
  ruleId: string;
  action: 'manual_adjust' | 'manual_reset' | 'reward_reversed' | 'grace_used' | 'penalty_applied';
  oldValue: number;
  newValue: number;
  reason: string;
  performedBy: string;
  performedByName?: string;
  createdAt: string;
}
