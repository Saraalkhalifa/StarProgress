import type { Submission } from '../types';
import type { DailyWinner, TopStreak, StreakBonus, StreakSettings, StreakRule, ParticipantStreakRecord, StreakRewardRecord, StreakMilestoneConfig } from '../types/streak';
import { generateId } from './utils';

// Asia/Riyadh = UTC+3
const RIYADH_OFFSET_MS = 3 * 60 * 60 * 1000;

export function toRiyadhDate(isoString: string): string {
  const utc = new Date(isoString).getTime();
  return new Date(utc + RIYADH_OFFSET_MS).toISOString().slice(0, 10);
}

export function getTodayRiyadh(): string {
  return toRiyadhDate(new Date().toISOString());
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function isConsecutive(earlier: string, later: string): boolean {
  return addDays(earlier, 1) === later;
}

// Returns the YYYY-MM-DD to use for a submission's "activity day".
// Prefers activity_date, falls back to reviewedAt, then submittedAt.
function submissionDate(s: Submission): string {
  if (s.activity_date) return s.activity_date;
  if (s.reviewedAt) return toRiyadhDate(s.reviewedAt);
  return toRiyadhDate(s.submittedAt);
}

// ── Daily Winner Calculation ──────────────────────────────────────────────────

export function calculateDailyWinners(submissions: Submission[]): DailyWinner[] {
  // Only accepted, non-streak-bonus submissions count for daily winner
  const accepted = submissions.filter(
    s => s.status === 'accepted' && s.sourceType !== 'streak_bonus',
  );

  // Collect all unique dates
  const dates = [...new Set(accepted.map(submissionDate))].sort();

  const winners: DailyWinner[] = [];

  for (const date of dates) {
    const daySubmissions = accepted.filter(s => submissionDate(s) === date);

    // Group by participant: sum points, track earliest accepted time
    const byParticipant = new Map<string, { points: number; earliestAccepted: string }>();
    for (const s of daySubmissions) {
      const acceptedAt = s.reviewedAt ?? s.submittedAt;
      const existing = byParticipant.get(s.participantId);
      if (!existing) {
        byParticipant.set(s.participantId, { points: s.pointsValueAtSubmission, earliestAccepted: acceptedAt });
      } else {
        existing.points += s.pointsValueAtSubmission;
        if (acceptedAt < existing.earliestAccepted) existing.earliestAccepted = acceptedAt;
      }
    }

    if (!byParticipant.size) continue;

    // Find winner: most points; tie-break → earliest accepted time
    let winnerId = '';
    let winnerPoints = 0;
    let winnerEarliest = '';

    for (const [id, data] of byParticipant) {
      if (
        data.points > winnerPoints ||
        (data.points === winnerPoints && data.earliestAccepted < winnerEarliest)
      ) {
        winnerId = id;
        winnerPoints = data.points;
        winnerEarliest = data.earliestAccepted;
      }
    }

    winners.push({ date, winnerId, points: winnerPoints, determinedAt: new Date().toISOString() });
  }

  return winners;
}

// ── Streak Calculation ────────────────────────────────────────────────────────

export function calculateStreaks(
  dailyWinners: DailyWinner[],
  participantIds: string[],
): TopStreak[] {
  const sorted = [...dailyWinners].sort((a, b) => a.date.localeCompare(b.date));
  const today = getTodayRiyadh();
  const yesterday = addDays(today, -1);

  return participantIds.map(participantId => {
    const winDates = sorted
      .filter(w => w.winnerId === participantId)
      .map(w => w.date);

    if (winDates.length === 0) {
      return {
        participantId,
        currentStreak: 0,
        bestStreak: 0,
        lastWinDate: '',
        streakStartDate: '',
        updatedAt: new Date().toISOString(),
      };
    }

    // Walk through win dates to find best + current run
    let bestStreak = 1;
    let currentRun = 1;
    let currentRunStart = winDates[0];

    for (let i = 1; i < winDates.length; i++) {
      if (isConsecutive(winDates[i - 1], winDates[i])) {
        currentRun++;
        if (currentRun > bestStreak) {
          bestStreak = currentRun;
        }
      } else {
        currentRun = 1;
        currentRunStart = winDates[i];
      }
    }

    const lastWin = winDates[winDates.length - 1];
    const isAlive = lastWin === today || lastWin === yesterday;

    return {
      participantId,
      currentStreak: isAlive ? currentRun : 0,
      bestStreak,
      lastWinDate: lastWin,
      streakStartDate: isAlive ? currentRunStart : '',
      updatedAt: new Date().toISOString(),
    };
  });
}

// ── Bonus Calculation ─────────────────────────────────────────────────────────

export function findNewBonuses(
  streaks: TopStreak[],
  existingBonuses: StreakBonus[],
  settings: StreakSettings,
): Omit<StreakBonus, 'submissionId'>[] {
  if (!settings.enabled || settings.streakLengthForBonus <= 0) return [];

  const result: Omit<StreakBonus, 'submissionId'>[] = [];

  for (const streak of streaks) {
    if (streak.currentStreak === 0 || !streak.streakStartDate) continue;

    const milestonesEarned = Math.floor(streak.currentStreak / settings.streakLengthForBonus);

    for (let m = 1; m <= milestonesEarned; m++) {
      const milestone = m * settings.streakLengthForBonus;

      const alreadyAwarded = existingBonuses.some(
        b =>
          b.participantId === streak.participantId &&
          b.streakMilestone === milestone &&
          b.streakStartDate === streak.streakStartDate,
      );

      if (!alreadyAwarded) {
        result.push({
          id: `streak-bonus-${streak.participantId}-${milestone}-${streak.streakStartDate}`,
          participantId: streak.participantId,
          streakMilestone: milestone,
          streakStartDate: streak.streakStartDate,
          bonusPoints: settings.bonusPoints,
          awardedAt: new Date().toISOString(),
        });
      }
    }
  }

  return result;
}

// ── New multi-rule streak engine ──────────────────────────────────────────────

function daysBetween(earlier: string, later: string): number {
  const e = new Date(earlier + 'T00:00:00Z').getTime();
  const l = new Date(later   + 'T00:00:00Z').getTime();
  return Math.round((l - e) / (24 * 60 * 60 * 1000));
}

/**
 * Compute a single participant's streak for a given rule.
 * Pure function: given submissions + rule + existing record, returns new record.
 */
export function calculateActivityBasedStreak(
  submissions: Submission[],
  rule: StreakRule,
  existingRecord: ParticipantStreakRecord | null,
  participantId: string,
): ParticipantStreakRecord {
  const today = getTodayRiyadh();

  // Filter to qualifying submissions for this participant + rule
  const qualifying = submissions.filter(s => {
    if (s.participantId !== participantId) return false;
    if (s.sourceType === 'streak_bonus') return false;
    if (rule.requireApproved && s.status !== 'accepted') return false;
    if (rule.type === 'specific_activities' && !rule.activityIds.includes(s.activityId)) return false;
    return true;
  });

  // Unique qualifying dates (multiple submissions on same day = still 1 streak day)
  const uniqueDates = [...new Set(
    qualifying.map(s => s.activity_date ?? toRiyadhDate(s.submittedAt))
  )].sort();

  if (uniqueDates.length === 0) {
    return {
      id: existingRecord?.id ?? generateId(),
      participantId,
      ruleId: rule.id,
      currentStreak: 0,
      bestStreak: existingRecord?.bestStreak ?? 0,
      lastActivityDate: '',
      streakStartDate: '',
      graceDaysUsed: 0,
      updatedAt: new Date().toISOString(),
    };
  }

  // Walk dates to compute streaks, respecting grace days
  let bestStreak = 1;
  let currentRun = 1;
  let currentRunStart = uniqueDates[0];
  let graceDaysInRun = 0;

  for (let i = 1; i < uniqueDates.length; i++) {
    const gap = daysBetween(uniqueDates[i - 1], uniqueDates[i]);

    if (gap === 1) {
      currentRun++;
      if (currentRun > bestStreak) bestStreak = currentRun;
    } else if (gap === 2 && rule.graceDaysEnabled && graceDaysInRun < rule.graceDaysAllowed) {
      currentRun++;
      graceDaysInRun++;
      if (currentRun > bestStreak) bestStreak = currentRun;
    } else {
      currentRun = 1;
      currentRunStart = uniqueDates[i];
      graceDaysInRun = 0;
    }
  }

  const lastDate = uniqueDates[uniqueDates.length - 1];
  const gapFromToday = daysBetween(lastDate, today);

  // Alive if last qualifying date was today or yesterday,
  // OR if a grace day can bridge a 2-day gap from today.
  const isAlive =
    gapFromToday <= 1 ||
    (rule.graceDaysEnabled && graceDaysInRun < rule.graceDaysAllowed && gapFromToday === 2);

  const previousBest = existingRecord?.bestStreak ?? 0;

  return {
    id: existingRecord?.id ?? generateId(),
    participantId,
    ruleId: rule.id,
    currentStreak: isAlive ? currentRun : 0,
    bestStreak: Math.max(previousBest, isAlive ? currentRun : 0, bestStreak),
    lastActivityDate: lastDate,
    streakStartDate: isAlive ? currentRunStart : '',
    graceDaysUsed: isAlive ? graceDaysInRun : 0,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Find milestone rewards that should be issued for a participant's streak record,
 * filtering out ones already awarded.
 */
export function findNewMilestoneRewards(
  record: ParticipantStreakRecord,
  rule: StreakRule,
  alreadyAwarded: (milestoneDay: number, streakStartDate: string) => boolean,
): Array<Omit<StreakRewardRecord, 'id' | 'submissionId'>> {
  if (record.currentStreak === 0 || !record.streakStartDate) return [];

  const sortedMilestones = [...rule.milestones].sort((a, b) => a.daysRequired - b.daysRequired);
  const result: Array<Omit<StreakRewardRecord, 'id' | 'submissionId'>> = [];

  for (const m of sortedMilestones) {
    if (record.currentStreak < m.daysRequired) break;
    if (!alreadyAwarded(m.daysRequired, record.streakStartDate)) {
      result.push({
        participantId: record.participantId,
        ruleId: rule.id,
        milestoneDays: m.daysRequired,
        streakStartDate: record.streakStartDate,
        bonusPoints: m.bonusPoints,
        awardedAt: new Date().toISOString(),
      });
    }
  }

  return result;
}

/** Returns true if the participant has completed today's requirement for the rule. */
export function isTodayCompleted(
  submissions: Submission[],
  participantId: string,
  rule: StreakRule,
): boolean {
  const today = getTodayRiyadh();
  return submissions.some(s => {
    if (s.participantId !== participantId) return false;
    if (s.sourceType === 'streak_bonus') return false;
    if (rule.requireApproved && s.status !== 'accepted') return false;
    if (rule.type === 'specific_activities' && !rule.activityIds.includes(s.activityId)) return false;
    return (s.activity_date ?? toRiyadhDate(s.submittedAt)) === today;
  });
}

/** Returns the next unclaimed milestone for the participant's current streak. */
export function getNextMilestone(
  currentStreak: number,
  record: ParticipantStreakRecord,
  rule: StreakRule,
  alreadyAwarded: (milestoneDay: number, streakStartDate: string) => boolean,
): StreakMilestoneConfig | null {
  const sorted = [...rule.milestones].sort((a, b) => a.daysRequired - b.daysRequired);
  return sorted.find(m =>
    m.daysRequired > currentStreak ||
    (m.daysRequired <= currentStreak && !alreadyAwarded(m.daysRequired, record.streakStartDate))
  ) ?? null;
}
