import type {
  ParentChildLink, ParentAccessRequest, ChildConnectionCode,
  ParentPermissions, RelationshipType, LinkStatus, AccessRequestStatus,
  DEFAULT_PARENT_PERMISSIONS,
} from '../types';
import { DEFAULT_PARENT_PERMISSIONS as DEFAULTS } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';
import { generateId } from './utils';

// ── localStorage keys (demo mode) ─────────────────────────────────────────────
const LS_LINKS    = 'sp_parent_links';
const LS_REQUESTS = 'sp_access_requests';
const LS_CODES    = 'sp_connection_codes';

function lsGet<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]') as T[]; }
  catch { return []; }
}
function lsSet<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// ── Row mappers ───────────────────────────────────────────────────────────────
function mapLink(r: Record<string, unknown>): ParentChildLink {
  return {
    id:               r.id as string,
    parentId:         r.parent_id as string,
    participantId:    r.participant_id as string,
    relationshipType: r.relationship_type as RelationshipType,
    status:           r.status as LinkStatus,
    permissions:      (r.permissions as ParentPermissions) ?? { ...DEFAULTS },
    requestedBy:      (r.requested_by as 'parent' | 'admin' | 'main_admin') ?? 'parent',
    approvedBy:       (r.approved_by as string) ?? undefined,
    approvedAt:       (r.approved_at as string) ?? undefined,
    revokedBy:        (r.revoked_by as string) ?? undefined,
    revokedAt:        (r.revoked_at as string) ?? undefined,
    adminNote:        (r.admin_note as string) ?? undefined,
    createdAt:        r.created_at as string,
    updatedAt:        (r.updated_at as string) ?? (r.created_at as string),
    // joined via nested select
    parentName:        (r.parent as Record<string, unknown>)?.name as string | undefined,
    participantName:   (r.participant as Record<string, unknown>)?.name as string | undefined,
    participantUsername: (r.participant as Record<string, unknown>)?.username as string | undefined,
  };
}

function mapRequest(r: Record<string, unknown>): ParentAccessRequest {
  return {
    id:                     r.id as string,
    parentId:               r.parent_id as string,
    requestedChildUsername: (r.requested_child_username as string) ?? undefined,
    requestedChildCode:     (r.requested_child_code as string) ?? undefined,
    matchedParticipantId:   (r.matched_participant_id as string) ?? undefined,
    relationshipType:       r.relationship_type as RelationshipType,
    requestMessage:         (r.request_message as string) ?? undefined,
    status:                 r.status as AccessRequestStatus,
    reviewedBy:             (r.reviewed_by as string) ?? undefined,
    reviewNote:             (r.review_note as string) ?? undefined,
    createdAt:              r.created_at as string,
    reviewedAt:             (r.reviewed_at as string) ?? undefined,
    // joined
    parentName:             (r.parent as Record<string, unknown>)?.name as string | undefined,
    parentEmail:            (r.parent as Record<string, unknown>)?.email as string | undefined,
    parentPhone:            (r.parent as Record<string, unknown>)?.phone_number as string | undefined,
    matchedParticipantName:     (r.matched_participant as Record<string, unknown>)?.name as string | undefined,
    matchedParticipantUsername: (r.matched_participant as Record<string, unknown>)?.username as string | undefined,
  };
}

function mapCode(r: Record<string, unknown>): ChildConnectionCode {
  return {
    id:            r.id as string,
    participantId: r.participant_id as string,
    code:          r.code as string,
    status:        r.status as ChildConnectionCode['status'],
    expiresAt:     (r.expires_at as string) ?? undefined,
    createdAt:     r.created_at as string,
    createdBy:     (r.created_by as string) ?? undefined,
  };
}

// ── Link queries ──────────────────────────────────────────────────────────────
export async function getLinksForParent(parentId: string): Promise<ParentChildLink[]> {
  if (isSupabaseConfigured) {
    const { data } = await supabase!
      .from('parent_child_links')
      .select('*, parent:parent_id(name, email, phone_number), participant:participant_id(name, username)')
      .eq('parent_id', parentId)
      .order('created_at', { ascending: false });
    return (data ?? []).map(r => mapLink(r as Record<string, unknown>));
  }
  return lsGet<ParentChildLink>(LS_LINKS).filter(l => l.parentId === parentId);
}

