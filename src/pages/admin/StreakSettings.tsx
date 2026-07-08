import React, { useState, useEffect } from 'react';
import {
  Flame, RefreshCw, Trophy, Users, Plus, Pencil, Trash2,
  ChevronDown, ChevronRight, Shield, History, Settings,
  CheckCircle, XCircle, AlertTriangle,
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStreak } from '../../contexts/StreakContext';
import { Card, Button, toast } from '../../components/ui';
import { StreakBadge } from '../../components/streak/StreakBadge';
import { loadBonuses } from '../../lib/streakStorage';
import type { StreakRule, StreakMilestoneConfig } from '../../types/streak';

// ── Tab type ──────────────────────────────────────────────────────────────────
type Tab = 'rules' | 'top_hero' | 'participants' | 'audit';

// ── Rule form default ────────────────────────────────────────────────────────
const DEFAULT_MILESTONES: Omit<StreakMilestoneConfig, 'id' | 'ruleId'>[] = [
  { daysRequired: 3,  bonusPoints: 5  },
  { daysRequired: 5,  bonusPoints: 10 },
  { daysRequired: 7,  bonusPoints: 20 },
  { daysRequired: 14, bonusPoints: 30 },
  { daysRequired: 30, bonusPoints: 60 },
];

interface RuleFormData {
  name: string;
  description: string;
  type: StreakRule['type'];
  requireApproved: boolean;
  graceDaysEnabled: boolean;
  graceDaysAllowed: number;
  cheatPenaltyBreaks: boolean;
  duplicateDaysAllowed: boolean;
  isActive: boolean;
  milestones: { daysRequired: number; bonusPoints: number }[];
}

function defaultForm(): RuleFormData {
  return {
    name: '',
    description: '',
    type: 'daily_action',
    requireApproved: true,
    graceDaysEnabled: false,
    graceDaysAllowed: 1,
    cheatPenaltyBreaks: true,
    duplicateDaysAllowed: false,
    isActive: true,
    milestones: DEFAULT_MILESTONES.map(m => ({ ...m })),
  };
}

