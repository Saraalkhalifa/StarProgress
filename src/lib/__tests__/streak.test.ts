import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  toRiyadhDate,
  calculateDailyWinners,
  calculateStreaks,
  findNewBonuses,
} from '../streakEngine';
import type { Submission } from '../../types';
import type { StreakBonus, StreakSettings } from '../../types/streak';

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeSub(
  overrides: Partial<Submission> & { participantId: string; activity_date: string; points?: number },
): Submission {
  return {
    id: `sub-${Math.random()}`,
    participantId: overrides.participantId,
    activityId: 'act-1',
    note: 'test',
    pointsValueAtSubmission: overrides.points ?? 10,
    status: 'accepted',
    submittedAt: `${overrides.activity_date}T10:00:00Z`,
    reviewedAt: `${overrides.activity_date}T12:00:00Z`,
    activity_date: overrides.activity_date,
    sourceType: 'activity_submission',
    ...overrides,
  };
}

const DEFAULT_SETTINGS: StreakSettings = {
  enabled: true,
  streakLengthForBonus: 7,
  bonusPoints: 30,
  updatedAt: '2026-01-01T00:00:00Z',
};

// ── toRiyadhDate ───────────────────────────────────────────────────────────────

describe('toRiyadhDate', () => {
  it('converts UTC midnight to Riyadh date (UTC+3)', () => {
    // 2026-07-05T00:00:00Z = 2026-07-05T03:00:00 Riyadh → date is 2026-07-05
    expect(toRiyadhDate('2026-07-05T00:00:00Z')).toBe('2026-07-05');
  });

  it('converts UTC 22:00 to next Riyadh date', () => {
    // 2026-07-04T22:00:00Z = 2026-07-05T01:00:00 Riyadh → date is 2026-07-05
    expect(toRiyadhDate('2026-07-04T22:00:00Z')).toBe('2026-07-05');
  });

  it('keeps same date when UTC time is already in Riyadh day', () => {
    expect(toRiyadhDate('2026-07-05T10:00:00Z')).toBe('2026-07-05');
  });
});

// ── calculateDailyWinners ──────────────────────────────────────────────────────

describe('calculateDailyWinners', () => {
  it('returns empty array when no accepted submissions', () => {
    const subs = [
      { ...makeSub({ participantId: 'p1', activity_date: '2026-07-01' }), status: 'pending' as const },
    ];
    expect(calculateDailyWinners(subs)).toHaveLength(0);
  });

  it('determines winner for a single participant', () => {
    const subs = [
      makeSub({ participantId: 'p1', activity_date: '2026-07-01', points: 20 }),
    ];
    const winners = calculateDailyWinners(subs);
    expect(winners).toHaveLength(1);
    expect(winners[0]).toMatchObject({ date: '2026-07-01', winnerId: 'p1', points: 20 });
  });

  it('sums multiple submissions for the same participant on same day', () => {
    const subs = [
      makeSub({ participantId: 'p1', activity_date: '2026-07-01', points: 15 }),
      makeSub({ participantId: 'p1', activity_date: '2026-07-01', points: 10 }),
    ];
    const winners = calculateDailyWinners(subs);
    expect(winners[0]).toMatchObject({ winnerId: 'p1', points: 25 });
  });

  it('picks participant with more points on a given day', () => {
    const subs = [
      makeSub({ participantId: 'p1', activity_date: '2026-07-01', points: 10 }),
      makeSub({ participantId: 'p2', activity_date: '2026-07-01', points: 20 }),
    ];
    const winners = calculateDailyWinners(subs);
    expect(winners[0].winnerId).toBe('p2');
    expect(winners[0].points).toBe(20);
  });

  it('tie-break: earliest accepted submission wins', () => {
    const subs: Submission[] = [
      {
        ...makeSub({ participantId: 'p1', activity_date: '2026-07-01', points: 20 }),
        reviewedAt: '2026-07-01T15:00:00Z',
      },
      {
        ...makeSub({ participantId: 'p2', activity_date: '2026-07-01', points: 20 }),
        reviewedAt: '2026-07-01T12:00:00Z',
      },
    ];
    const winners = calculateDailyWinners(subs);
    expect(winners[0].winnerId).toBe('p2');
  });

  it('excludes streak bonus submissions from daily winner calculation', () => {
    const subs: Submission[] = [
      makeSub({ participantId: 'p2', activity_date: '2026-07-01', points: 10 }),
      {
        ...makeSub({ participantId: 'p1', activity_date: '2026-07-01', points: 30 }),
        sourceType: 'streak_bonus' as const,
      },
    ];
    const winners = calculateDailyWinners(subs);
    expect(winners[0].winnerId).toBe('p2');
  });

  it('handles multiple dates correctly', () => {
    const subs = [
      makeSub({ participantId: 'p1', activity_date: '2026-07-01', points: 20 }),
      makeSub({ participantId: 'p2', activity_date: '2026-07-02', points: 15 }),
    ];
    const winners = calculateDailyWinners(subs);
    expect(winners).toHaveLength(2);
    const d1 = winners.find(w => w.date === '2026-07-01');
    const d2 = winners.find(w => w.date === '2026-07-02');
    expect(d1?.winnerId).toBe('p1');
    expect(d2?.winnerId).toBe('p2');
  });
});

