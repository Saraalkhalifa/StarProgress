import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Plus, RotateCcw, Check, X, ChevronDown, ChevronUp, Download, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useParent } from '../../contexts/ParentContext';
import { Card, Button, Dialog } from '../../components/ui';
import {
  getBehaviorCategories, getDeductions, createDeduction, updateDeduction,
  updateBehaviorCategory, addAuditEntry, calcDeductionBalance, DEFAULT_BEHAVIOR_CATEGORIES,
} from '../../lib/deductionStorage';
import type { BehaviorCategory, BehavioralDeduction } from '../../types/deduction';
import type { User } from '../../types';

// ── helpers ────────────────────────────────────────────────────────────────────
function FieldWrap({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function StatusPill({ status }: { status: BehavioralDeduction['status'] }) {
  const cfg: Record<string, string> = {
    active:         'bg-red-100 text-red-700',
    pending_review: 'bg-amber-100 text-amber-700',
    reversed:       'bg-blue-100 text-blue-700',
    rejected:       'bg-gray-100 text-gray-500',
  };
  const label: Record<string, string> = {
    active: 'Active', pending_review: 'Pending Review', reversed: 'Reversed', rejected: 'Rejected',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cfg[status] ?? ''}`}>{label[status] ?? status}</span>;
}

// ── Deduction form ─────────────────────────────────────────────────────────────
interface DeductFormState {
  participantId: string;
  categoryId: string;
  points: string;
  reason: string;
  internalNote: string;
  evidenceNote: string;
  incidentDate: string;
  incidentTime: string;
  confirmed: boolean;
}

interface DeductFormProps {
  participants: User[];
  categories: BehaviorCategory[];
  deductions: BehavioralDeduction[];
  issuerRole: 'admin' | 'main_admin';
  issuerName: string;
  issuerId: string;
  onSubmit: (fd: DeductFormState, idempKey: string) => Promise<void>;
  onCancel: () => void;
  defaultParticipantId?: string;
}

function DeductForm({ participants, categories, deductions, issuerRole, issuerName, issuerId, onSubmit, onCancel, defaultParticipantId }: DeductFormProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<DeductFormState>({
    participantId: defaultParticipantId ?? '',
    categoryId: '', points: '', reason: '', internalNote: '',
    evidenceNote: '', incidentDate: today, incidentTime: '', confirmed: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof DeductFormState, string>>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const idempRef = useRef<string | null>(null);

  const activeParticipants = participants.filter(p => p.accountStatus === 'active' && p.role === 'participant');
  const selPart = activeParticipants.find(p => p.id === form.participantId);
  const selCat  = categories.find(c => c.id === form.categoryId);
  const pts     = parseInt(form.points, 10);

  // earned points for this participant (from the data context — prop drilling via parent)
  // We pass earned points from parent and compute balance here
  const activeDeductions = deductions.filter(d => d.participantId === form.participantId && d.status === 'active');
  const totalDeducted = activeDeductions.reduce((s, d) => s + d.pointsDeducted, 0);

  const isLarge = !isNaN(pts) && pts >= 50;
  const needsReview = selCat?.requiresAdminReview && issuerRole !== 'main_admin';

  function validate(): boolean {
    const e: typeof errors = {};
    if (!form.participantId) e.participantId = 'Select a participant.';
    if (!form.categoryId)    e.categoryId    = 'Select a category.';
    if (!form.points || isNaN(pts) || pts < 1) e.points = 'Enter a whole number ≥ 1.';
    if (selCat && !isNaN(pts) && pts > selCat.maxAllowed) e.points = `Max for this category is ${selCat.maxAllowed} pts.`;
    if (!form.reason.trim() || form.reason.trim().length < 10) e.reason = 'Reason must be at least 10 characters.';
    if (!form.incidentDate) e.incidentDate = 'Enter the incident date.';
    if (selCat?.requiresEvidence && !form.evidenceNote.trim()) e.evidenceNote = 'Evidence is required for this category.';
    if (!form.confirmed) e.confirmed = 'Please confirm before submitting.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setShowConfirm(true);
  }

  async function handleConfirm() {
    if (!idempRef.current) idempRef.current = `${performance.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
    setSubmitting(true);
    try { await onSubmit(form, idempRef.current!); }
    finally { setSubmitting(false); setShowConfirm(false); idempRef.current = null; }
  }

  const F = FieldWrap;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-red-500" /> Record Behavioral Incident
      </h2>

      <F label="Participant *" error={errors.participantId}>
        <select value={form.participantId} onChange={e => setForm(p => ({ ...p, participantId: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-300 focus:border-red-400">
          <option value="">Select participant…</option>
          {activeParticipants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </F>

      {selPart && totalDeducted > 0 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          {selPart.name} already has <strong>{activeDeductions.length}</strong> active deduction(s) totalling <strong>-{totalDeducted} pts</strong>.
        </div>
      )}

      <F label="Category *" error={errors.categoryId}>
        <select value={form.categoryId} onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-300 focus:border-red-400">
          <option value="">Select category…</option>
          {categories.filter(c => c.isActive).map(c => (
            <option key={c.id} value={c.id}>{c.name} (recommended: {c.recMin}–{c.recMax} pts)</option>
          ))}
        </select>
        {selCat && (
          <p className="text-xs text-gray-500 mt-1">
            Recommended: {selCat.recMin}–{selCat.recMax} pts · Max: {selCat.maxAllowed} pts
            {selCat.requiresEvidence && ' · Evidence required'}
            {selCat.requiresAdminReview && ' · Admin review required'}
          </p>
        )}
      </F>

      <div className="grid grid-cols-2 gap-4">
        <F label="Points to Deduct *" error={errors.points}>
          <input type="number" min="1" max={selCat?.maxAllowed ?? 500}
            value={form.points}
            onChange={e => setForm(p => ({ ...p, points: e.target.value }))}
            placeholder={selCat ? `${selCat.recMin}–${selCat.recMax}` : '1–100'}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-300 focus:border-red-400" />
        </F>
        <F label="Incident Date *" error={errors.incidentDate}>
          <input type="date" value={form.incidentDate} max={today}
            onChange={e => setForm(p => ({ ...p, incidentDate: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-300 focus:border-red-400" />
        </F>
      </div>

      <F label="Incident Time (optional)">
        <input type="time" value={form.incidentTime}
          onChange={e => setForm(p => ({ ...p, incidentTime: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-300 focus:border-red-400" />
      </F>

      <F label="Reason * (min 10 characters)" error={errors.reason}>
        <textarea rows={3} value={form.reason}
          onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
          placeholder="Describe what happened and why this deduction is warranted…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-300 focus:border-red-400 resize-none" />
      </F>

      {selCat?.requiresEvidence && (
        <F label="Evidence / Description *" error={errors.evidenceNote}>
          <textarea rows={2} value={form.evidenceNote}
            onChange={e => setForm(p => ({ ...p, evidenceNote: e.target.value }))}
            placeholder="Describe the evidence (URL, witness names, document reference…)"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-300 focus:border-red-400 resize-none" />
        </F>
      )}

      <F label="Internal Note (optional — not shown to participant)">
        <textarea rows={2} value={form.internalNote}
          onChange={e => setForm(p => ({ ...p, internalNote: e.target.value }))}
          placeholder="Admin-only note…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-300 focus:border-red-400 resize-none" />
      </F>

      {isLarge && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>This is a large deduction ({pts} pts). Please double-check it is appropriate.</span>
        </div>
      )}
      {needsReview && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          This category requires Main Admin review before taking effect.
        </div>
      )}

      <label className="flex items-start gap-3 cursor-pointer mb-6">
        <input type="checkbox" checked={form.confirmed} onChange={e => setForm(p => ({ ...p, confirmed: e.target.checked }))}
          className="mt-0.5 w-4 h-4 accent-red-500" />
        <span className="text-sm text-gray-700">
          I confirm this incident occurred and the deduction is appropriate.
          {needsReview && ' The deduction will be pending Main Admin approval.'}
        </span>
      </label>
      {errors.confirmed && <p className="text-xs text-red-600 -mt-4 mb-4">{errors.confirmed}</p>}

      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant="danger" onClick={handleSubmit} disabled={submitting}>Record Incident</Button>
      </div>

      {showConfirm && (
        <Dialog open onClose={() => setShowConfirm(false)}>
          <div className="p-6 max-w-sm">
            <h3 className="font-bold text-gray-900 mb-2">Confirm Deduction</h3>
            <p className="text-sm text-gray-600 mb-1"><strong>Participant:</strong> {selPart?.name}</p>
            <p className="text-sm text-gray-600 mb-1"><strong>Category:</strong> {selCat?.name}</p>
            <p className="text-sm text-gray-600 mb-4"><strong>Points:</strong> -{pts}</p>
            {needsReview
              ? <p className="text-sm text-amber-700 mb-4">This will be submitted for Main Admin review.</p>
              : <p className="text-sm text-red-700 mb-4">This will immediately deduct <strong>{pts} pts</strong> from {selPart?.name}.</p>
            }
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowConfirm(false)}>Cancel</Button>
              <Button variant="danger" onClick={handleConfirm} disabled={submitting}>
                {submitting ? 'Saving…' : 'Confirm'}
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}

// ── Reversal modal ─────────────────────────────────────────────────────────────
function ReversalModal({ deduction, onConfirm, onClose }: {
  deduction: BehavioralDeduction;
  onConfirm: (reason: string) => Promise<void>;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function go() {
    if (reason.trim().length < 10) { setErr('Reason must be at least 10 characters.'); return; }
    setBusy(true);
    try { await onConfirm(reason); }
    finally { setBusy(false); }
  }
  return (
    <Dialog open onClose={onClose}>
      <div className="p-6 max-w-md">
        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><RotateCcw className="w-4 h-4" /> Reverse Deduction</h3>
        <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
          <p><strong>{deduction.participantNameSnap}</strong> · -{deduction.pointsDeducted} pts</p>
          <p className="text-gray-500">{deduction.categoryLabelSnap} · {fmtDate(deduction.incidentDate)}</p>
        </div>
        <p className="text-sm text-gray-600 mb-3">Reversing will restore <strong>+{deduction.pointsDeducted} pts</strong> to {deduction.participantNameSnap}.</p>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Reversal Reason * (min 10 characters)</label>
        <textarea rows={3} value={reason} onChange={e => { setReason(e.target.value); setErr(''); }}
          placeholder="Explain why this deduction is being reversed…"
          className={`w-full border rounded-lg px-3 py-2 text-sm resize-none ${err ? 'border-red-400' : 'border-gray-300'}`} />
        {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={go} disabled={busy}>
            {busy ? 'Reversing…' : 'Confirm Reversal'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

// ── Category Settings ─────────────────────────────────────────────────────────
function CategorySettings({ categories, setCategories }: {
  categories: BehaviorCategory[];
  setCategories: React.Dispatch<React.SetStateAction<BehaviorCategory[]>>;
}) {
  const [editCat, setEditCat] = useState<BehaviorCategory | null>(null);
  const [form, setForm] = useState<Partial<BehaviorCategory>>({});
  const [saving, setSaving] = useState(false);
  async function save() {
    if (!editCat) return;
    setSaving(true);
    try {
      const upd = { ...form, recMin: Number(form.recMin), recMax: Number(form.recMax), maxAllowed: Number(form.maxAllowed) };
      if (upd.recMin < 1 || upd.recMax < upd.recMin || upd.maxAllowed < upd.recMax) {
        toast.error('Check values: recMin ≤ recMax ≤ maxAllowed, all ≥ 1'); return;
      }
      await updateBehaviorCategory(editCat.id, upd);
      setCategories(prev => prev.map(c => c.id === editCat.id ? { ...c, ...upd } : c));
      setEditCat(null);
      toast.success('Category updated');
    } finally { setSaving(false); }
  }
  return (
    <div>
      <h3 className="font-bold text-gray-800 mb-3">Behavior Categories</h3>
      <p className="text-sm text-gray-500 mb-4">Configure recommended point ranges and requirements for each incident type.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50">
            <th className="text-left px-3 py-2 font-semibold text-gray-600">Category</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-600">Rec. Range</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-600">Max</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-600">Evidence</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-600">Review</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-600">Active</th>
            <th className="px-3 py-2"></th>
          </tr></thead>
          <tbody>{categories.map(c => (
            <tr key={c.id} className={`border-b ${!c.isActive ? 'opacity-50' : ''}`}>
              <td className="px-3 py-2 font-medium">{c.name}</td>
              <td className="px-3 py-2 text-gray-500">{c.recMin}–{c.recMax}</td>
              <td className="px-3 py-2 text-gray-500">{c.maxAllowed}</td>
              <td className="px-3 py-2">{c.requiresEvidence ? <span className="text-green-600 font-medium">Yes</span> : <span className="text-gray-400">No</span>}</td>
              <td className="px-3 py-2">{c.requiresAdminReview ? <span className="text-amber-600 font-medium">Yes</span> : <span className="text-gray-400">No</span>}</td>
              <td className="px-3 py-2">{c.isActive ? <span className="text-green-600">Yes</span> : <span className="text-red-500">No</span>}</td>
              <td className="px-3 py-2">
                <button onClick={() => { setEditCat(c); setForm({ ...c }); }}
                  className="text-xs text-blue-600 hover:underline">Edit</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {editCat && (
        <Dialog open onClose={() => setEditCat(null)}>
          <div className="p-6 max-w-md">
            <h3 className="font-bold text-gray-900 mb-4">Edit: {editCat.name}</h3>
            {[['Name (EN)', 'name', 'text'], ['Name (AR)', 'nameAr', 'text'], ['Rec. Min', 'recMin', 'number'], ['Rec. Max', 'recMax', 'number'], ['Max Allowed', 'maxAllowed', 'number']].map(([label, key, type]) => (
              <div key={key as string} className="mb-3">
                <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                <input type={type as string} value={String(form[key as keyof BehaviorCategory] ?? '')}
                  onChange={e => setForm(p => ({ ...p, [key as string]: type === 'number' ? e.target.value : e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
              </div>
            ))}
            <div className="flex gap-4 mb-4">
              {(['requiresEvidence', 'requiresAdminReview', 'isActive'] as const).map(key => (
                <label key={key} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={!!form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))} />
                  {key === 'requiresEvidence' ? 'Requires evidence' : key === 'requiresAdminReview' ? 'Requires review' : 'Active'}
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setEditCat(null)}>Cancel</Button>
              <Button variant="primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export function BehavioralDeductions() {
  const { currentUser, isMainAdmin } = useAuth();
  const { users, getAcceptedPoints, notifications: dataNotifs } = useData();
  const { links } = useParent();

  const [categories, setCategories]   = useState<BehaviorCategory[]>([]);
  const [deductions, setDeductions]   = useState<BehavioralDeduction[]>([]);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState<'list' | 'categories'>('list');
  const [showForm, setShowForm]       = useState(false);
  const [filterStatus, setFilterStatus]             = useState('');
  const [filterParticipant, setFilterParticipant]   = useState('');
  const [filterCat, setFilterCat]                   = useState('');
  const [searchQ, setSearchQ]                       = useState('');
  const [expandedId, setExpandedId]                 = useState<string | null>(null);
  const [reversalTarget, setReversalTarget]         = useState<BehavioralDeduction | null>(null);
  const [approveTarget, setApproveTarget]           = useState<BehavioralDeduction | null>(null);
  const [rejectTarget, setRejectTarget]             = useState<BehavioralDeduction | null>(null);

  const participants = users.filter(u => u.role === 'participant' && !u.isDeleted);

  useEffect(() => {
    Promise.all([getBehaviorCategories(), getDeductions()])
      .then(([cats, deds]) => { setCategories(cats); setDeductions(deds); })
      .catch(() => { setCategories(DEFAULT_BEHAVIOR_CATEGORIES); })
      .finally(() => setLoading(false));
  }, []);

  const active    = deductions.filter(d => d.status === 'active');
  const pending   = deductions.filter(d => d.status === 'pending_review');
  const totalDed  = active.reduce((s, d) => s + d.pointsDeducted, 0);

  // Filtered rows
  let rows = [...deductions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  if (filterStatus)      rows = rows.filter(r => r.status === filterStatus);
  if (filterParticipant) rows = rows.filter(r => r.participantId === filterParticipant);
  if (filterCat)         rows = rows.filter(r => r.categoryId === filterCat);
  if (searchQ) {
    const q = searchQ.toLowerCase();
    rows = rows.filter(r => r.participantNameSnap.toLowerCase().includes(q) || r.reason.toLowerCase().includes(q) || r.categoryLabelSnap.toLowerCase().includes(q));
  }

  async function handleDeductSubmit(fd: DeductFormState, idempKey: string) {
    const participant = participants.find(p => p.id === fd.participantId);
    const category    = categories.find(c => c.id === fd.categoryId);
    if (!participant || !category) return;

    const pts = parseInt(fd.points, 10);
    const needsReview = category.requiresAdminReview && !isMainAdmin;
    const status = needsReview ? 'pending_review' : 'active';

    const newDed = await createDeduction({
      idempotencyKey:        idempKey,
      participantId:         participant.id,
      participantNameSnap:   participant.name,
      categoryId:            category.id,
      categoryLabelSnap:     category.name,
      pointsDeducted:        pts,
      reason:                fd.reason,
      internalNote:          fd.internalNote || undefined,
      evidenceNote:          fd.evidenceNote || undefined,
      incidentDate:          fd.incidentDate,
      incidentTime:          fd.incidentTime || undefined,
      issuerId:              currentUser?.id,
      issuerRole:            currentUser?.role as 'admin' | 'main_admin',
      issuerNameSnap:        currentUser?.name ?? 'Admin',
      status,
      approvalStatus:        needsReview ? 'pending' : 'approved',
      acknowledgmentStatus:  'not_viewed',
    });

    await addAuditEntry({
      deductionId:  newDed.id,
      action:       'deduction_created',
      actorId:      currentUser?.id,
      actorRole:    currentUser?.role,
      participantId: participant.id,
      newValues:    { points: pts, categoryId: category.id, status },
    });

    setDeductions(prev => [newDed, ...prev]);
    setShowForm(false);
    toast.success(needsReview ? 'Submitted for review.' : `-${pts} pts recorded for ${participant.name}.`);
  }

  async function handleReverse(deduction: BehavioralDeduction, reason: string) {
    const now = new Date().toISOString();
    await updateDeduction(deduction.id, {
      status: 'reversed',
      reversedAt: now,
      reversedBy: currentUser?.id,
      reversalReason: reason,
    });
    await addAuditEntry({
      deductionId:   deduction.id,
      action:        'deduction_reversed',
      actorId:       currentUser?.id,
      actorRole:     currentUser?.role,
      participantId: deduction.participantId,
      previousValues: { status: 'active' },
      newValues:     { status: 'reversed', reversalReason: reason },
    });
    setDeductions(prev => prev.map(d => d.id === deduction.id ? { ...d, status: 'reversed', reversedAt: now, reversedBy: currentUser?.id, reversalReason: reason } : d));
    setReversalTarget(null);
    toast.success(`Reversed. +${deduction.pointsDeducted} pts restored.`);
  }

  async function handleApprove(deduction: BehavioralDeduction) {
    await updateDeduction(deduction.id, { status: 'active', approvalStatus: 'approved' });
    await addAuditEntry({ deductionId: deduction.id, action: 'deduction_approved', actorId: currentUser?.id, actorRole: currentUser?.role, participantId: deduction.participantId, previousValues: { status: 'pending_review' }, newValues: { status: 'active' } });
    setDeductions(prev => prev.map(d => d.id === deduction.id ? { ...d, status: 'active', approvalStatus: 'approved' } : d));
    setApproveTarget(null);
    toast.success('Deduction approved and applied.');
  }

  async function handleReject(deduction: BehavioralDeduction) {
    await updateDeduction(deduction.id, { status: 'rejected', approvalStatus: 'rejected' });
    await addAuditEntry({ deductionId: deduction.id, action: 'deduction_rejected', actorId: currentUser?.id, actorRole: currentUser?.role, participantId: deduction.participantId, previousValues: { status: 'pending_review' }, newValues: { status: 'rejected' } });
    setDeductions(prev => prev.map(d => d.id === deduction.id ? { ...d, status: 'rejected', approvalStatus: 'rejected' } : d));
    setRejectTarget(null);
    toast.success('Deduction rejected.');
  }

  function exportCSV() {
    const header = 'ID,Participant,Category,Points,Status,Issuer,Role,Date,Reason';
    const csvRows = deductions.map(d =>
      [d.id, `"${d.participantNameSnap}"`, `"${d.categoryLabelSnap}"`, d.pointsDeducted, d.status, `"${d.issuerNameSnap}"`, d.issuerRole, d.incidentDate, `"${d.reason.replace(/"/g, '""')}"`].join(',')
    );
    const blob = new Blob([header + '\n' + csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'behavioral-deductions.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported!');
  }

  if (loading) {
    return <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-500" /> Behavioral Incidents
          </h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage behavioral deductions with a full audit trail.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={exportCSV}><Download className="w-4 h-4 me-1" />Export CSV</Button>
          <Button variant="danger" onClick={() => setShowForm(true)}><Plus className="w-4 h-4 me-1" />Record Incident</Button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Active', value: active.length, sub: `-${totalDed} pts total`, color: 'text-red-600' },
          { label: 'Pending Review', value: pending.length, color: 'text-amber-600' },
          { label: 'Total Records', value: deductions.length, color: 'text-gray-700' },
          { label: 'Participants Affected', value: new Set(active.map(d => d.participantId)).size, color: 'text-blue-600' },
        ].map(s => (
          <Card key={s.label} className="p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">{s.label}</p>
            {s.sub && <p className="text-xs text-gray-400">{s.sub}</p>}
          </Card>
        ))}
      </div>

      {pending.length > 0 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <strong>{pending.length}</strong> deduction{pending.length !== 1 ? 's' : ''} awaiting review.
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-200">
        {[{ id: 'list', label: 'Deduction Records' }, { id: 'categories', label: 'Categories' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'categories' && <Card className="p-4"><CategorySettings categories={categories} setCategories={setCategories} /></Card>}

      {tab === 'list' && (
        <>
          {/* Filters */}
          <Card className="p-4 mb-4">
            <div className="flex flex-wrap gap-3">
              <input placeholder="Search participant, reason…" value={searchQ} onChange={e => setSearchQ(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm flex-1 min-w-40" />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending_review">Pending Review</option>
                <option value="reversed">Reversed</option>
                <option value="rejected">Rejected</option>
              </select>
              <select value={filterParticipant} onChange={e => setFilterParticipant(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
                <option value="">All Participants</option>
                {participants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <p className="text-xs text-gray-400 mt-2">{rows.length} record{rows.length !== 1 ? 's' : ''}</p>
          </Card>

          {/* Table */}
          <Card className="p-0 overflow-hidden">
            {rows.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No deduction records found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 border-b">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Participant</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Category</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Points</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Issuer</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr></thead>
                  <tbody>
                    {rows.map(ded => (
                      <React.Fragment key={ded.id}>
                        <tr onClick={() => setExpandedId(expandedId === ded.id ? null : ded.id)}
                          className="border-b hover:bg-gray-50 cursor-pointer">
                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(ded.incidentDate)}</td>
                          <td className="px-4 py-3 font-medium text-blue-700">{ded.participantNameSnap}</td>
                          <td className="px-4 py-3 text-gray-700 max-w-[160px] truncate">{ded.categoryLabelSnap}</td>
                          <td className="px-4 py-3 font-bold text-red-600">-{ded.pointsDeducted}</td>
                          <td className="px-4 py-3 text-gray-500">{ded.issuerNameSnap} <span className="text-xs">({ded.issuerRole})</span></td>
                          <td className="px-4 py-3"><StatusPill status={ded.status} /></td>
                          <td className="px-4 py-3 text-end" onClick={e => e.stopPropagation()}>
                            <div className="flex gap-1 justify-end flex-wrap">
                              {ded.status === 'active' && isMainAdmin && (
                                <button onClick={() => setReversalTarget(ded)}
                                  className="text-xs px-2 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium">
                                  Reverse
                                </button>
                              )}
                              {ded.status === 'pending_review' && isMainAdmin && (
                                <>
                                  <button onClick={() => setApproveTarget(ded)}
                                    className="text-xs px-2 py-1 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 font-medium">
                                    Approve
                                  </button>
                                  <button onClick={() => setRejectTarget(ded)}
                                    className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium">
                                    Reject
                                  </button>
                                </>
                              )}
                              {expandedId === ded.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                            </div>
                          </td>
                        </tr>
                        {expandedId === ded.id && (
                          <tr className="bg-gray-50 border-b">
                            <td colSpan={7} className="px-4 py-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                                <p><strong>Reason:</strong> {ded.reason}</p>
                                <p><strong>Recorded:</strong> {new Date(ded.createdAt).toLocaleString()}</p>
                                {ded.incidentTime && <p><strong>Time:</strong> {ded.incidentTime}</p>}
                                {ded.evidenceNote && <p><strong>Evidence:</strong> {ded.evidenceNote}</p>}
                                {ded.internalNote && <p><strong>Internal note:</strong> {ded.internalNote}</p>}
                                {ded.status === 'reversed' && <p className="col-span-2"><strong>Reversal reason:</strong> {ded.reversalReason}</p>}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      {/* Modals */}
      {showForm && (
        <Dialog open onClose={() => setShowForm(false)}>
          <div className="p-6 max-w-lg w-full">
            <DeductForm participants={participants} categories={categories} deductions={deductions}
              issuerRole={currentUser?.role as 'admin' | 'main_admin'}
              issuerName={currentUser?.name ?? 'Admin'}
              issuerId={currentUser?.id ?? ''}
              onSubmit={handleDeductSubmit}
              onCancel={() => setShowForm(false)} />
          </div>
        </Dialog>
      )}

      {reversalTarget && (
        <ReversalModal deduction={reversalTarget}
          onConfirm={r => handleReverse(reversalTarget, r)}
          onClose={() => setReversalTarget(null)} />
      )}

      {approveTarget && (
        <Dialog open onClose={() => setApproveTarget(null)}>
          <div className="p-6 max-w-sm">
            <h3 className="font-bold text-gray-900 mb-3">Approve Deduction?</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will immediately deduct <strong>{approveTarget.pointsDeducted} pts</strong> from {approveTarget.participantNameSnap}.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setApproveTarget(null)}>Cancel</Button>
              <Button variant="primary" onClick={() => handleApprove(approveTarget)}>Approve</Button>
            </div>
          </div>
        </Dialog>
      )}

      {rejectTarget && (
        <Dialog open onClose={() => setRejectTarget(null)}>
          <div className="p-6 max-w-sm">
            <h3 className="font-bold text-gray-900 mb-3">Reject Deduction?</h3>
            <p className="text-sm text-gray-600 mb-4">No points will be deducted from {rejectTarget.participantNameSnap}.</p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setRejectTarget(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => handleReject(rejectTarget)}>Reject</Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