export async function getLinksForParticipant(participantId: string): Promise<ParentChildLink[]> {
  if (isSupabaseConfigured) {
    const { data } = await supabase!
      .from('parent_child_links')
      .select('*, parent:parent_id(name, email, phone_number), participant:participant_id(name, username)')
      .eq('participant_id', participantId)
      .order('created_at', { ascending: false });
    return (data ?? []).map(r => mapLink(r as Record<string, unknown>));
  }
  return lsGet<ParentChildLink>(LS_LINKS).filter(l => l.participantId === participantId);
}

export async function getAllLinks(): Promise<ParentChildLink[]> {
  if (isSupabaseConfigured) {
    const { data } = await supabase!
      .from('parent_child_links')
      .select('*, parent:parent_id(name, email, phone_number), participant:participant_id(name, username)')
      .order('created_at', { ascending: false });
    return (data ?? []).map(r => mapLink(r as Record<string, unknown>));
  }
  return lsGet<ParentChildLink>(LS_LINKS);
}

export async function createLink(data: Omit<ParentChildLink, 'id' | 'createdAt' | 'updatedAt'>): Promise<ParentChildLink> {
  const now = new Date().toISOString();
  if (isSupabaseConfigured) {
    const { data: row, error } = await supabase!
      .from('parent_child_links')
      .insert({
        parent_id:        data.parentId,
        participant_id:   data.participantId,
        relationship_type: data.relationshipType,
        status:           data.status,
        permissions:      data.permissions,
        requested_by:     data.requestedBy,
        approved_by:      data.approvedBy ?? null,
        approved_at:      data.approvedAt ?? null,
        admin_note:       data.adminNote ?? null,
      })
      .select('*, parent:parent_id(name, email, phone_number), participant:participant_id(name, username)')
      .single();
    if (error) throw new Error(error.message);
    return mapLink(row as Record<string, unknown>);
  }
  const link: ParentChildLink = { ...data, id: generateId(), createdAt: now, updatedAt: now };
  lsSet(LS_LINKS, [link, ...lsGet<ParentChildLink>(LS_LINKS)]);
  return link;
}

export async function updateLink(id: string, data: Partial<ParentChildLink>): Promise<void> {
  if (isSupabaseConfigured) {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.status           !== undefined) patch.status            = data.status;
    if (data.permissions      !== undefined) patch.permissions       = data.permissions;
    if (data.approvedBy       !== undefined) patch.approved_by       = data.approvedBy;
    if (data.approvedAt       !== undefined) patch.approved_at       = data.approvedAt;
    if (data.revokedBy        !== undefined) patch.revoked_by        = data.revokedBy;
    if (data.revokedAt        !== undefined) patch.revoked_at        = data.revokedAt;
    if (data.adminNote        !== undefined) patch.admin_note        = data.adminNote;
    if (data.relationshipType !== undefined) patch.relationship_type = data.relationshipType;
    await supabase!.from('parent_child_links').update(patch).eq('id', id);
    return;
  }
  lsSet(LS_LINKS, lsGet<ParentChildLink>(LS_LINKS).map(l => l.id === id ? { ...l, ...data, updatedAt: new Date().toISOString() } : l));
}

// ── Access request queries ────────────────────────────────────────────────────
export async function getAccessRequests(): Promise<ParentAccessRequest[]> {
  if (isSupabaseConfigured) {
    const { data } = await supabase!
      .from('parent_access_requests')
      .select('*, parent:parent_id(name, email, phone_number), matched_participant:matched_participant_id(name, username)')
      .order('created_at', { ascending: false });
    return (data ?? []).map(r => mapRequest(r as Record<string, unknown>));
  }
  return lsGet<ParentAccessRequest>(LS_REQUESTS);
}

export async function getAccessRequestsForParent(parentId: string): Promise<ParentAccessRequest[]> {
  if (isSupabaseConfigured) {
    const { data } = await supabase!
      .from('parent_access_requests')
      .select('*, parent:parent_id(name, email, phone_number), matched_participant:matched_participant_id(name, username)')
      .eq('parent_id', parentId)
      .order('created_at', { ascending: false });
    return (data ?? []).map(r => mapRequest(r as Record<string, unknown>));
  }
  return lsGet<ParentAccessRequest>(LS_REQUESTS).filter(r => r.parentId === parentId);
}

