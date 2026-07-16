import type { BehaviorCategory, BehavioralDeduction, DeductionAuditEntry, DeductionStatus } from '../types/deduction';
import { supabase, isSupabaseConfigured } from './supabase';

// ── localStorage keys (demo mode) ────────────────────────────────────────────
const LS_CATEGORIES  = 'sp_behavior_categories';
const LS_DEDUCTIONS  = 'sp_behavioral_deductions';
const LS_AUDIT       = 'sp_deduction_audit_log';

// ── Default categories (seeded if empty) ─────────────────────────────────────
export const DEFAULT_BEHAVIOR_CATEGORIES: BehaviorCategory[] = [
  { id:'cat_disrespect', name:'Disrespectful behavior',               nameAr:'سلوك غير محترم',                   recMin:5,  recMax:25,  maxAllowed:50,  requiresEvidence:false, requiresAdminReview:false, isActive:true, sortOrder:1  },
  { id:'cat_cursing',    name:'Cursing or offensive language',        nameAr:'ألفاظ بذيئة أو مسيئة',            recMin:20, recMax:40,  maxAllowed:75,  requiresEvidence:false, requiresAdminReview:false, isActive:true, sortOrder:2  },
  { id:'cat_insulting',  name:'Insulting another person',             nameAr:'إهانة شخص آخر',                   recMin:20, recMax:40,  maxAllowed:75,  requiresEvidence:false, requiresAdminReview:false, isActive:true, sortOrder:3  },
  { id:'cat_bullying',   name:'Bullying or harassment',               nameAr:'التنمر أو المضايقة',               recMin:40, recMax:100, maxAllowed:100, requiresEvidence:true,  requiresAdminReview:true,  isActive:true, sortOrder:4  },
  { id:'cat_lying',      name:'Lying or dishonesty',                  nameAr:'الكذب أو عدم الصدق',              recMin:15, recMax:30,  maxAllowed:60,  requiresEvidence:false, requiresAdminReview:false, isActive:true, sortOrder:5  },
  { id:'cat_cheating',   name:'Cheating in the competition',          nameAr:'الغش في المسابقة',                recMin:50, recMax:100, maxAllowed:100, requiresEvidence:true,  requiresAdminReview:true,  isActive:true, sortOrder:6  },
  { id:'cat_falsifying', name:'Falsifying activity evidence',         nameAr:'تزوير دليل النشاط',               recMin:30, recMax:75,  maxAllowed:100, requiresEvidence:true,  requiresAdminReview:true,  isActive:true, sortOrder:7  },
  { id:'cat_unsafe',     name:'Unsafe or harmful behavior',           nameAr:'سلوك غير آمن أو ضار',             recMin:50, recMax:100, maxAllowed:100, requiresEvidence:false, requiresAdminReview:true,  isActive:true, sortOrder:8  },
  { id:'cat_property',   name:'Damaging property',                    nameAr:'إتلاف الممتلكات',                 recMin:20, recMax:50,  maxAllowed:100, requiresEvidence:true,  requiresAdminReview:false, isActive:true, sortOrder:9  },
  { id:'cat_rules',      name:'Breaking family or competition rules', nameAr:'مخالفة قواعد الأسرة أو المسابقة', recMin:5,  recMax:15,  maxAllowed:30,  requiresEvidence:false, requiresAdminReview:false, isActive:true, sortOrder:10 },
  { id:'cat_repeated',   name:'Repeated misconduct',                  nameAr:'سوء السلوك المتكرر',              recMin:15, recMax:25,  maxAllowed:50,  requiresEvidence:false, requiresAdminReview:false, isActive:true, sortOrder:11 },
  { id:'cat_other',      name:'Other',                                nameAr:'أخرى',                            recMin:5,  recMax:50,  maxAllowed:100, requiresEvidence:false, requiresAdminReview:false, isActive:true, sortOrder:12 },
];

// ── Mappers: Supabase rows → TypeScript ───────────────────────────────────────
function mapCategory(r: Record<string, unknown>): BehaviorCategory {
  return {
    id:                   r.id as string,
    name:                 r.name as string,
    nameAr:               (r.name_ar as string) ?? '',
    recMin:               r.rec_min as number,
    recMax:               r.rec_max as number,
    maxAllowed:           r.max_allowed as number,
    requiresEvidence:     r.requires_evidence as boolean,
    requiresAdminReview:  r.requires_admin_review as boolean,
    isActive:             r.is_active as boolean,
    sortOrder:            (r.sort_order as number) ?? 0,
  };
}

