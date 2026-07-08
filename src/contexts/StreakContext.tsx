import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useData } from './DataContext';
import { useAuthStore } from '../store/useAuthStore';
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
  calculateActivityBasedStreak,
  findNewMilestoneRewards,
  isTodayCompleted,
  getNextMilestone,
} from '../lib/streakEngine';
import {
  streakRuleStorage,
  participantStreakStore,
  streakRewardStore,
} from '../lib/streakRuleStorage';
import { storage } from '../lib/storage';
import { generateId } from '../lib/utils';
import type { TopStreak, StreakBonus, StreakSettings, DailyWinner } from '../types/streak';
import type {
  StreakRule,
  ParticipantStreakRecord,
  StreakRewardRecord,
  StreakAuditLog,
  StreakMilestoneConfig,
} from '../types/streak';

// ── Context type ──────────────────────────────────────────────────────────────

export interface ParticipantStreakSummary {
  rule: StreakRule;
  record: ParticipantStreakRecord;
  todayCompleted: boolean;
  nextMilestone: StreakMilestoneConfig | null;
  daysToNextMilestone: number;
}

interface StreakContextValue {
  // ── Legacy API (top-hero streak, kept for backward compat) ──
  streaks: TopStreak[];
  dailyWinners: DailyWinner[];
  settings: StreakSettings;
  getParticipantStreak: (userId: string) => TopStreak | null;
  getDaysToNextBonus: (userId: string) => number;
  updateSettings: (s: Partial<StreakSettings>) => void;
  recalculate: () => Promise<void>;
  newBonusFor: string | null;
  clearNewBonus: () => void;

