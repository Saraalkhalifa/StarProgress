import type { DailyWinner, TopStreak, StreakBonus, StreakSettings } from '../types/streak';

const KEYS = {
  dailyWinners: 'sp_daily_winners',
  streaks:      'sp_streaks',
  bonuses:      'sp_streak_bonuses',
  settings:     'sp_streak_settings',
};

function lsGet<T>(key: string): T {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') as T; }
  catch { return null as T; }
}
function lsSet(key: string, data: unknown): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export const DEFAULT_STREAK_SETTINGS: StreakSettings = {
  enabled: true,
  streakLengthForBonus: 7,
  bonusPoints: 30,
  updatedAt: new Date().toISOString(),
};

export function loadStreakSettings(): StreakSettings {
  return lsGet<StreakSettings>(KEYS.settings) ?? DEFAULT_STREAK_SETTINGS;
}
export function saveStreakSettings(s: StreakSettings): void {
  lsSet(KEYS.settings, s);
}

export function loadDailyWinners(): DailyWinner[] {
  return lsGet<DailyWinner[]>(KEYS.dailyWinners) ?? [];
}
export function saveDailyWinners(w: DailyWinner[]): void {
  lsSet(KEYS.dailyWinners, w);
}

export function loadStreaks(): TopStreak[] {
  return lsGet<TopStreak[]>(KEYS.streaks) ?? [];
}
export function saveStreaks(s: TopStreak[]): void {
  lsSet(KEYS.streaks, s);
}

export function loadBonuses(): StreakBonus[] {
  return lsGet<StreakBonus[]>(KEYS.bonuses) ?? [];
}
export function saveBonuses(b: StreakBonus[]): void {
  lsSet(KEYS.bonuses, b);
}
export function addBonus(b: StreakBonus): void {
  saveBonuses([...loadBonuses(), b]);
}
