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
