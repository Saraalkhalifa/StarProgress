import React, { useState, useEffect, useCallback } from 'react';
import { Users, Link2, ClipboardList, CheckCircle, XCircle, Info, RefreshCw, Edit2, Ban, UserPlus, Search, X } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Card, CardHeader, CardContent, Button, Dialog, toast, EmptyState } from '../../components/ui';
import { PermissionEditor } from '../../components/parent/PermissionEditor';
import * as ps from '../../lib/parentStorage';
import type { ParentChildLink, ParentAccessRequest, ParentPermissions, RelationshipType } from '../../types';
import { DEFAULT_PARENT_PERMISSIONS } from '../../types';

type Tab = 'requests' | 'connections' | 'parents' | 'manual';

const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  father: 'Father', mother: 'Mother', guardian: 'Guardian',
  older_sibling: 'Older Sibling', relative: 'Relative', other: 'Other',
};

export function ParentManagement() {
  const { currentUser, isMainAdmin } = useAuth();
  const { users } = useData();

  const [tab,          setTab]          = useState<Tab>('requests');
  const [requests,     setRequests]     = useState<ParentAccessRequest[]>([]);
  const [links,        setLinks]        = useState<ParentChildLink[]>([]);
  const [loading,      setLoading]      = useState(false);

  // Approve modal state
  const [approveReqId, setApproveReqId]  = useState<string | null>(null);
  const [approvePerms, setApprovePerms]  = useState<ParentPermissions>({ ...DEFAULT_PARENT_PERMISSIONS });

  // Deny modal state
  const [denyReqId,    setDenyReqId]    = useState<string | null>(null);
  const [denyNote,     setDenyNote]     = useState('');

  // More info modal state
  const [infoReqId,    setInfoReqId]    = useState<string | null>(null);
  const [infoNote,     setInfoNote]     = useState('');

  // Edit permissions modal state
  const [editLinkId,   setEditLinkId]   = useState<string | null>(null);
  const [editPerms,    setEditPerms]    = useState<ParentPermissions>({ ...DEFAULT_PARENT_PERMISSIONS });

  // Revoke link modal
  const [revokeLinkId, setRevokeLinkId] = useState<string | null>(null);
  const [revokeNote,   setRevokeNote]   = useState('');

  // ── Manual link state (main_admin only) ────────────────────────────────────
  const [mlChildSearch,   setMlChildSearch]   = useState('');
  const [mlChildId,       setMlChildId]       = useState<string | null>(null);
  const [mlParentSearch,  setMlParentSearch]  = useState('');
  const [mlParentId,      setMlParentId]      = useState<string | null>(null);
  const [mlRelType,       setMlRelType]       = useState<RelationshipType>('guardian');
  const [mlPerms,         setMlPerms]         = useState<ParentPermissions>({ ...DEFAULT_PARENT_PERMISSIONS });
  const [mlShowPerms,     setMlShowPerms]     = useState(false);
  const [mlConfirmOpen,   setMlConfirmOpen]   = useState(false);
  const [mlSaving,        setMlSaving]        = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [r, l] = await Promise.all([ps.getAccessRequests(), ps.getAllLinks()]);
      setRequests(r);
      setLinks(l);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  // ── Approve request ────────────────────────────────────────────────────────
  const openApprove = (req: ParentAccessRequest) => {
    setApproveReqId(req.id);
    setApprovePerms({ ...DEFAULT_PARENT_PERMISSIONS });
  };

  const handleApprove = async () => {
    if (!approveReqId || !currentUser) return;
    const req = requests.find(r => r.id === approveReqId);
    if (!req) return;

    // Resolve participant ID — either already matched (code flow) or look up by username now
    let participantId = req.matchedParticipantId;

    if (!participantId && req.requestedChildUsername) {
      const needle = req.requestedChildUsername.trim().toLowerCase();
      const found = users.find(
        u => u.role === 'participant' &&
             u.accountStatus === 'active' &&
             !u.isDeleted &&
             u.username != null &&
             u.username.trim().toLowerCase() === needle
      );
      if (!found) {
        toast.error(
          `No child account found with username "@${req.requestedChildUsername.trim()}". ` +
          'Please check the spelling or use the child\'s registered username.'
        );
        return;
      }
      participantId = found.id;
      // Persist the resolved match so it shows in the UI and avoids re-lookup
      await ps.updateAccessRequest(approveReqId, { matchedParticipantId: participantId });
    }

    if (!participantId) {
      toast.error('Cannot approve: no matched participant. Use "More Info" to ask the parent for the connection code or username.');
      return;
    }

    try {
      const now = new Date().toISOString();
      await ps.createLink({
        parentId:         req.parentId,
        participantId,
        relationshipType: req.relationshipType,
        status:           'approved',
        permissions:      approvePerms,
        requestedBy:      'parent',
        approvedBy:       currentUser.id,
        approvedAt:       now,
        adminNote:        undefined,
      });
      await ps.updateAccessRequest(approveReqId, {
        status:      'approved',
        reviewedBy:  currentUser.id,
        reviewedAt:  now,
        reviewNote:  'Approved.',
      });
      toast.success('Access approved. Parent can now see this child\'s data.');
      setApproveReqId(null);
      await refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  // ── Deny request ───────────────────────────────────────────────────────────
  const handleDeny = async () => {
    if (!denyReqId || !currentUser) return;
    const now = new Date().toISOString();
    await ps.updateAccessRequest(denyReqId, {
      status:     'denied',
      reviewedBy:  currentUser.id,
      reviewedAt:  now,
      reviewNote:  denyNote || undefined,
    });
    toast.error('Request denied.');
    setDenyReqId(null);
    setDenyNote('');
    await refresh();
  };

  // ── More info request ──────────────────────────────────────────────────────
  const handleMoreInfo = async () => {
    if (!infoReqId || !currentUser) return;
    const now = new Date().toISOString();
    await ps.updateAccessRequest(infoReqId, {
      status:     'more_info_needed',
      reviewedBy:  currentUser.id,
      reviewedAt:  now,
      reviewNote:  infoNote,
    });
    toast.success('Parent notified that more information is needed.');
    setInfoReqId(null);
    setInfoNote('');
    await refresh();
  };

  // ── Edit permissions ───────────────────────────────────────────────────────
  const openEditLink = (link: ParentChildLink) => {
    setEditLinkId(link.id);
    setEditPerms({ ...link.permissions });
  };

  const handleSavePerms = async () => {
    if (!editLinkId) return;
    await ps.updateLink(editLinkId, { permissions: editPerms });
    toast.success('Permissions updated.');
    setEditLinkId(null);
    await refresh();
  };

  // ── Revoke link ────────────────────────────────────────────────────────────
  const handleRevoke = async () => {
    if (!revokeLinkId || !currentUser) return;
    await ps.updateLink(revokeLinkId, {
      status:    'revoked',
      revokedBy:  currentUser.id,
      revokedAt:  new Date().toISOString(),
      adminNote:  revokeNote || undefined,
    });
    toast.warning('Access revoked. Parent can no longer see this child\'s data.');
    setRevokeLinkId(null);
    setRevokeNote('');
    await refresh();
  };

  // ── Manual link ────────────────────────────────────────────────────────────
  const allChildren = users.filter(u => u.role === 'participant' && u.accountStatus === 'active' && !u.isDeleted);
  const allParents  = users.filter(u => u.role === 'parent'      && u.accountStatus === 'active' && !u.isDeleted);

  const filteredChildren = mlChildSearch.trim()
    ? allChildren.filter(u => {
        const q = mlChildSearch.trim().toLowerCase();
        return u.name.toLowerCase().includes(q) || (u.username ?? '').toLowerCase().includes(q);
      })
    : allChildren;

  const filteredParents = mlParentSearch.trim()
    ? allParents.filter(u => {
        const q = mlParentSearch.trim().toLowerCase();
        return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      })
    : allParents;

  const mlSelectedChild  = mlChildId  ? users.find(u => u.id === mlChildId)  : null;
  const mlSelectedParent = mlParentId ? users.find(u => u.id === mlParentId) : null;

  // Existing active/pending links for the selected child (any parent)
  const mlChildCurrentLinks = mlChildId
    ? links.filter(l => l.participantId === mlChildId && (l.status === 'approved' || l.status === 'pending'))
    : [];

  // Exact duplicate — this exact (parent, child) pair already has any link
  const mlExactDuplicate = (mlChildId && mlParentId)
    ? links.find(l => l.participantId === mlChildId && l.parentId === mlParentId)
    : null;

  const mlCanSubmit = !!mlChildId && !!mlParentId && !mlExactDuplicate;

  const handleManualLink = async () => {
    if (!mlChildId || !mlParentId || !currentUser) return;
    setMlSaving(true);
    try {
      const now = new Date().toISOString();
      await ps.createLink({
        parentId:         mlParentId,
        participantId:    mlChildId,
        relationshipType: mlRelType,
        status:           'approved',
        permissions:      mlPerms,
        requestedBy:      'main_admin',
        approvedBy:       currentUser.id,
        approvedAt:       now,
        adminNote:        undefined,
      });
      toast.success(`${mlSelectedParent?.name ?? 'Parent'} linked to ${mlSelectedChild?.name ?? 'child'} successfully.`);
      setMlConfirmOpen(false);
      setMlChildId(null);
      setMlParentId(null);
      setMlChildSearch('');
      setMlParentSearch('');
      setMlRelType('guardian');
      setMlPerms({ ...DEFAULT_PARENT_PERMISSIONS });
      setMlShowPerms(false);
      await refresh();
    } catch (err) {
      toast.error((err as Error).message ?? 'Failed to create link. Please try again.');
    } finally {
      setMlSaving(false);
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const parentUsers     = users.filter(u => u.role === 'parent');
  const pendingRequests = requests.filter(r => r.status === 'pending' || r.status === 'more_info_needed');

  const TAB_LIST: { id: Tab; label: string; badge?: number }[] = [
    { id: 'requests',    label: 'Access Requests', badge: pendingRequests.length || undefined },
    { id: 'connections', label: 'Connections' },
    { id: 'parents',     label: 'Parent Accounts' },
    ...(isMainAdmin ? [{ id: 'manual' as Tab, label: '🔗 Manual Link' }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">💜 Parent Management</h1>
          <p className="text-gray-500 text-sm mt-1">Review access requests and manage parent–child connections</p>
        </div>
        <Button variant="secondary" onClick={() => void refresh()} loading={loading}
          className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Card>
        <CardHeader>
          <div className="flex gap-2 flex-wrap">
            {TAB_LIST.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  tab === t.id ? 'bg-purple-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-purple-50'
                }`}
              >
                {t.label}
                {t.badge !== undefined && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {t.badge > 9 ? '9+' : t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          {/* ── TAB: Access Requests ──────────────────────────────────── */}
          {tab === 'requests' && (
            requests.length === 0 ? (
              <EmptyState icon="📭" title="No access requests" description="Parent access requests will appear here." />
            ) : (
              <div className="divide-y divide-gray-50">
                {requests.map(req => {
                  const parent = users.find(u => u.id === req.parentId);
                  const matched = req.matchedParticipantId ? users.find(u => u.id === req.matchedParticipantId) : null;

                  const statusColors: Record<string, string> = {
                    pending:          'bg-amber-100 text-amber-700',
                    approved:         'bg-green-100 text-green-700',
                    denied:           'bg-red-100 text-red-700',
                    more_info_needed: 'bg-blue-100 text-blue-700',
                    cancelled:        'bg-gray-100 text-gray-500',
                    revoked:          'bg-gray-100 text-gray-500',
                  };

                  const canAct = req.status === 'pending' || req.status === 'more_info_needed';

                  return (
                    <div key={req.id} className="py-5 space-y-3">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-800">{req.parentName ?? parent?.name ?? 'Unknown Parent'}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[req.status] ?? 'bg-gray-100 text-gray-500'}`}>
                              {req.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {req.parentEmail ?? parent?.email} · {parent?.phoneNumber && `📱 ${parent.phoneNumber}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {RELATIONSHIP_LABELS[req.relationshipType]} of{' '}
                            <span className="font-medium text-gray-700">
                              {req.requestedChildUsername ? `@${req.requestedChildUsername}` : `Code: ${req.requestedChildCode}`}
                            </span>
                            {matched && (
                              <span className="text-green-600 ml-1">→ matched: {matched.name} (@{matched.username})</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-400">{format(new Date(req.createdAt), 'MMM d, yyyy · HH:mm')}</p>
                        </div>

                        {canAct && (
                          <div className="flex gap-2 flex-wrap">
                            <Button size="sm"
                              className="bg-green-600 hover:bg-green-700 gap-1"
                              onClick={() => openApprove(req)}
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Approve
                            </Button>
                            <Button size="sm" variant="secondary"
                              className="text-blue-600 border-blue-200 hover:bg-blue-50 gap-1"
                              onClick={() => { setInfoReqId(req.id); setInfoNote(''); }}
                            >
                              <Info className="w-3.5 h-3.5" /> More Info
                            </Button>
                            <Button size="sm" variant="danger"
                              className="gap-1"
                              onClick={() => { setDenyReqId(req.id); setDenyNote(''); }}
                            >
                              <XCircle className="w-3.5 h-3.5" /> Deny
                            </Button>
                          </div>
                        )}
                      </div>

                      {req.requestMessage && (
                        <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl text-xs text-purple-700">
                          <span className="font-medium">Reason: </span>{req.requestMessage}
                        </div>
                      )}
                      {req.reviewNote && (
                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
                          <span className="font-medium">Admin note: </span>{req.reviewNote}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* ── TAB: Connections ─────────────────────────────────────── */}
          {tab === 'connections' && (
            links.length === 0 ? (
              <EmptyState icon="🔗" title="No connections yet" description="Approved parent–child links will appear here." />
            ) : (
              <div className="divide-y divide-gray-50">
                {links.map(link => {
                  const parent = users.find(u => u.id === link.parentId);
                  const child  = users.find(u => u.id === link.participantId);

                  return (
                    <div key={link.id} className="py-4 flex items-start justify-between gap-4 flex-wrap">
                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-800">{link.parentName ?? parent?.name}</span>
                          <span className="text-gray-400">→</span>
                          <span className="font-semibold text-purple-700">{link.participantName ?? child?.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            link.status === 'approved' ? 'bg-green-100 text-green-700' :
                            link.status === 'revoked'  ? 'bg-gray-100 text-gray-500' :
                            'bg-amber-100 text-amber-700'
                          }`}>{link.status}</span>
                        </div>
                        <p className="text-xs text-gray-400">
                          {RELATIONSHIP_LABELS[link.relationshipType]} · Connected {format(new Date(link.createdAt), 'MMM d, yyyy')}
                        </p>
                        {link.adminNote && (
                          <p className="text-xs text-red-500">Admin note: {link.adminNote}</p>
                        )}
                      </div>

                      {link.status === 'approved' && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary"
                            className="text-purple-600 border-purple-200 hover:bg-purple-50 gap-1"
                            onClick={() => openEditLink(link)}
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Permissions
                          </Button>
                          <Button size="sm" variant="secondary"
                            className="text-red-500 border-red-200 hover:bg-red-50 gap-1"
                            onClick={() => { setRevokeLinkId(link.id); setRevokeNote(''); }}
                          >
                            <Ban className="w-3.5 h-3.5" /> Revoke
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* ── TAB: Parent Accounts ─────────────────────────────────── */}
          {tab === 'parents' && (
            parentUsers.length === 0 ? (
              <EmptyState icon="👋" title="No parent accounts" description="Parents who sign up will appear here." />
            ) : (
              <div className="divide-y divide-gray-50">
                {parentUsers.map(parent => {
                  const parentLinks = links.filter(l => l.parentId === parent.id && l.status === 'approved');
                  return (
                    <div key={parent.id} className="py-4 flex items-start gap-4 flex-wrap">
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-800">{parent.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            parent.accountStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>{parent.accountStatus}</span>
                        </div>
                        <p className="text-xs text-gray-500">{parent.email} · @{parent.username}</p>
                        {parent.phoneNumber && <p className="text-xs text-gray-400">📱 {parent.phoneNumber}</p>}
                        <p className="text-xs text-gray-400">
                          {parentLinks.length} approved connection{parentLinks.length !== 1 ? 's' : ''} ·
                          Joined {format(new Date(parent.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* ── TAB: Manual Link (main_admin only) ───────────────────── */}
          {tab === 'manual' && (
            !isMainAdmin ? (
              <EmptyState icon="🔒" title="Access restricted" description="Only the main admin can manually link parents to children." />
            ) : (
              <div className="space-y-6 max-w-2xl">
                <div className="p-4 bg-purple-50 border border-purple-100 rounded-2xl text-sm text-purple-700">
                  <strong>Manual linking</strong> creates an approved parent–child link directly, bypassing the access request flow.
                  The parent will immediately be able to see the linked child's permitted information.
                </div>

                {/* ── Step 1: Select child ─────────────────────────── */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full text-xs flex items-center justify-center font-bold">1</span>
                    Select Child Account
                  </p>

                  {mlSelectedChild ? (
                    <div className="flex items-center justify-between gap-3 p-3 bg-green-50 border border-green-200 rounded-2xl">
                      <div>
                        <p className="font-semibold text-green-800 text-sm">{mlSelectedChild.name}</p>
                        {mlSelectedChild.username && (
                          <p className="text-xs text-green-600">@{mlSelectedChild.username}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => { setMlChildId(null); setMlChildSearch(''); }}
                        className="p-1 rounded-lg text-green-500 hover:bg-green-100 transition-colors"
                        aria-label="Clear child selection"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={mlChildSearch}
                          onChange={e => setMlChildSearch(e.target.value)}
                          placeholder="Search by name or username..."
                          className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
                        />
                      </div>
                      {allChildren.length === 0 ? (
                        <p className="text-xs text-gray-400 px-1">No active child accounts found.</p>
                      ) : (
                        <div className="border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-50 max-h-52 overflow-y-auto">
                          {filteredChildren.length === 0 ? (
                            <p className="text-xs text-gray-400 p-3">No children match your search.</p>
                          ) : (
                            filteredChildren.slice(0, 10).map(u => (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => { setMlChildId(u.id); setMlChildSearch(''); }}
                                className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors flex items-center justify-between gap-3"
                              >
                                <div>
                                  <p className="text-sm font-medium text-gray-800">{u.name}</p>
                                  {u.username && <p className="text-xs text-gray-400">@{u.username}</p>}
                                </div>
                                <span className="text-xs text-purple-500 font-medium">Select</span>
                              </button>
                            ))
                          )}
                          {filteredChildren.length > 10 && (
                            <p className="text-xs text-gray-400 p-3 text-center">
                              Showing 10 of {filteredChildren.length}. Refine your search to narrow results.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Existing links warning for this child */}
                  {mlChildId && mlChildCurrentLinks.length > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 space-y-1">
                      <p className="font-semibold">⚠️ This child already has {mlChildCurrentLinks.length} active parent link{mlChildCurrentLinks.length > 1 ? 's' : ''}:</p>
                      {mlChildCurrentLinks.map(l => {
                        const p = users.find(u => u.id === l.parentId);
                        return (
                          <p key={l.id}>• {l.parentName ?? p?.name ?? 'Unknown'} ({RELATIONSHIP_LABELS[l.relationshipType]}, {l.status})</p>
                        );
                      })}
                      <p className="text-amber-600 mt-1">You can still add an additional parent. The system supports multiple parents per child.</p>
                    </div>
                  )}
                </div>

                {/* ── Step 2: Select parent ─────────────────────────── */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full text-xs flex items-center justify-center font-bold">2</span>
                    Select Parent Account
                  </p>

                  {mlSelectedParent ? (
                    <div className="flex items-center justify-between gap-3 p-3 bg-green-50 border border-green-200 rounded-2xl">
                      <div>
                        <p className="font-semibold text-green-800 text-sm">{mlSelectedParent.name}</p>
                        <p className="text-xs text-green-600">{mlSelectedParent.email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setMlParentId(null); setMlParentSearch(''); }}
                        className="p-1 rounded-lg text-green-500 hover:bg-green-100 transition-colors"
                        aria-label="Clear parent selection"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={mlParentSearch}
                          onChange={e => setMlParentSearch(e.target.value)}
                          placeholder="Search by name or email..."
                          className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
                        />
                      </div>
                      {allParents.length === 0 ? (
                        <p className="text-xs text-gray-400 px-1">No active parent accounts found. Parents must sign up first.</p>
                      ) : (
                        <div className="border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-50 max-h-52 overflow-y-auto">
                          {filteredParents.length === 0 ? (
                            <p className="text-xs text-gray-400 p-3">No parents match your search.</p>
                          ) : (
                            filteredParents.slice(0, 10).map(u => (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => { setMlParentId(u.id); setMlParentSearch(''); }}
                                className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors flex items-center justify-between gap-3"
                              >
                                <div>
                                  <p className="text-sm font-medium text-gray-800">{u.name}</p>
                                  <p className="text-xs text-gray-400">{u.email}</p>
                                </div>
                                <span className="text-xs text-purple-500 font-medium">Select</span>
                              </button>
                            ))
                          )}
                          {filteredParents.length > 10 && (
                            <p className="text-xs text-gray-400 p-3 text-center">
                              Showing 10 of {filteredParents.length}. Refine your search to narrow results.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Exact duplicate warning */}
                  {mlExactDuplicate && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                      ❌ A link between this parent and child already exists (status: <strong>{mlExactDuplicate.status}</strong>).
                      {mlExactDuplicate.status === 'revoked'
                        ? ' To restore access, go to the Connections tab and create a new request, or revoke the old record first.'
                        : ' Duplicate links are not allowed.'}
                    </div>
                  )}
                </div>

                {/* ── Step 3: Relationship & permissions ───────────── */}
                {mlChildId && mlParentId && !mlExactDuplicate && (
                  <div className="space-y-4 pt-2 border-t border-gray-100">
                    <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full text-xs flex items-center justify-center font-bold">3</span>
                      Relationship &amp; Permissions
                    </p>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">Relationship Type</label>
                      <select
                        value={mlRelType}
                        onChange={e => setMlRelType(e.target.value as RelationshipType)}
                        className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white"
                      >
                        {Object.entries(RELATIONSHIP_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => setMlShowPerms(p => !p)}
                      className="text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1.5 transition-colors"
                    >
                      {mlShowPerms ? '▾' : '▸'} {mlShowPerms ? 'Hide' : 'Customize'} Permissions
                      <span className="text-xs text-gray-400 font-normal">(defaults are recommended)</span>
                    </button>

                    {mlShowPerms && (
                      <div className="border border-purple-100 rounded-2xl p-4 bg-purple-50/30">
                        <PermissionEditor value={mlPerms} onChange={setMlPerms} />
                      </div>
                    )}
                  </div>
                )}

                {/* ── Link button ───────────────────────────────────── */}
                <div className="pt-2">
                  <Button
                    className="bg-purple-600 hover:bg-purple-700 gap-2"
                    disabled={!mlCanSubmit}
                    onClick={() => setMlConfirmOpen(true)}
                  >
                    <UserPlus className="w-4 h-4" />
                    Link Parent to Child
                  </Button>
                  {!mlChildId && <p className="text-xs text-gray-400 mt-2">Select a child account to continue.</p>}
                  {mlChildId && !mlParentId && <p className="text-xs text-gray-400 mt-2">Select a parent account to continue.</p>}
                </div>
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* ── Approve Dialog ──────────────────────────────────────────────────── */}
      <Dialog
        open={!!approveReqId}
        title="✅ Approve Access Request"
        onClose={() => setApproveReqId(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setApproveReqId(null)}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => void handleApprove()}>
              Approve & Create Link
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Set the initial permissions for this parent. You can edit them later in the Connections tab.
          </p>
          <PermissionEditor value={approvePerms} onChange={setApprovePerms} />
        </div>
      </Dialog>

      {/* ── Deny Dialog ─────────────────────────────────────────────────────── */}
      <Dialog
        open={!!denyReqId}
        title="❌ Deny Access Request"
        onClose={() => setDenyReqId(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDenyReqId(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => void handleDeny()}>Confirm Denial</Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Optionally provide a reason (shown to the parent).</p>
          <textarea
            rows={3}
            value={denyNote}
            onChange={e => setDenyNote(e.target.value)}
            placeholder="e.g. We could not verify the relationship to the child."
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
          />
        </div>
      </Dialog>

      {/* ── More Info Dialog ─────────────────────────────────────────────────── */}
      <Dialog
        open={!!infoReqId}
        title="ℹ️ Request More Information"
        onClose={() => setInfoReqId(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setInfoReqId(null)}>Cancel</Button>
            <Button onClick={() => void handleMoreInfo()}>Send Request</Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Tell the parent what additional information you need.</p>
          <textarea
            rows={3}
            value={infoNote}
            onChange={e => setInfoNote(e.target.value)}
            placeholder="e.g. Please provide the child's connection code or full name."
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
          />
        </div>
      </Dialog>

      {/* ── Edit Permissions Dialog ─────────────────────────────────────────── */}
      <Dialog
        open={!!editLinkId}
        title="⚙️ Edit Parent Permissions"
        onClose={() => setEditLinkId(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditLinkId(null)}>Cancel</Button>
            <Button onClick={() => void handleSavePerms()}>Save Permissions</Button>
          </>
        }
      >
        <PermissionEditor value={editPerms} onChange={setEditPerms} />
      </Dialog>

      {/* ── Revoke Dialog ───────────────────────────────────────────────────── */}
      <Dialog
        open={!!revokeLinkId}
        title="🚫 Revoke Parent Access"
        onClose={() => setRevokeLinkId(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRevokeLinkId(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => void handleRevoke()}>Revoke Access</Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            This parent will immediately lose access to their child's data. This can be undone by re-approving an access request.
          </p>
          <textarea
            rows={2}
            value={revokeNote}
            onChange={e => setRevokeNote(e.target.value)}
            placeholder="Optional note (why access was revoked)"
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
          />
        </div>
      </Dialog>

      {/* ── Manual Link Confirm Dialog ──────────────────────────────────────── */}
      <Dialog
        open={mlConfirmOpen}
        title="🔗 Confirm Parent–Child Link"
        onClose={() => setMlConfirmOpen(false)}
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setMlConfirmOpen(false)}>Cancel</Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              loading={mlSaving}
              onClick={() => void handleManualLink()}
            >
              Confirm & Link
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Please review before confirming. This will immediately grant the parent access.</p>
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-gray-400 w-20 shrink-0">Child</span>
              <span className="font-semibold text-gray-800">
                {mlSelectedChild?.name}
                {mlSelectedChild?.username && <span className="text-gray-400 font-normal ml-1">@{mlSelectedChild.username}</span>}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-gray-400 w-20 shrink-0">Parent</span>
              <span className="font-semibold text-gray-800">{mlSelectedParent?.name}
                <span className="text-gray-400 font-normal ml-1">{mlSelectedParent?.email}</span>
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-gray-400 w-20 shrink-0">Relation</span>
              <span className="font-medium text-gray-700">{RELATIONSHIP_LABELS[mlRelType]}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-gray-400 w-20 shrink-0">Status</span>
              <span className="text-green-600 font-medium">Approved immediately</span>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
