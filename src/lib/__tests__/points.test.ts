import { describe, it, expect, beforeEach } from 'vitest';
import type { Submission, Badge } from '../../types';
import { simpleHash } from '../utils';

// ── Pure logic helpers (mirroring DataContext) ──────────────────────────────

function getAcceptedPoints(submissions: Submission[], userId: string): number {
  return submissions
    .filter(s => s.participantId === userId && s.status === 'accepted')
    .reduce((sum, s) => sum + s.pointsValueAtSubmission, 0);
}

function getMonthlyPoints(submissions: Submission[], userId: string, month: number, year: number): number {
  return submissions
    .filter(s => {
      if (s.participantId !== userId || s.status !== 'accepted') return false;
      const d = new Date(s.submittedAt);
      return d.getMonth() === month && d.getFullYear() === year;
    })
    .reduce((sum, s) => sum + s.pointsValueAtSubmission, 0);
}

function getYearlyPoints(submissions: Submission[], userId: string, year: number): number {
  return submissions
    .filter(s => {
      if (s.participantId !== userId || s.status !== 'accepted') return false;
      return new Date(s.submittedAt).getFullYear() === year;
    })
    .reduce((sum, s) => sum + s.pointsValueAtSubmission, 0);
}

function getBadgeForPoints(badges: Badge[], points: number): Badge | null {
  const sorted = [...badges].sort((a, b) => a.requiredPoints - b.requiredPoints);
  let current: Badge | null = null;
  for (const b of sorted) {
    if (points >= b.requiredPoints) current = b;
  }
  return current;
}

// ── Test data fixtures ─────────────────────────────────────────────────────

const makeSubmission = (
  id: string,
  participantId: string,
  status: 'pending' | 'accepted' | 'denied',
  points: number,
  dateStr: string
): Submission => ({
  id,
  participantId,
  activityId: 'a1',
  note: 'test',
  pointsValueAtSubmission: points,
  status,
  submittedAt: dateStr,
});

const BADGES: Badge[] = [
  { id: 'b1', name: 'Beginner',    requiredPoints: 50,   icon: '🌱', color: '', bgColor: '' },
  { id: 'b2', name: 'Rising Star', requiredPoints: 150,  icon: '⭐', color: '', bgColor: '' },
  { id: 'b3', name: 'Champion',    requiredPoints: 600,  icon: '🏆', color: '', bgColor: '' },
  { id: 'b4', name: 'Legend',      requiredPoints: 1500, icon: '👑', color: '', bgColor: '' },
];

let submissions: Submission[];

beforeEach(() => {
  submissions = [
    makeSubmission('s1', 'u1', 'accepted', 15, '2026-06-10T10:00:00.000Z'),
    makeSubmission('s2', 'u1', 'accepted', 10, '2026-06-15T10:00:00.000Z'),
    makeSubmission('s3', 'u1', 'pending',  15, '2026-06-20T10:00:00.000Z'),  // pending — excluded
    makeSubmission('s4', 'u1', 'denied',   8,  '2026-06-22T10:00:00.000Z'),  // denied  — excluded
    makeSubmission('s5', 'u1', 'accepted', 5,  '2026-05-05T10:00:00.000Z'),  // different month
    makeSubmission('s6', 'u2', 'accepted', 50, '2026-06-01T10:00:00.000Z'),  // different user
  ];
});

// ── getAcceptedPoints ──────────────────────────────────────────────────────

describe('getAcceptedPoints', () => {
  it('sums only accepted submissions for the target user', () => {
    // u1: s1(15) + s2(10) + s5(5) = 30   (s3 pending, s4 denied excluded)
    expect(getAcceptedPoints(submissions, 'u1')).toBe(30);
  });

  it('returns 0 for a user with no submissions', () => {
    expect(getAcceptedPoints(submissions, 'u_unknown')).toBe(0);
  });

  it('does not include other users points', () => {
    // u2 has 50 pts but u1 should not include them
    expect(getAcceptedPoints(submissions, 'u1')).not.toBe(80);
  });

  it('pending submission does not add points', () => {
    const pending = submissions.filter(s => s.id === 's3');
    expect(getAcceptedPoints(pending, 'u1')).toBe(0);
  });

  it('denied submission does not add points', () => {
    const denied = submissions.filter(s => s.id === 's4');
    expect(getAcceptedPoints(denied, 'u1')).toBe(0);
  });
});

