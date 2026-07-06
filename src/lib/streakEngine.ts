import type { Submission } from '../types';
import type { DailyWinner, TopStreak, StreakBonus, StreakSettings } from '../types/streak';

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