// ── calculateStreaks ───────────────────────────────────────────────────────────

describe('calculateStreaks', () => {
  beforeEach(() => {
    // Mock today = 2026-07-06 (Monday)
    vi.setSystemTime(new Date('2026-07-06T10:00:00Z'));
  });

  it('returns zero streak for participant with no wins', () => {
    const streaks = calculateStreaks([], ['p1']);
    expect(streaks[0]).toMatchObject({ participantId: 'p1', currentStreak: 0, bestStreak: 0 });
  });

  it('counts consecutive daily wins as a streak', () => {
    const winners = [
      { date: '2026-07-04', winnerId: 'p1', points: 20, determinedAt: '' },
      { date: '2026-07-05', winnerId: 'p1', points: 20, determinedAt: '' },
      { date: '2026-07-06', winnerId: 'p1', points: 20, determinedAt: '' },
    ];
    const streaks = calculateStreaks(winners, ['p1']);
    expect(streaks[0].currentStreak).toBe(3);
    expect(streaks[0].bestStreak).toBe(3);
  });

  it('streak is alive if last win was yesterday', () => {
    const winners = [
      { date: '2026-07-04', winnerId: 'p1', points: 20, determinedAt: '' },
      { date: '2026-07-05', winnerId: 'p1', points: 20, determinedAt: '' }, // yesterday
    ];
    const streaks = calculateStreaks(winners, ['p1']);
    expect(streaks[0].currentStreak).toBe(2);
  });

  it('streak breaks if gap > 1 day', () => {
    const winners = [
      { date: '2026-07-01', winnerId: 'p1', points: 20, determinedAt: '' },
      { date: '2026-07-03', winnerId: 'p1', points: 20, determinedAt: '' }, // skip July 2
      { date: '2026-07-05', winnerId: 'p1', points: 20, determinedAt: '' }, // yesterday
    ];
    const streaks = calculateStreaks(winners, ['p1']);
    expect(streaks[0].currentStreak).toBe(1);
    expect(streaks[0].bestStreak).toBe(1);
  });

  it('currentStreak is 0 if last win was more than 1 day ago', () => {
    const winners = [
      { date: '2026-07-01', winnerId: 'p1', points: 20, determinedAt: '' },
      { date: '2026-07-02', winnerId: 'p1', points: 20, determinedAt: '' },
      { date: '2026-07-03', winnerId: 'p1', points: 20, determinedAt: '' }, // 3 days ago
    ];
    const streaks = calculateStreaks(winners, ['p1']);
    expect(streaks[0].currentStreak).toBe(0);
    expect(streaks[0].bestStreak).toBe(3);
  });

  it('tracks best streak independently from current streak', () => {
    const winners = [
      // old streak of 5
      { date: '2026-06-20', winnerId: 'p1', points: 20, determinedAt: '' },
      { date: '2026-06-21', winnerId: 'p1', points: 20, determinedAt: '' },
      { date: '2026-06-22', winnerId: 'p1', points: 20, determinedAt: '' },
      { date: '2026-06-23', winnerId: 'p1', points: 20, determinedAt: '' },
      { date: '2026-06-24', winnerId: 'p1', points: 20, determinedAt: '' },
      // gap
      // new streak of 2
      { date: '2026-07-05', winnerId: 'p1', points: 20, determinedAt: '' }, // yesterday
      { date: '2026-07-06', winnerId: 'p1', points: 20, determinedAt: '' }, // today
    ];
    const streaks = calculateStreaks(winners, ['p1']);
    expect(streaks[0].currentStreak).toBe(2);
    expect(streaks[0].bestStreak).toBe(5);
  });

  it('handles multiple participants independently', () => {
    const winners = [
      { date: '2026-07-05', winnerId: 'p1', points: 20, determinedAt: '' },
      { date: '2026-07-06', winnerId: 'p2', points: 30, determinedAt: '' },
    ];
    const streaks = calculateStreaks(winners, ['p1', 'p2']);
    const s1 = streaks.find(s => s.participantId === 'p1')!;
    const s2 = streaks.find(s => s.participantId === 'p2')!;
    expect(s1.currentStreak).toBe(1);
    expect(s2.currentStreak).toBe(1);
  });
});

