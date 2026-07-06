import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useData } from './DataContext';
import {
  loadStreakSettings, saveStreakSettings,
  loadDailyWinners, saveDailyWinners,
  loadStreaks, saveStreaks,
  loadBonuses, addBonus,
} from '../lib/streakStorage';
import {
  calculateDailyWinners,
  calculateStreaks,
  findNewBonuses,
  getTodayRiyadh,
} from '../lib/streakEngine';
import { storage } from '../lib/storage';
import { generateId } from '../lib/utils';
import type { TopStreak, StreakBonus, StreakSettings, DailyWinner } from '../types/streak';

interface StreakContextValue {
  streaks: TopStreak[];
  dailyWinners: DailyWinner[];
  settings: StreakSettings;
  getParticipantStreak: (userId: string) => TopStreak | null;
  getDaysToNextBonus: (userId: string) => number;
  updateSettings: (s: Partial<StreakSettings>) => void;
  recalculate: () => Promise<void>;
  newBonusFor: string | null;   // participantId that just got a bonus this session
  clearNewBonus: () => void;
}

const StreakContext = createContext<StreakContextValue | null>(null);

export function useStreak() {
  const ctx = useContext(StreakContext);
  if (!ctx) throw new Error('useStreak must be used inside StreakProvider');
  return ctx;
}
export function useStreakSafe() {
  return useContext(StreakContext);
}

export function StreakProvider({ children }: { children: React.ReactNode }) {
  const { submissions, users, refresh: dataRefresh } = useData();

  const [streaks, setStreaks] = useState<TopStreak[]>(() => loadStreaks());
  const [dailyWinners, setDailyWinners] = useState<DailyWinner[]>(() => loadDailyWinners());
  const [settings, setSettings] = useState<StreakSettings>(() => loadStreakSettings());
  const [newBonusFor, setNewBonusFor] = useState<string | null>(null);

  // Track the last submission set we processed to avoid redundant runs
  const lastKeyRef = useRef('');
  const runningRef = useRef(false);

  const recalculate = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;

    try {
      const currentSettings = loadStreakSettings();

      // 1. Compute daily winners from accepted, non-bonus submissions
      const newWinners = calculateDailyWinners(submissions);
      saveDailyWinners(newWinners);
      setDailyWinners(newWinners);

      // 2. Compute streaks for all participants
      const participantIds = users
        .filter(u => u.role === 'participant')
        .map(u => u.id);
      const newStreaks = calculateStreaks(newWinners, participantIds);

      // 3. Check for new bonuses
      const existingBonuses = loadBonuses();
      const pendingBonuses = findNewBonuses(newStreaks, existingBonuses, currentSettings);

      let needsDataRefresh = false;

      for (const bonus of pendingBonuses) {
        const now = new Date().toISOString();
        const sub = {
          id: generateId(),
          participantId: bonus.participantId,
          activityId: '__streak_bonus__',
          note: `🔥 ${bonus.streakMilestone}-day streak bonus!`,
          pointsValueAtSubmission: bonus.bonusPoints,
          status: 'accepted' as const,
          sourceType: 'streak_bonus' as const,
          submittedAt: now,
          reviewedAt: now,
          activity_date: getTodayRiyadh(),
        };

        await storage.addSubmission(sub);

        const fullBonus: StreakBonus = { ...bonus, submissionId: sub.id };
        addBonus(fullBonus);

        await storage.addNotification({
          id: generateId(),
          userId: bonus.participantId,
          type: 'streak_bonus',
          message: `🔥 You earned a ${bonus.streakMilestone}-day streak bonus! +${bonus.bonusPoints} points`,
          relatedSubmissionId: sub.id,
          isRead: false,
          createdAt: now,
        });

        setNewBonusFor(bonus.participantId);
        needsDataRefresh = true;
      }

      saveStreaks(newStreaks);
      setStreaks(newStreaks);

      if (needsDataRefresh) {
        await dataRefresh();
      }
    } finally {
      runningRef.current = false;
    }
  }, [submissions, users, dataRefresh]);

  // Re-run when submissions array changes
  useEffect(() => {
    const key = submissions.map(s => s.id).sort().join(',');
    if (key === lastKeyRef.current) return;
    lastKeyRef.current = key;
    recalculate();
  }, [submissions, recalculate]);

  const updateSettings = useCallback((patch: Partial<StreakSettings>) => {
    const updated = { ...loadStreakSettings(), ...patch, updatedAt: new Date().toISOString() };
    saveStreakSettings(updated);
    setSettings(updated);
  }, []);

  const getParticipantStreak = useCallback(
    (userId: string) => streaks.find(s => s.participantId === userId) ?? null,
    [streaks],
  );

  const getDaysToNextBonus = useCallback((userId: string): number => {
    const streak = streaks.find(s => s.participantId === userId);
    if (!streak || streak.currentStreak === 0 || !settings.enabled) return -1;
    const nextMilestone =
      (Math.floor(streak.currentStreak / settings.streakLengthForBonus) + 1) *
      settings.streakLengthForBonus;
    return nextMilestone - streak.currentStreak;
  }, [streaks, settings]);

  const clearNewBonus = useCallback(() => setNewBonusFor(null), []);

  return (
    <StreakContext.Provider value={{
      streaks, dailyWinners, settings,
      getParticipantStreak, getDaysToNextBonus,
      updateSettings, recalculate,
      newBonusFor, clearNewBonus,
    }}>
      {children}
    </StreakContext.Provider>
  );
}