  // ── New multi-rule API ──
  streakRules: StreakRule[];
  participantStreakRecords: ParticipantStreakRecord[];
  auditLogs: StreakAuditLog[];
  rulesLoading: boolean;
  /** Active rule-based streaks for a specific participant */
  getActiveStreaksForParticipant: (userId: string) => ParticipantStreakSummary[];
  getStreakForRule: (userId: string, ruleId: string) => ParticipantStreakRecord | null;
  /** Admin: create a new streak rule */
  createRule: (rule: Omit<StreakRule, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  /** Admin: update a streak rule (replaces milestones if provided) */
  updateRule: (id: string, data: Partial<StreakRule>) => Promise<void>;
  /** Admin: delete a streak rule */
  deleteRule: (id: string) => Promise<void>;
  /** Admin: manually adjust a participant's streak (requires reason) */
  manualAdjustStreak: (participantId: string, ruleId: string, newStreak: number, reason: string) => Promise<void>;
  /** Admin: reset a participant's streak to 0 (requires reason) */
  manualResetStreak: (participantId: string, ruleId: string, reason: string) => Promise<void>;
  /** Admin: reload audit logs from DB */
  refreshAuditLogs: () => Promise<void>;
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

// ── Provider ──────────────────────────────────────────────────────────────────

export function StreakProvider({ children }: { children: React.ReactNode }) {
  const { submissions, users, refresh: dataRefresh } = useData();

  // ── Legacy top-hero streak state ──
  const [streaks, setStreaks]           = useState<TopStreak[]>(() => loadStreaks());
  const [dailyWinners, setDailyWinners] = useState<DailyWinner[]>(() => loadDailyWinners());
  const [settings, setSettings]         = useState<StreakSettings>(() => loadStreakSettings());
  const [newBonusFor, setNewBonusFor]   = useState<string | null>(null);

  // ── New rule-based streak state ──
  const [streakRules, setStreakRules]                     = useState<StreakRule[]>([]);
  const [participantStreakRecords, setParticipantStreakRecords] = useState<ParticipantStreakRecord[]>(() => participantStreakStore.load());
  const [auditLogs, setAuditLogs]                         = useState<StreakAuditLog[]>([]);
  const [rulesLoading, setRulesLoading]                   = useState(true);

  const lastKeyRef  = useRef('');
  const runningRef  = useRef(false);

  // ── Load rules once on mount ──────────────────────────────────────────────
  useEffect(() => {
    streakRuleStorage.loadRules().then(rules => {
      setStreakRules(rules);
      setRulesLoading(false);
    }).catch(() => setRulesLoading(false));
  }, []);

  // ── Main recalculate function ─────────────────────────────────────────────
  const recalculate = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;

    try {
      const currentSettings = loadStreakSettings();

      // 1. Legacy: top-hero daily winner streaks
      const newWinners = calculateDailyWinners(submissions);
      saveDailyWinners(newWinners);
      setDailyWinners(newWinners);

      const participantIds = users.filter(u => u.role === 'participant').map(u => u.id);
      const newStreaks = calculateStreaks(newWinners, participantIds);

      const existingBonuses = loadBonuses();
      const pendingBonuses = findNewBonuses(newStreaks, existingBonuses, currentSettings);

      let needsDataRefresh = false;

      for (const bonus of pendingBonuses) {
        const now = new Date().toISOString();
        const sub = {
          id: generateId(),
          participantId: bonus.participantId,
          activityId: '__streak_bonus__',
          note: `🔥 ${bonus.streakMilestone}-day Top Hero streak bonus!`,
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
        try {
          await storage.addNotification({
            id: generateId(),
            userId: bonus.participantId,
            type: 'streak_bonus',
            message: `🔥 You earned a ${bonus.streakMilestone}-day Top Hero streak bonus! +${bonus.bonusPoints} points`,
            relatedSubmissionId: sub.id,
            isRead: false,
            createdAt: now,
          });
        } catch { /* non-critical */ }
        setNewBonusFor(bonus.participantId);
        needsDataRefresh = true;
      }

      saveStreaks(newStreaks);
      setStreaks(newStreaks);

      // 2. New: activity-based streak rules (non-top_hero)
      const activeRules = streakRules.filter(r => r.isActive && r.type !== 'top_hero');

      for (const rule of activeRules) {
        const updatedRecords: ParticipantStreakRecord[] = [];

        for (const participantId of participantIds) {
          const existing = participantStreakStore.load().find(
            r => r.participantId === participantId && r.ruleId === rule.id
          ) ?? null;

          const record = calculateActivityBasedStreak(submissions, rule, existing, participantId);
          participantStreakStore.upsert(record);
          updatedRecords.push(record);

          // Find and award new milestone rewards
          const pendingRewards = findNewMilestoneRewards(
            record,
            rule,
            (milestoneDay, startDate) =>
              streakRewardStore.hasBeenAwarded(participantId, rule.id, milestoneDay, startDate)
          );

          for (const pending of pendingRewards) {
            const now = new Date().toISOString();
            const ruleName = rule.name;
            const sub = {
              id: generateId(),
              participantId,
              activityId: '__streak_bonus__',
              note: `🔥 ${pending.milestoneDays}-day ${ruleName} milestone! +${pending.bonusPoints} pts`,
              pointsValueAtSubmission: pending.bonusPoints,
              status: 'accepted' as const,
              sourceType: 'streak_bonus' as const,
              submittedAt: now,
              reviewedAt: now,
              activity_date: getTodayRiyadh(),
            };

            try {
              await storage.addSubmission(sub);
            } catch {
              continue; // don't record as awarded if DB write failed
            }

            const reward: StreakRewardRecord = { ...pending, id: generateId(), submissionId: sub.id };
            streakRewardStore.add(reward);

            try {
              await storage.addNotification({
                id: generateId(),
                userId: participantId,
                type: 'streak_bonus',
                message: `🔥 ${pending.milestoneDays}-day ${ruleName} streak! You earned +${pending.bonusPoints} Hero Points!`,
                relatedSubmissionId: sub.id,
                isRead: false,
                createdAt: now,
              });
            } catch { /* non-critical */ }

            setNewBonusFor(participantId);
            needsDataRefresh = true;
          }
        }

        setParticipantStreakRecords(participantStreakStore.load());
      }

      if (needsDataRefresh) {
        await dataRefresh();
      }
    } finally {
      runningRef.current = false;
    }
  }, [submissions, users, dataRefresh, streakRules]);

  // Re-run when submissions change
  useEffect(() => {
    const key = submissions.map(s => `${s.id}:${s.status}`).sort().join(',');
    if (key === lastKeyRef.current) return;
    lastKeyRef.current = key;
    recalculate();
  }, [submissions, recalculate]);

  // ── Legacy helpers ────────────────────────────────────────────────────────
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
    const next =
      (Math.floor(streak.currentStreak / settings.streakLengthForBonus) + 1) *
      settings.streakLengthForBonus;
    return next - streak.currentStreak;
  }, [streaks, settings]);

  const clearNewBonus = useCallback(() => setNewBonusFor(null), []);

  // ── New rule-based helpers ────────────────────────────────────────────────
  const getStreakForRule = useCallback(
    (userId: string, ruleId: string): ParticipantStreakRecord | null =>
      participantStreakRecords.find(r => r.participantId === userId && r.ruleId === ruleId) ?? null,
    [participantStreakRecords],
  );

  const getActiveStreaksForParticipant = useCallback(
    (userId: string): ParticipantStreakSummary[] => {
      return streakRules
        .filter(r => r.isActive && r.type !== 'top_hero')
        .map(rule => {
          const record = participantStreakRecords.find(
            r => r.participantId === userId && r.ruleId === rule.id
          ) ?? {
            id: '',
            participantId: userId,
            ruleId: rule.id,
            currentStreak: 0,
            bestStreak: 0,
            lastActivityDate: '',
            streakStartDate: '',
            graceDaysUsed: 0,
            updatedAt: '',
          };

          const todayCompleted = isTodayCompleted(submissions, userId, rule);
          const nextMilestone = getNextMilestone(
            record.currentStreak,
            record,
            rule,
            (md, sd) => streakRewardStore.hasBeenAwarded(userId, rule.id, md, sd)
          );
          const daysToNextMilestone = nextMilestone
            ? Math.max(0, nextMilestone.daysRequired - record.currentStreak)
            : 0;

          return { rule, record, todayCompleted, nextMilestone, daysToNextMilestone };
        });
    },
    [streakRules, participantStreakRecords, submissions],
  );

  // ── Admin rule management ─────────────────────────────────────────────────
  const createRule = useCallback(async (rule: Omit<StreakRule, 'id' | 'createdAt' | 'updatedAt'>) => {
    const currentUser = useAuthStore.getState().currentUser;
    const newRule = await streakRuleStorage.saveRule({ ...rule, createdBy: currentUser?.id });
    setStreakRules(prev => [...prev, newRule]);
  }, []);

  const updateRule = useCallback(async (id: string, data: Partial<StreakRule>) => {
    await streakRuleStorage.updateRule(id, data);
    const fresh = await streakRuleStorage.loadRules();
    setStreakRules(fresh);
  }, []);

  const deleteRule = useCallback(async (id: string) => {
    await streakRuleStorage.deleteRule(id);
    setStreakRules(prev => prev.filter(r => r.id !== id));
    setParticipantStreakRecords(prev => prev.filter(r => r.ruleId !== id));
  }, []);

  const manualAdjustStreak = useCallback(async (
    participantId: string,
    ruleId: string,
    newStreak: number,
    reason: string,
  ) => {
    const existing = participantStreakStore.load().find(
      r => r.participantId === participantId && r.ruleId === ruleId
    );
    const oldValue = existing?.currentStreak ?? 0;
    const currentUser = useAuthStore.getState().currentUser;

    const updated: ParticipantStreakRecord = {
      id: existing?.id ?? generateId(),
      participantId,
      ruleId,
      currentStreak: newStreak,
      bestStreak: Math.max(existing?.bestStreak ?? 0, newStreak),
      lastActivityDate: existing?.lastActivityDate ?? '',
      streakStartDate: existing?.streakStartDate ?? '',
      graceDaysUsed: existing?.graceDaysUsed ?? 0,
      updatedAt: new Date().toISOString(),
    };
    participantStreakStore.upsert(updated);
    setParticipantStreakRecords(participantStreakStore.load());

    await streakRuleStorage.insertAuditLog({
      participantId,
      ruleId,
      action: 'manual_adjust',
      oldValue,
      newValue: newStreak,
      reason,
      performedBy: currentUser?.id ?? '',
      performedByName: currentUser?.name,
      createdAt: new Date().toISOString(),
    });
  }, []);

  const manualResetStreak = useCallback(async (
    participantId: string,
    ruleId: string,
    reason: string,
  ) => {
    const existing = participantStreakStore.load().find(
      r => r.participantId === participantId && r.ruleId === ruleId
    );
    const oldValue = existing?.currentStreak ?? 0;
    const currentUser = useAuthStore.getState().currentUser;

    participantStreakStore.reset(participantId, ruleId);
    setParticipantStreakRecords(participantStreakStore.load());

    await streakRuleStorage.insertAuditLog({
      participantId,
      ruleId,
      action: 'manual_reset',
      oldValue,
      newValue: 0,
      reason,
      performedBy: currentUser?.id ?? '',
      performedByName: currentUser?.name,
      createdAt: new Date().toISOString(),
    });
  }, []);

  const refreshAuditLogs = useCallback(async () => {
    const logs = await streakRuleStorage.loadAuditLogs();
    setAuditLogs(logs);
  }, []);

  return (
    <StreakContext.Provider value={{
      // Legacy
      streaks, dailyWinners, settings,
      getParticipantStreak, getDaysToNextBonus,
      updateSettings, recalculate,
      newBonusFor, clearNewBonus,
      // New
      streakRules, participantStreakRecords, auditLogs, rulesLoading,
      getActiveStreaksForParticipant, getStreakForRule,
      createRule, updateRule, deleteRule,
      manualAdjustStreak, manualResetStreak,
      refreshAuditLogs,
    }}>
      {children}
    </StreakContext.Provider>
  );
}