// ── findNewBonuses ─────────────────────────────────────────────────────────────

describe('findNewBonuses', () => {
  it('returns empty when settings disabled', () => {
    const streaks = [{ participantId: 'p1', currentStreak: 7, bestStreak: 7, lastWinDate: '2026-07-06', streakStartDate: '2026-06-30', updatedAt: '' }];
    const result = findNewBonuses(streaks, [], { ...DEFAULT_SETTINGS, enabled: false });
    expect(result).toHaveLength(0);
  });

  it('awards bonus at streak milestone', () => {
    const streaks = [{ participantId: 'p1', currentStreak: 7, bestStreak: 7, lastWinDate: '2026-07-06', streakStartDate: '2026-06-30', updatedAt: '' }];
    const result = findNewBonuses(streaks, [], DEFAULT_SETTINGS);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ participantId: 'p1', streakMilestone: 7, bonusPoints: 30 });
  });

  it('awards multiple bonuses for long streaks', () => {
    const streaks = [{ participantId: 'p1', currentStreak: 14, bestStreak: 14, lastWinDate: '2026-07-13', streakStartDate: '2026-06-30', updatedAt: '' }];
    const result = findNewBonuses(streaks, [], DEFAULT_SETTINGS);
    expect(result).toHaveLength(2);
    const milestones = result.map(r => r.streakMilestone).sort((a, b) => a - b);
    expect(milestones).toEqual([7, 14]);
  });

  it('does not re-award already earned bonus', () => {
    const streaks = [{ participantId: 'p1', currentStreak: 7, bestStreak: 7, lastWinDate: '2026-07-06', streakStartDate: '2026-06-30', updatedAt: '' }];
    const existing: StreakBonus[] = [{
      id: 'b1', participantId: 'p1', streakMilestone: 7,
      streakStartDate: '2026-06-30', bonusPoints: 30, submissionId: 'sub-x',
      awardedAt: '2026-07-06T12:00:00Z',
    }];
    const result = findNewBonuses(streaks, existing, DEFAULT_SETTINGS);
    expect(result).toHaveLength(0);
  });

  it('awards bonus again after streak reset and rebuild', () => {
    const streaks = [{ participantId: 'p1', currentStreak: 7, bestStreak: 14, lastWinDate: '2026-07-06', streakStartDate: '2026-06-30', updatedAt: '' }];
    // Old bonus from a DIFFERENT streak start
    const existing: StreakBonus[] = [{
      id: 'b1', participantId: 'p1', streakMilestone: 7,
      streakStartDate: '2026-06-01', // different start date
      bonusPoints: 30, submissionId: 'sub-x',
      awardedAt: '2026-06-07T12:00:00Z',
    }];
    const result = findNewBonuses(streaks, existing, DEFAULT_SETTINGS);
    expect(result).toHaveLength(1);
    expect(result[0].streakStartDate).toBe('2026-06-30');
  });

  it('returns no bonus when streak < milestone', () => {
    const streaks = [{ participantId: 'p1', currentStreak: 5, bestStreak: 5, lastWinDate: '2026-07-06', streakStartDate: '2026-07-02', updatedAt: '' }];
    const result = findNewBonuses(streaks, [], DEFAULT_SETTINGS);
    expect(result).toHaveLength(0);
  });

  it('returns nothing for participant with zero streak', () => {
    const streaks = [{ participantId: 'p1', currentStreak: 0, bestStreak: 7, lastWinDate: '2026-06-30', streakStartDate: '', updatedAt: '' }];
    const result = findNewBonuses(streaks, [], DEFAULT_SETTINGS);
    expect(result).toHaveLength(0);
  });

  it('respects custom streakLengthForBonus', () => {
    const streaks = [{ participantId: 'p1', currentStreak: 3, bestStreak: 3, lastWinDate: '2026-07-06', streakStartDate: '2026-07-04', updatedAt: '' }];
    const settings = { ...DEFAULT_SETTINGS, streakLengthForBonus: 3 };
    const result = findNewBonuses(streaks, [], settings);
    expect(result).toHaveLength(1);
    expect(result[0].streakMilestone).toBe(3);
  });
});