export async function createAccessRequest(
  data: Omit<ParentAccessRequest, 'id' | 'status' | 'createdAt' | 'reviewedAt' | 'reviewedBy' | 'reviewNote' | 'parentName' | 'parentEmail' | 'parentPhone' | 'matchedParticipantName' | 'matchedParticipantUsername'>
): Promise<ParentAccessRequest> {
  const now = new Date().toISOString();
  if (isSupabaseConfigured) {
    const { data: row, error } = await supabase!
      .from('parent_access_requests')
      .insert({
        parent_id:               data.parentId,
        requested_child_username: data.requestedChildUsername ?? null,
        requested_child_code:    data.requestedChildCode ?? null,
        matched_participant_id:  data.matchedParticipantId ?? null,
        relationship_type:       data.relationshipType,
        request_message:         data.requestMessage ?? null,
        status:                  'pending',
      })
      .select('*, parent:parent_id(name, email, phone_number), matched_participant:matched_participant_id(name, username)')
      .single();
    if (error) throw new Error(error.message);
    return mapRequest(row as Record<string, unknown>);
  }
  const req: ParentAccessRequest = { ...data, id: generateId(), status: 'pending', createdAt: now };
  lsSet(LS_REQUESTS, [req, ...lsGet<ParentAccessRequest>(LS_REQUESTS)]);
  return req;
}

export async function updateAccessRequest(id: string, data: Partial<ParentAccessRequest>): Promise<void> {
  if (isSupabaseConfigured) {
    const patch: Record<string, unknown> = {};
    if (data.status              !== undefined) patch.status               = data.status;
    if (data.reviewedBy          !== undefined) patch.reviewed_by          = data.reviewedBy;
    if (data.reviewNote          !== undefined) patch.review_note          = data.reviewNote;
    if (data.reviewedAt          !== undefined) patch.reviewed_at          = data.reviewedAt;
    if (data.matchedParticipantId !== undefined) patch.matched_participant_id = data.matchedParticipantId;
    await supabase!.from('parent_access_requests').update(patch).eq('id', id);
    return;
  }
  lsSet(LS_REQUESTS, lsGet<ParentAccessRequest>(LS_REQUESTS).map(r => r.id === id ? { ...r, ...data } : r));
}

// ── Connection code queries ───────────────────────────────────────────────────
export async function getConnectionCode(participantId: string): Promise<ChildConnectionCode | null> {
  if (isSupabaseConfigured) {
    const { data } = await supabase!
      .from('child_connection_codes')
      .select('*')
      .eq('participant_id', participantId)
      .eq('status', 'active')
      .maybeSingle();
    return data ? mapCode(data as Record<string, unknown>) : null;
  }
  return lsGet<ChildConnectionCode>(LS_CODES).find(c => c.participantId === participantId && c.status === 'active') ?? null;
}

export async function generateConnectionCode(participantId: string): Promise<string> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase!.rpc('generate_connection_code', { p_participant_id: participantId });
    if (error) throw new Error(error.message);
    return data as string;
  }
  // Demo mode: generate locally
  const code = Math.random().toString(36).slice(2, 10).toUpperCase();
  const existing = lsGet<ChildConnectionCode>(LS_CODES);
  const updated = existing.filter(c => c.participantId !== participantId);
  updated.unshift({
    id: generateId(), participantId, code, status: 'active',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  });
  lsSet(LS_CODES, updated);
  return code;
}

export async function lookupCodeMatch(code: string): Promise<{ participantId: string; participantUsername: string; participantName: string } | null> {
  if (isSupabaseConfigured) {
    const { data } = await supabase!.rpc('lookup_connection_code', { p_code: code.toUpperCase() });
    if (!data || (data as unknown[]).length === 0) return null;
    const row = (data as Record<string, unknown>[])[0];
    return {
      participantId:       row.participant_id as string,
      participantUsername: (row.participant_username as string) ?? '',
      participantName:     (row.participant_name as string) ?? '',
    };
  }
  // Demo mode
  const codeRecord = lsGet<ChildConnectionCode>(LS_CODES)
    .find(c => c.code.toUpperCase() === code.toUpperCase() && c.status === 'active');
  if (!codeRecord) return null;
  return { participantId: codeRecord.participantId, participantUsername: '', participantName: '' };
}