// ── Main component ────────────────────────────────────────────────────────────
export function StreakSettings() {
  const { users, activities } = useData();
  const {
    streaks, dailyWinners, settings, updateSettings, recalculate,
    streakRules, participantStreakRecords, auditLogs, rulesLoading,
    createRule, updateRule, deleteRule,
    manualAdjustStreak, manualResetStreak,
    refreshAuditLogs,
  } = useStreak();

  const [tab, setTab] = useState<Tab>('rules');
  const [recalculating, setRecalculating] = useState(false);

  // Top Hero settings form
  const [lengthInput, setLengthInput] = useState(String(settings.streakLengthForBonus));
  const [pointsInput, setPointsInput] = useState(String(settings.bonusPoints));

  // Rule modal
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<StreakRule | null>(null);
  const [form, setForm] = useState<RuleFormData>(defaultForm());
  const [saving, setSaving] = useState(false);

  // Participant progress: selected rule
  const [selectedRuleId, setSelectedRuleId] = useState<string>('');
  const [adjustTarget, setAdjustTarget] = useState<{ participantId: string; name: string } | null>(null);
  const [adjustValue, setAdjustValue] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustSaving, setAdjustSaving] = useState(false);

  const participants = users.filter(u => u.role === 'participant');
  const bonuses = loadBonuses();

  // Set default selected rule
  useEffect(() => {
    if (!selectedRuleId && streakRules.length > 0) {
      setSelectedRuleId(streakRules[0].id);
    }
  }, [streakRules, selectedRuleId]);

  // Load audit logs when tab opens
  useEffect(() => {
    if (tab === 'audit') {
      refreshAuditLogs().catch(() => {});
    }
  }, [tab, refreshAuditLogs]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSaveTopHero = () => {
    const len = parseInt(lengthInput, 10);
    const pts = parseInt(pointsInput, 10);
    if (isNaN(len) || len < 2 || len > 365) { toast.error('Streak length must be 2–365'); return; }
    if (isNaN(pts) || pts < 1 || pts > 10000) { toast.error('Bonus points must be 1–10,000'); return; }
    updateSettings({ streakLengthForBonus: len, bonusPoints: pts });
    toast.success('Top Hero streak settings saved!');
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await recalculate();
      toast.success('Streaks recalculated!');
    } finally {
      setRecalculating(false);
    }
  };

  const openCreate = () => {
    setEditingRule(null);
    setForm(defaultForm());
    setShowModal(true);
  };

  const openEdit = (rule: StreakRule) => {
    setEditingRule(rule);
    setForm({
      name: rule.name,
      description: rule.description,
      type: rule.type,
      requireApproved: rule.requireApproved,
      graceDaysEnabled: rule.graceDaysEnabled,
      graceDaysAllowed: rule.graceDaysAllowed,
      cheatPenaltyBreaks: rule.cheatPenaltyBreaks,
      duplicateDaysAllowed: rule.duplicateDaysAllowed,
      isActive: rule.isActive,
      milestones: rule.milestones.map(m => ({ daysRequired: m.daysRequired, bonusPoints: m.bonusPoints })),
    });
    setShowModal(true);
  };

  const handleSaveRule = async () => {
    if (!form.name.trim()) { toast.error('Rule name is required'); return; }
    if (form.milestones.some(m => m.daysRequired < 1 || m.bonusPoints < 0)) {
      toast.error('All milestones must have valid days (≥1) and points (≥0)');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        activityIds: [],
        milestones: form.milestones.map(m => ({
          id: '',
          ruleId: editingRule?.id ?? '',
          ...m,
        })),
      };
      if (editingRule) {
        await updateRule(editingRule.id, payload);
        toast.success('Streak rule updated!');
      } else {
        await createRule(payload);
        toast.success('Streak rule created!');
      }
      setShowModal(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save rule');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (rule: StreakRule) => {
    try {
      await updateRule(rule.id, { isActive: !rule.isActive });
      toast.success(rule.isActive ? 'Rule disabled' : 'Rule enabled');
    } catch {
      toast.error('Failed to update rule');
    }
  };

  const handleDeleteRule = async (rule: StreakRule) => {
    if (!window.confirm(`Delete "${rule.name}"? This cannot be undone and will remove all participant progress for this rule.`)) return;
    try {
      await deleteRule(rule.id);
      toast.success('Rule deleted');
    } catch {
      toast.error('Failed to delete rule');
    }
  };

  const handleAdjust = async () => {
    if (!adjustTarget || !selectedRuleId) return;
    const val = parseInt(adjustValue, 10);
    if (isNaN(val) || val < 0) { toast.error('Enter a valid streak value (≥0)'); return; }
    if (!adjustReason.trim()) { toast.error('A reason is required for audit log'); return; }
    setAdjustSaving(true);
    try {
      await manualAdjustStreak(adjustTarget.participantId, selectedRuleId, val, adjustReason);
      toast.success(`Streak adjusted to ${val} for ${adjustTarget.name}`);
      setAdjustTarget(null);
      setAdjustValue('');
      setAdjustReason('');
    } catch {
      toast.error('Failed to adjust streak');
    } finally {
      setAdjustSaving(false);
    }
  };

  const handleReset = async (participantId: string, name: string) => {
    const reason = window.prompt(`Reset ${name}'s streak to 0. Enter reason:`);
    if (reason === null) return;
    if (!reason.trim()) { toast.error('Reason is required'); return; }
    try {
      await manualResetStreak(participantId, selectedRuleId, reason);
      toast.success(`Streak reset for ${name}`);
    } catch {
      toast.error('Failed to reset streak');
    }
  };

  const addMilestone = () => {
    setForm(f => ({ ...f, milestones: [...f.milestones, { daysRequired: 0, bonusPoints: 0 }] }));
  };
  const removeMilestone = (idx: number) => {
    setForm(f => ({ ...f, milestones: f.milestones.filter((_, i) => i !== idx) }));
  };
  const updateMilestone = (idx: number, field: 'daysRequired' | 'bonusPoints', val: number) => {
    setForm(f => ({ ...f, milestones: f.milestones.map((m, i) => i === idx ? { ...m, [field]: val } : m) }));
  };

  const selectedRule = streakRules.find(r => r.id === selectedRuleId);
  const participantRecordsForRule = participantStreakRecords.filter(r => r.ruleId === selectedRuleId);

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'rules',        label: 'Streak Rules',         icon: <Flame className="w-4 h-4" /> },
    { id: 'top_hero',     label: 'Top Hero Streak',      icon: <Trophy className="w-4 h-4" /> },
    { id: 'participants', label: 'Participant Progress',  icon: <Users className="w-4 h-4" /> },
    { id: 'audit',        label: 'Audit Logs',           icon: <History className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Flame className="w-7 h-7 text-orange-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Streak Settings</h1>
          <p className="text-sm text-gray-500">Configure streak rules, milestones, and monitor participant progress</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-100">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl transition-colors ${
              tab === t.id
                ? 'bg-white border border-b-white border-gray-100 text-orange-600 -mb-px'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Streak Rules ────────────────────────────────────────────── */}
      {tab === 'rules' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Create configurable streak rules. Each rule awards bonus points at defined milestones.
            </p>
            <Button onClick={openCreate} className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Streak Rule
            </Button>
          </div>

          {rulesLoading ? (
            <Card className="p-8 text-center text-gray-400">Loading rules…</Card>
          ) : streakRules.length === 0 ? (
            <Card className="p-8 text-center text-gray-400">No streak rules yet. Create your first one!</Card>
          ) : (
            <div className="space-y-3">
              {streakRules.map(rule => (
                <Card key={rule.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 w-3 h-3 rounded-full flex-shrink-0 ${rule.isActive ? 'bg-green-400' : 'bg-gray-300'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-800">{rule.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          rule.type === 'daily_action' ? 'bg-blue-100 text-blue-700' :
                          rule.type === 'specific_activities' ? 'bg-purple-100 text-purple-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {rule.type === 'daily_action' ? 'Daily Action' :
                           rule.type === 'specific_activities' ? 'Specific Activities' : 'Top Hero'}
                        </span>
                        {!rule.isActive && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Disabled</span>
                        )}
                      </div>
                      {rule.description && (
                        <p className="text-sm text-gray-500 mt-0.5">{rule.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                        {rule.requireApproved && <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" />Requires approval</span>}
                        {rule.graceDaysEnabled && <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-blue-500" />{rule.graceDaysAllowed} grace day{rule.graceDaysAllowed !== 1 ? 's' : ''}</span>}
                        {rule.cheatPenaltyBreaks && <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-orange-400" />Anti-cheat</span>}
                        <span className="flex items-center gap-1">
                          🎯 {rule.milestones.length} milestone{rule.milestones.length !== 1 ? 's' : ''}:&nbsp;
                          {[...rule.milestones]
                            .sort((a, b) => a.daysRequired - b.daysRequired)
                            .map(m => `${m.daysRequired}d→+${m.bonusPoints}pts`)
                            .join(', ')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleToggleActive(rule)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          rule.isActive ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                        title={rule.isActive ? 'Disable rule' : 'Enable rule'}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                          rule.isActive ? 'translate-x-4.5' : 'translate-x-0.5'
                        }`} />
                      </button>
                      <button
                        onClick={() => openEdit(rule)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit rule"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Top Hero Streak (legacy) ────────────────────────────────── */}
      {tab === 'top_hero' && (
        <div className="space-y-5">
          <Card className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-800">Daily Winner Streaks</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  The participant with the most approved points each day earns the daily top spot.
                  Consecutive days trigger a streak.
                </p>
              </div>
              <button
                onClick={() => updateSettings({ enabled: !settings.enabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.enabled ? 'bg-orange-500' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  settings.enabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="border-t border-gray-100 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Streak length for bonus (days)
                </label>
                <input
                  type="number" min={2} max={365}
                  value={lengthInput} onChange={e => setLengthInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-200 text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">Default: 7 days</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bonus points per milestone
                </label>
                <input
                  type="number" min={1} max={10000}
                  value={pointsInput} onChange={e => setPointsInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-200 text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">Default: 30 points</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSaveTopHero}>Save Settings</Button>
              <Button
                variant="outline" onClick={handleRecalculate} disabled={recalculating}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} />
                Recalculate All Streaks
              </Button>
            </div>
          </Card>

          <Card className="p-5 bg-orange-50 border-orange-100">
            <h3 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4" /> How It Works
            </h3>
            <ul className="text-sm text-orange-700 space-y-1.5 list-disc ms-4">
              <li>Every day, the participant with the most approved points earns the <strong>daily top</strong> spot.</li>
              <li>A streak starts after <strong>2 consecutive days</strong> at the top.</li>
              <li>Every <strong>{settings.streakLengthForBonus} consecutive days</strong> earns <strong>+{settings.bonusPoints} bonus points</strong>.</li>
              <li>Tie-break: earliest accepted submission time wins the day.</li>
              <li>Only approved activity submissions count (not streak bonuses).</li>
            </ul>
          </Card>

          {/* Per-participant top hero streak table */}
          <Card className="p-5">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" /> Participant Streaks
            </h3>
            {participants.length === 0 ? (
              <p className="text-gray-400 text-sm">No participants yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-start py-2 px-3 text-gray-500 font-medium">Participant</th>
                      <th className="text-center py-2 px-3 text-gray-500 font-medium">Current</th>
                      <th className="text-center py-2 px-3 text-gray-500 font-medium">Best</th>
                      <th className="text-center py-2 px-3 text-gray-500 font-medium">Last Win</th>
                      <th className="text-center py-2 px-3 text-gray-500 font-medium">Bonuses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map(user => {
                      const streak = streaks.find(s => s.participantId === user.id);
                      const bonusCount = bonuses.filter(b => b.participantId === user.id).length;
                      return (
                        <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2.5 px-3 font-medium text-gray-800">{user.name}</td>
                          <td className="py-2.5 px-3 text-center">
                            {streak && streak.currentStreak >= 2 ? (
                              <StreakBadge streak={streak.currentStreak} size="sm" />
                            ) : <span className="text-gray-400">—</span>}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {streak && streak.bestStreak >= 2 ? (
                              <span className="font-semibold text-orange-600">🏅 {streak.bestStreak}</span>
                            ) : <span className="text-gray-400">—</span>}
                          </td>
                          <td className="py-2.5 px-3 text-center text-gray-500">
                            {streak?.lastWinDate || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {bonusCount > 0 ? (
                              <span className="font-semibold text-green-600">
                                {bonusCount} × +{settings.bonusPoints}
                              </span>
                            ) : <span className="text-gray-400">0</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Daily Winners Log</h3>
            {dailyWinners.length === 0 ? (
              <p className="text-gray-400 text-sm">No daily winners recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-start py-2 px-3 text-gray-500 font-medium">Date</th>
                      <th className="text-start py-2 px-3 text-gray-500 font-medium">Winner</th>
                      <th className="text-end py-2 px-3 text-gray-500 font-medium">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...dailyWinners]
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .slice(0, 30)
                      .map(w => {
                        const user = users.find(u => u.id === w.winnerId);
                        return (
                          <tr key={w.date} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="py-2 px-3 font-medium text-gray-700">{w.date}</td>
                            <td className="py-2 px-3 text-gray-600">🥇 {user?.name ?? w.winnerId}</td>
                            <td className="py-2 px-3 text-end font-semibold text-blue-600">{w.points} pts</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── Tab: Participant Progress ─────────────────────────────────────── */}
      {tab === 'participants' && (
        <div className="space-y-4">
          {streakRules.length === 0 ? (
            <Card className="p-8 text-center text-gray-400">No streak rules configured yet.</Card>
          ) : (
            <>
              {/* Rule selector */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Viewing rule:</label>
                <select
                  value={selectedRuleId}
                  onChange={e => setSelectedRuleId(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {streakRules.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
                {selectedRule && (
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    selectedRule.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {selectedRule.isActive ? 'Active' : 'Disabled'}
                  </span>
                )}
              </div>

              {/* Adjust dialog */}
              {adjustTarget && (
                <Card className="p-4 border-blue-200 bg-blue-50">
                  <h4 className="font-medium text-blue-800 mb-3">
                    Adjust streak for <strong>{adjustTarget.name}</strong>
                  </h4>
                  <div className="flex gap-3 flex-wrap">
                    <div>
                      <label className="text-xs text-blue-700 mb-1 block">New streak value</label>
                      <input
                        type="number" min={0} value={adjustValue}
                        onChange={e => setAdjustValue(e.target.value)}
                        className="w-28 px-3 py-1.5 rounded-xl border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                        placeholder="days"
                      />
                    </div>
                    <div className="flex-1 min-w-48">
                      <label className="text-xs text-blue-700 mb-1 block">Reason (required for audit)</label>
                      <input
                        type="text" value={adjustReason}
                        onChange={e => setAdjustReason(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                        placeholder="e.g., System error correction"
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <Button size="sm" onClick={handleAdjust} loading={adjustSaving}>Save</Button>
                      <Button size="sm" variant="secondary" onClick={() => setAdjustTarget(null)}>Cancel</Button>
                    </div>
                  </div>
                </Card>
              )}

              <Card className="p-5">
                {participants.length === 0 ? (
                  <p className="text-gray-400 text-sm">No participants yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-start py-2 px-3 text-gray-500 font-medium">Participant</th>
                          <th className="text-center py-2 px-3 text-gray-500 font-medium">Current Streak</th>
                          <th className="text-center py-2 px-3 text-gray-500 font-medium">Best Streak</th>
                          <th className="text-center py-2 px-3 text-gray-500 font-medium">Last Activity</th>
                          <th className="text-center py-2 px-3 text-gray-500 font-medium">Grace Days</th>
                          <th className="text-center py-2 px-3 text-gray-500 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {participants.map(user => {
                          const record = participantRecordsForRule.find(r => r.participantId === user.id);
                          return (
                            <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                              <td className="py-2.5 px-3 font-medium text-gray-800">{user.name}</td>
                              <td className="py-2.5 px-3 text-center">
                                {record && record.currentStreak > 0 ? (
                                  <span className="font-semibold text-orange-600">🔥 {record.currentStreak}</span>
                                ) : <span className="text-gray-400">0</span>}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                {record && record.bestStreak > 0 ? (
                                  <span className="font-semibold text-purple-600">🏅 {record.bestStreak}</span>
                                ) : <span className="text-gray-400">—</span>}
                              </td>
                              <td className="py-2.5 px-3 text-center text-gray-500 text-xs">
                                {record?.lastActivityDate || '—'}
                              </td>
                              <td className="py-2.5 px-3 text-center text-gray-500">
                                {record?.graceDaysUsed ?? 0}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => {
                                      setAdjustTarget({ participantId: user.id, name: user.name });
                                      setAdjustValue(String(record?.currentStreak ?? 0));
                                      setAdjustReason('');
                                    }}
                                    className="text-xs px-2 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                  >
                                    Adjust
                                  </button>
                                  <button
                                    onClick={() => handleReset(user.id, user.name)}
                                    className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                                  >
                                    Reset
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      )}

      {/* ── Tab: Audit Logs ──────────────────────────────────────────────── */}
      {tab === 'audit' && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <History className="w-4 h-4" /> Admin Streak Actions
            </h3>
            <Button size="sm" variant="outline" onClick={() => refreshAuditLogs()}>
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
          {auditLogs.length === 0 ? (
            <p className="text-gray-400 text-sm">No manual adjustments recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-start py-2 px-3 text-gray-500 font-medium">Date</th>
                    <th className="text-start py-2 px-3 text-gray-500 font-medium">Participant</th>
                    <th className="text-start py-2 px-3 text-gray-500 font-medium">Rule</th>
                    <th className="text-center py-2 px-3 text-gray-500 font-medium">Action</th>
                    <th className="text-center py-2 px-3 text-gray-500 font-medium">Change</th>
                    <th className="text-start py-2 px-3 text-gray-500 font-medium">Reason</th>
                    <th className="text-start py-2 px-3 text-gray-500 font-medium">By</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(log => {
                    const participant = users.find(u => u.id === log.participantId);
                    const rule = streakRules.find(r => r.id === log.ruleId);
                    return (
                      <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2 px-3 text-gray-500 text-xs whitespace-nowrap">
                          {log.createdAt.slice(0, 16).replace('T', ' ')}
                        </td>
                        <td className="py-2 px-3 font-medium text-gray-800">
                          {participant?.name ?? log.participantId.slice(0, 8)}
                        </td>
                        <td className="py-2 px-3 text-gray-600 text-xs">
                          {rule?.name ?? log.ruleId.slice(0, 8)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            log.action === 'manual_reset' ? 'bg-red-100 text-red-700' :
                            log.action === 'manual_adjust' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {log.action.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center text-xs">
                          <span className="text-gray-400">{log.oldValue}</span>
                          <span className="mx-1 text-gray-300">→</span>
                          <span className="font-semibold text-gray-700">{log.newValue}</span>
                        </td>
                        <td className="py-2 px-3 text-gray-600 text-xs max-w-48 truncate">{log.reason}</td>
                        <td className="py-2 px-3 text-gray-500 text-xs">
                          {log.performedByName ?? log.performedBy.slice(0, 8)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ── Rule Create/Edit Modal ────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">
                {editingRule ? 'Edit Streak Rule' : 'New Streak Rule'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Basic info */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name *</label>
                <input
                  type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., Daily Action Streak"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} placeholder="Describe what this streak tracks…"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Streak Type</label>
                <select
                  value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as StreakRule['type'] }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="daily_action">Daily Action — any approved activity counts</option>
                  <option value="specific_activities">Specific Activities — only selected activities count</option>
                </select>
              </div>
            </div>

            {/* Rules/settings */}
            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Streak Rules</h4>
              <div className="space-y-2.5">
                {[
                  {
                    key: 'requireApproved', label: 'Only count approved submissions',
                    desc: 'Pending or denied submissions don\'t extend the streak',
                  },
                  {
                    key: 'graceDaysEnabled', label: 'Allow grace days',
                    desc: 'Participant can miss 1 day without breaking the streak',
                  },
                  {
                    key: 'cheatPenaltyBreaks', label: 'Anti-cheat: penalty resets streak',
                    desc: 'Confirmed cheating/flagging immediately resets this streak',
                  },
                  {
                    key: 'duplicateDaysAllowed', label: 'Allow multiple submissions to count per day',
                    desc: 'Off (recommended): multiple submissions on same day still count as 1 streak day',
                  },
                  {
                    key: 'isActive', label: 'Active',
                    desc: 'Inactive rules don\'t track streaks or award rewards',
                  },
                ].map(({ key, label, desc }) => (
                  <label key={key} className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form[key as keyof RuleFormData] as boolean}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 rounded accent-blue-600"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-700">{label}</div>
                      <div className="text-xs text-gray-500">{desc}</div>
                    </div>
                  </label>
                ))}

                {form.graceDaysEnabled && (
                  <div className="ms-7">
                    <label className="text-xs text-gray-600 mb-1 block">Grace days allowed</label>
                    <input
                      type="number" min={1} max={7}
                      value={form.graceDaysAllowed}
                      onChange={e => setForm(f => ({ ...f, graceDaysAllowed: parseInt(e.target.value, 10) || 1 }))}
                      className="w-20 px-3 py-1.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Milestones */}
            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-700">Milestone Rewards</h4>
                <Button size="sm" variant="outline" onClick={addMilestone} className="text-xs">
                  <Plus className="w-3.5 h-3.5" /> Add Milestone
                </Button>
              </div>
              {form.milestones.length === 0 ? (
                <p className="text-xs text-gray-400">No milestones — this rule tracks streaks but doesn't award bonus points.</p>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs text-gray-500 mb-1">
                    <span className="px-2">Days required</span>
                    <span className="px-2">Bonus points</span>
                    <span />
                  </div>
                  {form.milestones.map((m, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                      <input
                        type="number" min={1} value={m.daysRequired}
                        onChange={e => updateMilestone(idx, 'daysRequired', parseInt(e.target.value, 10) || 0)}
                        className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="Days"
                      />
                      <input
                        type="number" min={0} value={m.bonusPoints}
                        onChange={e => updateMilestone(idx, 'bonusPoints', parseInt(e.target.value, 10) || 0)}
                        className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="Points"
                      />
                      <button onClick={() => removeMilestone(idx)} className="p-1.5 text-red-400 hover:text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end border-t border-gray-100 pt-4">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSaveRule} loading={saving}>
                {editingRule ? 'Update Rule' : 'Create Rule'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