function mapDeduction(r: Record<string, unknown>): BehavioralDeduction {
  return {
    id:                   r.id as string,
    idempotencyKey:       (r.idempotency_key as string) ?? undefined,
    participantId:        r.participant_id as string,
    participantNameSnap:  (r.participant_name_snap as string) ?? '',
    categoryId:           r.category_id as string,
    categoryLabelSnap:    (r.category_label_snap as string) ?? '',
    pointsDeducted:       r.points_deducted as number,
    reason:               r.reason as string,
    internalNote:         (r.internal_note as string) ?? undefined,
    evidenceNote:         (r.evidence_note as string) ?? undefined,
    incidentDate:         r.incident_date as string,
    incidentTime:         (r.incident_time as string) ?? undefined,
    issuerId:             (r.issuer_id as string) ?? undefined,
    issuerRole:           r.issuer_role as BehavioralDeduction['issuerRole'],
    issuerNameSnap:       (r.issuer_name_snap as string) ?? '',
    status:               r.status as DeductionStatus,
    approvalStatus:       r.approval_status as BehavioralDeduction['approvalStatus'],
    acknowledgmentStatus: r.acknowledgment_status as BehavioralDeduction['acknowledgmentStatus'],
    reversedAt:           (r.reversed_at as string) ?? undefined,
    reversedBy:           (r.reversed_by as string) ?? undefined,
    reversalReason:       (r.reversal_reason as string) ?? undefined,
    createdAt:            r.created_at as string,
    updatedAt:            r.updated_at as string,
  };
}

// ── localStorage helpers ──────────────────────────────────────────────────────
function lsRead<T>(key: string, fallback: T[]): T[] {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; }
  catch { return fallback; }
}
function lsWrite<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// ─────────────────────────────────────────────────────────────────────────────
// BEHAVIOR CATEGORIES
// ─────────────────────────────────────────────────────────────────────────────

export async function getBehaviorCategories(): Promise<BehaviorCategory[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase!.from('behavior_categories').select('*').order('sort_order');
    if (error) throw error;
    return (data as Record<string, unknown>[]).map(mapCategory);
  }
  const cats = lsRead<BehaviorCategory>(LS_CATEGORIES, []);
  if (cats.length === 0) {
    lsWrite(LS_CATEGORIES, DEFAULT_BEHAVIOR_CATEGORIES);
    return DEFAULT_BEHAVIOR_CATEGORIES;
  }
  return cats;
}

export async function updateBehaviorCategory(id: string, updates: Partial<BehaviorCategory>): Promise<void> {
  if (isSupabaseConfigured) {
    const o: Record<string, unknown> = {};
    if (updates.name               !== undefined) o.name                 = updates.name;
    if (updates.nameAr             !== undefined) o.name_ar              = updates.nameAr;
    if (updates.recMin             !== undefined) o.rec_min              = updates.recMin;
    if (updates.recMax             !== undefined) o.rec_max              = updates.recMax;
    if (updates.maxAllowed         !== undefined) o.max_allowed          = updates.maxAllowed;
    if (updates.requiresEvidence   !== undefined) o.requires_evidence    = updates.requiresEvidence;
    if (updates.requiresAdminReview !== undefined) o.requires_admin_review = updates.requiresAdminReview;
    if (updates.isActive           !== undefined) o.is_active            = updates.isActive;
    const { error } = await supabase!.from('behavior_categories').update(o).eq('id', id);
    if (error) throw error;
    return;
  }
  const cats = lsRead<BehaviorCategory>(LS_CATEGORIES, DEFAULT_BEHAVIOR_CATEGORIES);
  lsWrite(LS_CATEGORIES, cats.map(c => c.id === id ? { ...c, ...updates } : c));
}

// ─────────────────────────────────────────────────────────────────────────────
// BEHAVIORAL DEDUCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export interface DeductionFilters {
  participantId?: string;
  status?: DeductionStatus;
  issuerId?: string;
}

