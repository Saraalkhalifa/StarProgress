/**
 * Storage layer for the new multi-rule streak system.
 *
 * Architecture:
 * - Streak RULES   → Supabase (Supabase mode) | localStorage (demo mode)
 * - Participant streak PROGRESS → localStorage in both modes (computed from submissions)
 * - Streak REWARDS (dedup log)  → localStorage in both modes
 * - Audit LOGS     → Supabase (Supabase mode) | localStorage (demo mode)
 */
import type {
  StreakRule,
  StreakMilestoneConfig,
  ParticipantStreakRecord,
  StreakRewardRecord,
  StreakAuditLog,
} from '../types/streak';
import { supabase, isSupabaseConfigured } from './supabase';
import { generateId } from './utils';

// ── Mappers ───────────────────────────────────────────────────────────────────

function mapMilestone(r: Record<string, unknown>): StreakMilestoneConfig {
  return {
    id: r.id as string,
    ruleId: r.rule_id as string,
    daysRequired: r.days_required as number,
    bonusPoints: r.bonus_points as number,
    badgeId: (r.badge_id as string) ?? undefined,
  };
}

function mapRule(r: Record<string, unknown>, milestones: StreakMilestoneConfig[]): StreakRule {
  return {
    id: r.id as string,
    name: r.name as string,
    description: (r.description as string) ?? '',
    type: r.type as StreakRule['type'],
    activityIds: ((r.activity_ids as string[]) ?? []).filter(Boolean),
    requireApproved: r.require_approved as boolean ?? true,
    graceDaysEnabled: r.grace_days_enabled as boolean ?? false,
    graceDaysAllowed: r.grace_days_allowed as number ?? 1,
    cheatPenaltyBreaks: r.cheat_penalty_breaks as boolean ?? true,
    duplicateDaysAllowed: r.duplicate_days_allowed as boolean ?? false,
    isActive: r.is_active as boolean ?? true,
    milestones: milestones.filter(m => m.ruleId === (r.id as string)),
    createdBy: (r.created_by as string) ?? undefined,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

function mapAuditLog(r: Record<string, unknown>): StreakAuditLog {
  return {
    id: r.id as string,
    participantId: r.participant_id as string,
    ruleId: r.rule_id as string,
    action: r.action as StreakAuditLog['action'],
    oldValue: r.old_value as number,
    newValue: r.new_value as number,
    reason: r.reason as string,
    performedBy: r.performed_by as string,
    performedByName: (r.performed_by_name as string) ?? undefined,
    createdAt: r.created_at as string,
  };
}

// ── localStorage keys ─────────────────────────────────────────────────────────

const LS = {
  rules:             'sp_streak_rules_v2',
  participantStreaks: 'sp_participant_streaks_v2',
  streakRewards:     'sp_streak_rewards_v2',
  auditLogs:         'sp_streak_audit_v2',
};

function lsGet<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]') as T[]; }
  catch { return []; }
}
function lsSet<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// ── Default rule for demo mode ────────────────────────────────────────────────

