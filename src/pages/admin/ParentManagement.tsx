import React, { useState, useEffect, useCallback } from 'react';
import { Users, Link2, ClipboardList, CheckCircle, XCircle, Info, RefreshCw, Edit2, Ban } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Card, CardHeader, CardContent, Button, Dialog, toast, EmptyState } from '../../components/ui';
import { PermissionEditor } from '../../components/parent/PermissionEditor';
import * as ps from '../../lib/parentStorage';
import type { ParentChildLink, ParentAccessRequest, ParentPermissions, RelationshipType } from '../../types';
import { DEFAULT_PARENT_PERMISSIONS } from '../../types';

type Tab = 'requests' | 'connections' | 'parents';

const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  father: 'Father', mother: 'Mother', guardian: 'Guardian',
  older_sibling: 'Older Sibling', relative: 'Relative', other: 'Other',
};

export function ParentManagement() {
  const { currentUser } = useAuth();
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

  const parentUsers = users.filter(u => u.role === 'parent');
  const pendingRequests = requests.filter(r => r.status === 'pending' || r.status === 'more_info_needed');

  const TAB_LIST: { id: Tab; label: string; badge?: number }[] = [
    { id: 'requests',    label: 'Access Requests', badge: pendingRequests.length || undefined },
    { id: 'connections', label: 'Connections' },
    { id: 'parents',     label: 'Parent Accounts' },
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
    </div>
  );
}