export async function getDeductions(filters?: DeductionFilters): Promise<BehavioralDeduction[]> {
  if (isSupabaseConfigured) {
    let q = supabase!.from('behavioral_deductions').select('*').order('created_at', { ascending: false });
    if (filters?.participantId) q = q.eq('participant_id', filters.participantId);
    if (filters?.status)        q = q.eq('status', filters.status);
    if (filters?.issuerId)      q = q.eq('issuer_id', filters.issuerId);
    const { data, error } = await q;
    if (error) throw error;
    return (data as Record<string, unknown>[]).map(mapDeduction);
  }
  let list = lsRead<BehavioralDeduction>(LS_DEDUCTIONS, []);
  if (filters?.participantId) list = list.filter(d => d.participantId === filters.participantId);
  if (filters?.status)        list = list.filter(d => d.status === filters.status);
  if (filters?.issuerId)      list = list.filter(d => d.issuerId === filters.issuerId);
  return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createDeduction(deduction: Omit<BehavioralDeduction, 'id' | 'createdAt' | 'updatedAt'>): Promise<BehavioralDeduction> {
  const now = new Date().toISOString();
  if (isSupabaseConfigured) {
    const { data, error } = await supabase!.from('behavioral_deductions').insert({
      idempotency_key:        deduction.idempotencyKey,
      participant_id:         deduction.participantId,
      participant_name_snap:  deduction.participantNameSnap,
      category_id:            deduction.categoryId,
      category_label_snap:    deduction.categoryLabelSnap,
      points_deducted:        deduction.pointsDeducted,
      reason:                 deduction.reason,
      internal_note:          deduction.internalNote,
      evidence_note:          deduction.evidenceNote,
      incident_date:          deduction.incidentDate,
      incident_time:          deduction.incidentTime,
      issuer_id:              deduction.issuerId,
      issuer_role:            deduction.issuerRole,
      issuer_name_snap:       deduction.issuerNameSnap,
      status:                 deduction.status,
      approval_status:        deduction.approvalStatus,
      acknowledgment_status:  deduction.acknowledgmentStatus,
    }).select().single();
    if (error) throw error;
    return mapDeduction(data as Record<string, unknown>);
  }
  const newDed: BehavioralDeduction = { ...deduction, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
  const list = lsRead<BehavioralDeduction>(LS_DEDUCTIONS, []);
  lsWrite(LS_DEDUCTIONS, [newDed, ...list]);
  return newDed;
}

export async function updateDeduction(id: string, updates: Partial<BehavioralDeduction>): Promise<void> {
  if (isSupabaseConfigured) {
    const o: Record<string, unknown> = {};
    if (updates.status               !== undefined) o.status                = updates.status;
    if (updates.approvalStatus       !== undefined) o.approval_status       = updates.approvalStatus;
    if (updates.acknowledgmentStatus !== undefined) o.acknowledgment_status  = updates.acknowledgmentStatus;
    if (updates.reversedAt           !== undefined) o.reversed_at           = updates.reversedAt;
    if (updates.reversedBy           !== undefined) o.reversed_by           = updates.reversedBy;
    if (updates.reversalReason       !== undefined) o.reversal_reason       = updates.reversalReason;
    const { error } = await supabase!.from('behavioral_deductions').update(o).eq('id', id);
    if (error) throw error;
    return;
  }
  const list = lsRead<BehavioralDeduction>(LS_DEDUCTIONS, []);
  lsWrite(LS_DEDUCTIONS, list.map(d => d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d));
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT LOG
// ─────────────────────────────────────────────────────────────────────────────

export async function addAuditEntry(entry: Omit<DeductionAuditEntry, 'id' | 'createdAt'>): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase!.from('deduction_audit_log').insert({
      deduction_id:     entry.deductionId,
      action:           entry.action,
      actor_id:         entry.actorId,
      actor_role:       entry.actorRole,
      participant_id:   entry.participantId,
      previous_values:  entry.previousValues,
      new_values:       entry.newValues,
      note:             entry.note,
    });
    if (error) throw error;
    return;
  }
  const log = lsRead<DeductionAuditEntry>(LS_AUDIT, []);
  log.unshift({ ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
  lsWrite(LS_AUDIT, log.slice(0, 500));
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPUTED: balance = earned - active deductions
// ─────────────────────────────────────────────────────────────────────────────

export function calcDeductionBalance(
  earnedPoints: number,
  deductions: BehavioralDeduction[],
  participantId: string,
): number {
  const totalDeducted = deductions
    .filter(d => d.participantId === participantId && d.status === 'active')
    .reduce((s, d) => s + d.pointsDeducted, 0);
  return Math.max(0, earnedPoints - totalDeducted);
}