export const DEFAULT_DAILY_ACTION_RULE: StreakRule = {
  id: '00000000-0000-0000-0010-000000000001',
  name: 'Daily Action Streak',
  description: 'Complete at least one approved Hero Action each day to build your streak.',
  type: 'daily_action',
  activityIds: [],
  requireApproved: true,
  graceDaysEnabled: false,
  graceDaysAllowed: 1,
  cheatPenaltyBreaks: true,
  duplicateDaysAllowed: false,
  isActive: true,
  milestones: [
    { id: 'm-daily-3',  ruleId: '00000000-0000-0000-0010-000000000001', daysRequired: 3,  bonusPoints: 5  },
    { id: 'm-daily-5',  ruleId: '00000000-0000-0000-0010-000000000001', daysRequired: 5,  bonusPoints: 10 },
    { id: 'm-daily-7',  ruleId: '00000000-0000-0000-0010-000000000001', daysRequired: 7,  bonusPoints: 20 },
    { id: 'm-daily-14', ruleId: '00000000-0000-0000-0010-000000000001', daysRequired: 14, bonusPoints: 30 },
    { id: 'm-daily-30', ruleId: '00000000-0000-0000-0010-000000000001', daysRequired: 30, bonusPoints: 60 },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ── Supabase streak rule storage ──────────────────────────────────────────────

const supabaseRuleStorage = {
  loadRules: async (): Promise<StreakRule[]> => {
    try {
      const [{ data: rules, error: rErr }, { data: milestones, error: mErr }] = await Promise.all([
        supabase!.from('streak_rules').select('*').order('created_at'),
        supabase!.from('streak_milestones').select('*').order('days_required'),
      ]);
      if (rErr || mErr) {
        // Table might not exist yet — fall back to default
        return lsGet<StreakRule>(LS.rules).length > 0
          ? lsGet<StreakRule>(LS.rules)
          : [DEFAULT_DAILY_ACTION_RULE];
      }
      const ms = (milestones ?? []).map(r => mapMilestone(r as Record<string, unknown>));
      const result = (rules ?? []).map(r => mapRule(r as Record<string, unknown>, ms));
      // Cache locally
      lsSet(LS.rules, result);
      return result.length > 0 ? result : [DEFAULT_DAILY_ACTION_RULE];
    } catch {
      return lsGet<StreakRule>(LS.rules).length > 0
        ? lsGet<StreakRule>(LS.rules)
        : [DEFAULT_DAILY_ACTION_RULE];
    }
  },

  saveRule: async (rule: Omit<StreakRule, 'id' | 'createdAt' | 'updatedAt'> & { createdBy?: string }): Promise<StreakRule> => {
    const { milestones, ...ruleData } = rule;
    const now = new Date().toISOString();
    const { data, error } = await supabase!.from('streak_rules').insert({
      name:                  ruleData.name,
      description:           ruleData.description,
      type:                  ruleData.type,
      activity_ids:          ruleData.activityIds,
      require_approved:      ruleData.requireApproved,
      grace_days_enabled:    ruleData.graceDaysEnabled,
      grace_days_allowed:    ruleData.graceDaysAllowed,
      cheat_penalty_breaks:  ruleData.cheatPenaltyBreaks,
      duplicate_days_allowed: ruleData.duplicateDaysAllowed,
      is_active:             ruleData.isActive,
      created_by:            ruleData.createdBy ?? null,
      created_at:            now,
      updated_at:            now,
    }).select().single();
    if (error) throw error;
    const newId = data.id as string;

    if (milestones.length > 0) {
      const { error: mErr } = await supabase!.from('streak_milestones').insert(
        milestones.map(m => ({
          rule_id:      newId,
          days_required: m.daysRequired,
          bonus_points:  m.bonusPoints,
          badge_id:      m.badgeId ?? null,
        }))
      );
      if (mErr) throw mErr;
    }

    const freshRules = await supabaseRuleStorage.loadRules();
    return freshRules.find(r => r.id === newId)!;
  },

  updateRule: async (id: string, data: Partial<StreakRule>): Promise<void> => {
    const { milestones, ...ruleData } = data;
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (ruleData.name                !== undefined) patch.name                  = ruleData.name;
    if (ruleData.description         !== undefined) patch.description           = ruleData.description;
    if (ruleData.type                !== undefined) patch.type                  = ruleData.type;
    if (ruleData.activityIds         !== undefined) patch.activity_ids          = ruleData.activityIds;
    if (ruleData.requireApproved     !== undefined) patch.require_approved      = ruleData.requireApproved;
    if (ruleData.graceDaysEnabled    !== undefined) patch.grace_days_enabled    = ruleData.graceDaysEnabled;
    if (ruleData.graceDaysAllowed    !== undefined) patch.grace_days_allowed    = ruleData.graceDaysAllowed;
    if (ruleData.cheatPenaltyBreaks  !== undefined) patch.cheat_penalty_breaks  = ruleData.cheatPenaltyBreaks;
    if (ruleData.duplicateDaysAllowed !== undefined) patch.duplicate_days_allowed = ruleData.duplicateDaysAllowed;
    if (ruleData.isActive            !== undefined) patch.is_active             = ruleData.isActive;

    const { error } = await supabase!.from('streak_rules').update(patch).eq('id', id);
    if (error) throw error;

    if (milestones !== undefined) {
      await supabase!.from('streak_milestones').delete().eq('rule_id', id);
      if (milestones.length > 0) {
        const { error: mErr } = await supabase!.from('streak_milestones').insert(
          milestones.map(m => ({
            rule_id:       id,
            days_required: m.daysRequired,
            bonus_points:  m.bonusPoints,
            badge_id:      m.badgeId ?? null,
          }))
        );
        if (mErr) throw mErr;
      }
    }
    // Invalidate cache
    lsSet(LS.rules, []);
  },

  deleteRule: async (id: string): Promise<void> => {
    const { error } = await supabase!.from('streak_rules').delete().eq('id', id);
    if (error) throw error;
    // Purge local state for this rule
    lsSet(LS.participantStreaks, lsGet<ParticipantStreakRecord>(LS.participantStreaks).filter(r => r.ruleId !== id));
    lsSet(LS.streakRewards,      lsGet<StreakRewardRecord>(LS.streakRewards).filter(r => r.ruleId !== id));
    lsSet(LS.rules, []);
  },

  loadAuditLogs: async (): Promise<StreakAuditLog[]> => {
    try {
      const { data, error } = await supabase!
        .from('streak_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(300);
      if (error) return lsGet<StreakAuditLog>(LS.auditLogs);
      return (data ?? []).map(r => mapAuditLog(r as Record<string, unknown>));
    } catch {
      return lsGet<StreakAuditLog>(LS.auditLogs);
    }
  },

  insertAuditLog: async (log: Omit<StreakAuditLog, 'id'>): Promise<void> => {
    try {
      await supabase!.from('streak_audit_logs').insert({
        participant_id:   log.participantId,
        rule_id:          log.ruleId,
        action:           log.action,
        old_value:        log.oldValue,
        new_value:        log.newValue,
        reason:           log.reason,
        performed_by:     log.performedBy,
        performed_by_name: log.performedByName ?? null,
        created_at:       log.createdAt,
      });
    } catch { /* silently fail — audit log is non-critical */ }
    // Also persist locally
    const full: StreakAuditLog = { ...log, id: generateId() };
    lsSet(LS.auditLogs, [full, ...lsGet<StreakAuditLog>(LS.auditLogs)].slice(0, 500));
  },
};

// ── localStorage streak rule storage ─────────────────────────────────────────

const localRuleStorage = {
  loadRules: async (): Promise<StreakRule[]> => {
    const stored = lsGet<StreakRule>(LS.rules);
    if (stored.length === 0) {
      lsSet(LS.rules, [DEFAULT_DAILY_ACTION_RULE]);
      return [DEFAULT_DAILY_ACTION_RULE];
    }
    return stored;
  },

  saveRule: async (rule: Omit<StreakRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<StreakRule> => {
    const now = new Date().toISOString();
    const newRule: StreakRule = {
      ...rule,
      id: generateId(),
      milestones: rule.milestones.map(m => ({ ...m, id: generateId() })),
      createdAt: now,
      updatedAt: now,
    };
    newRule.milestones = newRule.milestones.map(m => ({ ...m, ruleId: newRule.id }));
    lsSet(LS.rules, [...lsGet<StreakRule>(LS.rules), newRule]);
    return newRule;
  },

  updateRule: async (id: string, data: Partial<StreakRule>): Promise<void> => {
    const rules = lsGet<StreakRule>(LS.rules);
    lsSet(LS.rules, rules.map(r =>
      r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r
    ));
  },

  deleteRule: async (id: string): Promise<void> => {
    lsSet(LS.rules,             lsGet<StreakRule>(LS.rules).filter(r => r.id !== id));
    lsSet(LS.participantStreaks, lsGet<ParticipantStreakRecord>(LS.participantStreaks).filter(r => r.ruleId !== id));
    lsSet(LS.streakRewards,      lsGet<StreakRewardRecord>(LS.streakRewards).filter(r => r.ruleId !== id));
  },

  loadAuditLogs: async (): Promise<StreakAuditLog[]> =>
    lsGet<StreakAuditLog>(LS.auditLogs),

  insertAuditLog: async (log: Omit<StreakAuditLog, 'id'>): Promise<void> => {
    const full: StreakAuditLog = { ...log, id: generateId() };
    lsSet(LS.auditLogs, [full, ...lsGet<StreakAuditLog>(LS.auditLogs)].slice(0, 500));
  },
};

// ── Shared (always localStorage) ──────────────────────────────────────────────

export const participantStreakStore = {
  load: (): ParticipantStreakRecord[] => lsGet<ParticipantStreakRecord>(LS.participantStreaks),
  upsert: (record: ParticipantStreakRecord): void => {
    const all = lsGet<ParticipantStreakRecord>(LS.participantStreaks);
    const idx = all.findIndex(r => r.participantId === record.participantId && r.ruleId === record.ruleId);
    if (idx >= 0) {
      all[idx] = { ...record, id: all[idx].id };
      lsSet(LS.participantStreaks, all);
    } else {
      lsSet(LS.participantStreaks, [...all, record]);
    }
  },
  clear: (ruleId: string): void => {
    lsSet(LS.participantStreaks, lsGet<ParticipantStreakRecord>(LS.participantStreaks).filter(r => r.ruleId !== ruleId));
  },
  reset: (participantId: string, ruleId: string): void => {
    const all = lsGet<ParticipantStreakRecord>(LS.participantStreaks);
    const idx = all.findIndex(r => r.participantId === participantId && r.ruleId === ruleId);
    if (idx >= 0) {
      all[idx] = { ...all[idx], currentStreak: 0, streakStartDate: '', graceDaysUsed: 0, updatedAt: new Date().toISOString() };
      lsSet(LS.participantStreaks, all);
    }
  },
};

export const streakRewardStore = {
  load: (): StreakRewardRecord[] => lsGet<StreakRewardRecord>(LS.streakRewards),
  add: (reward: StreakRewardRecord): void => {
    lsSet(LS.streakRewards, [...lsGet<StreakRewardRecord>(LS.streakRewards), reward]);
  },
  hasBeenAwarded: (participantId: string, ruleId: string, milestoneDays: number, streakStartDate: string): boolean => {
    return lsGet<StreakRewardRecord>(LS.streakRewards).some(
      r => r.participantId === participantId &&
           r.ruleId === ruleId &&
           r.milestoneDays === milestoneDays &&
           r.streakStartDate === streakStartDate
    );
  },
};

// ── Export the right adapter ──────────────────────────────────────────────────

export const streakRuleStorage = isSupabaseConfigured ? supabaseRuleStorage : localRuleStorage;