// ── getMonthlyPoints ───────────────────────────────────────────────────────

describe('getMonthlyPoints', () => {
  it('sums only accepted submissions in the given month/year', () => {
    // June 2026 (month = 5 in JS 0-indexed): s1(15) + s2(10) = 25
    expect(getMonthlyPoints(submissions, 'u1', 5, 2026)).toBe(25);
  });

  it('excludes submissions from a different month', () => {
    // May 2026 (month = 4): only s5(5)
    expect(getMonthlyPoints(submissions, 'u1', 4, 2026)).toBe(5);
  });

  it('returns 0 for a month with no accepted submissions', () => {
    expect(getMonthlyPoints(submissions, 'u1', 0, 2026)).toBe(0);
  });

  it('excludes pending and denied submissions', () => {
    // s3(pending) and s4(denied) are both in June 2026 but must be excluded
    const junePoints = getMonthlyPoints(submissions, 'u1', 5, 2026);
    expect(junePoints).toBe(25); // not 48 (25+15+8)
  });
});

// ── getYearlyPoints ────────────────────────────────────────────────────────

describe('getYearlyPoints', () => {
  it('sums all accepted submissions for the year', () => {
    // 2026: s1(15) + s2(10) + s5(5) = 30
    expect(getYearlyPoints(submissions, 'u1', 2026)).toBe(30);
  });

  it('returns 0 for a different year', () => {
    expect(getYearlyPoints(submissions, 'u1', 2025)).toBe(0);
  });

  it('excludes pending and denied for yearly total', () => {
    const yearlyPoints = getYearlyPoints(submissions, 'u1', 2026);
    expect(yearlyPoints).toBe(30); // not 53 (30+15+8)
  });
});

// ── getBadgeForPoints ──────────────────────────────────────────────────────

describe('getBadgeForPoints', () => {
  it('returns null when below lowest badge threshold', () => {
    expect(getBadgeForPoints(BADGES, 0)).toBeNull();
    expect(getBadgeForPoints(BADGES, 49)).toBeNull();
  });

  it('awards Beginner at exactly 50 points', () => {
    expect(getBadgeForPoints(BADGES, 50)?.name).toBe('Beginner');
  });

  it('awards Rising Star at 150 points', () => {
    expect(getBadgeForPoints(BADGES, 150)?.name).toBe('Rising Star');
  });

  it('awards highest qualifying badge (Champion at 600)', () => {
    expect(getBadgeForPoints(BADGES, 600)?.name).toBe('Champion');
    expect(getBadgeForPoints(BADGES, 1499)?.name).toBe('Champion');
  });

  it('awards Legend at 1500 points', () => {
    expect(getBadgeForPoints(BADGES, 1500)?.name).toBe('Legend');
    expect(getBadgeForPoints(BADGES, 9999)?.name).toBe('Legend');
  });
});

// ── Leaderboard ranking ────────────────────────────────────────────────────

describe('leaderboard ranking logic', () => {
  it('ranks users by accepted points descending', () => {
    // u2 has 50 pts, u1 has 30 pts → u2 ranks first
    const u1pts = getAcceptedPoints(submissions, 'u1');
    const u2pts = getAcceptedPoints(submissions, 'u2');
    expect(u2pts).toBeGreaterThan(u1pts);
  });
});

// ── simpleHash ─────────────────────────────────────────────────────────────

describe('simpleHash', () => {
  it('is deterministic for the same input', () => {
    expect(simpleHash('MainAdmin@2026')).toBe(simpleHash('MainAdmin@2026'));
  });

  it('produces different hashes for different inputs', () => {
    expect(simpleHash('Admin@2026')).not.toBe(simpleHash('MainAdmin@2026'));
    expect(simpleHash('Sara@2026')).not.toBe(simpleHash('ali@2026'));
  });

  it('returns a non-empty hex string', () => {
    const h = simpleHash('test');
    expect(h).toBeTruthy();
    expect(/^[0-9a-f]+$/.test(h)).toBe(true);
  });
});
