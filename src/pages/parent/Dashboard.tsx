import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Star, CheckCircle, XCircle, Clock, Gift, User, LogOut, Plus, Bell, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useRewards } from '../../contexts/RewardContext';
import { useParent } from '../../contexts/ParentContext';
import { Card, Button, Dialog, toast } from '../../components/ui';
import { HeroLevelBadge } from '../../components/shared/HeroLevelBadge';
import type { AccessRequestStatus, RelationshipType } from '../../types';

const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  father: 'Father', mother: 'Mother', guardian: 'Guardian',
  older_sibling: 'Older Sibling', relative: 'Relative', other: 'Other',
};

const REQUEST_STATUS_CONFIG: Record<AccessRequestStatus, { label: string; color: string }> = {
  pending:          { label: 'Pending Review',     color: 'bg-amber-100 text-amber-700' },
  approved:         { label: 'Approved',            color: 'bg-green-100 text-green-700' },
  denied:           { label: 'Denied',              color: 'bg-red-100 text-red-700' },
  more_info_needed: { label: 'More Info Needed',    color: 'bg-blue-100 text-blue-700' },
  cancelled:        { label: 'Cancelled',           color: 'bg-gray-100 text-gray-500' },
  revoked:          { label: 'Revoked',             color: 'bg-gray-100 text-gray-500' },
};

const REWARD_STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-3.5 h-3.5" /> },
  approved:  { label: 'Approved',  color: 'bg-green-100 text-green-700',   icon: <CheckCircle className="w-3.5 h-3.5" /> },
  denied:    { label: 'Denied',    color: 'bg-red-100 text-red-700',       icon: <XCircle className="w-3.5 h-3.5" /> },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500',     icon: <XCircle className="w-3.5 h-3.5" /> },
};

export function ParentDashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { users, getAcceptedPoints } = useData();
  const { rewardTypes, rewardRequests, updateRewardRequest } = useRewards();
  const { links, accessRequests, hasPermission, loading, cancelAccessRequest } = useParent();

  const [decideId,     setDecideId]     = useState<string | null>(null);
  const [decideAction, setDecideAction] = useState<'approved' | 'denied'>('approved');
  const [note,         setNote]         = useState('');
  const [rewardTab,    setRewardTab]    = useState<'pending' | 'all'>('pending');

  const handleLogout = () => { logout(); navigate('/', { replace: true }); };

  // Only show approved links
  const approvedLinks = links;
  const hasApprovedChildren = approvedLinks.length > 0;
  const activeRequests = accessRequests.filter(r => r.status === 'pending' || r.status === 'more_info_needed');

  const openDecide = (id: string, action: 'approved' | 'denied') => {
    setDecideId(id); setDecideAction(action); setNote('');
  };

  const handleDecide = () => {
    if (!decideId) return;
    const req = rewardRequests.find(r => r.id === decideId);
    if (!req) return;

    if (decideAction === 'approved') {
      // Guard: check permission
      if (!hasPermission(req.participantId, 'approveRewardRequests')) {
        toast.error('You do not have permission to approve reward requests for this child.');
        setDecideId(null); return;
      }
      // Guard: enough points?
      const childPoints = getAcceptedPoints(req.participantId);
      if (childPoints < req.totalPointsRequired) {
        toast.error(`${req.participantName || 'Your child'} no longer has enough Hero Points for this reward.`);
        setDecideId(null); return;
      }
    } else {
      if (!hasPermission(req.participantId, 'denyRewardRequests')) {
        toast.error('You do not have permission to deny reward requests for this child.');
        setDecideId(null); return;
      }
    }

    updateRewardRequest(decideId, {
      status:     decideAction,
      parentNote: note || undefined,
      decidedAt:  new Date().toISOString(),
    });

    toast.success(decideAction === 'approved'
      ? '✅ Reward approved! Points have been deducted.'
      : '❌ Reward denied. No points were deducted.');
    setDecideId(null); setNote('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-purple-100 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-800">Action Heroes — Parent Portal</h1>
            <p className="text-xs text-purple-500">Welcome, {currentUser?.name}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </header>

      <div className="max-w-4xl mx-auto p-4 lg:p-8 space-y-6">

        {/* ── STATE A / B: No approved children ── */}
        {!hasApprovedChildren && (
          <>
            <Card className="p-8 text-center">
              <div className="text-5xl mb-4">🔒</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">No Child Access Yet</h2>
              <p className="text-gray-500 text-sm mb-2">
                You don't have access to any child's account yet.
              </p>
              <p className="text-xs text-gray-400 mb-6 max-w-sm mx-auto">
                Request access below. The main admin must review and approve your request before any child data is shared with you.
              </p>
              <Button
                className="bg-purple-600 hover:bg-purple-700 inline-flex items-center gap-2"
                onClick={() => navigate('/parent/request-access')}
              >
                <Plus className="w-4 h-4" /> Request Child Access
              </Button>
            </Card>

            {/* Active access requests */}
            {accessRequests.length > 0 && (
              <div>
                <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-purple-500" /> Your Access Requests
                </h2>
                <div className="space-y-3">
                  {accessRequests.map(req => {
                    const cfg = REQUEST_STATUS_CONFIG[req.status];
                    return (
                      <Card key={req.id} className="p-4">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                            </div>
                            <p className="text-sm font-medium text-gray-800">
                              {req.requestedChildUsername ? `@${req.requestedChildUsername}` : `Code: ${req.requestedChildCode}`}
                            </p>
                            <p className="text-xs text-gray-400">
                              {RELATIONSHIP_LABELS[req.relationshipType]} · {format(new Date(req.createdAt), 'MMM d, yyyy')}
                            </p>
                            {req.reviewNote && (
                              <p className="text-xs text-blue-600 mt-1 bg-blue-50 rounded px-2 py-1">
                                Admin note: {req.reviewNote}
                              </p>
                            )}
                          </div>
                          {req.status === 'pending' && (
                            <Button
                              variant="secondary" size="sm"
                              className="text-red-500 border-red-200 hover:bg-red-50"
                              onClick={() => void cancelAccessRequest(req.id)}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
                <div className="mt-3">
                  <Button
                    variant="secondary"
                    className="border-purple-200 text-purple-600 hover:bg-purple-50 inline-flex items-center gap-2"
                    onClick={() => navigate('/parent/request-access')}
                  >
                    <Plus className="w-4 h-4" /> Request Another Child
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── STATE C: Has approved children ── */}
        {hasApprovedChildren && (
          <>
            {/* Child cards */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-500" /> My Children
                </h2>
                <Button
                  variant="secondary" size="sm"
                  className="text-purple-600 border-purple-200 hover:bg-purple-50"
                  onClick={() => navigate('/parent/request-access')}
                >
                  <Plus className="w-3.5 h-3.5" /> Add Child
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {approvedLinks.map(link => {
                  const child = users.find(u => u.id === link.participantId);
                  if (!child) return null;
                  const pts = hasPermission(child.id, 'viewPoints') ? getAcceptedPoints(child.id) : null;
                  const pendingRewards = rewardRequests.filter(r => r.participantId === child.id && r.status === 'pending').length;

                  return (
                    <Card key={link.id} className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl font-bold text-white"
                          style={{ background: 'linear-gradient(135deg,#a855f7,#6366f1)' }}>
                          {child.name[0]}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">{child.name}</p>
                          <p className="text-xs text-gray-400">@{child.username}</p>
                        </div>
                        <div className="text-end">
                          <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-medium">
                            {RELATIONSHIP_LABELS[link.relationshipType]}
                          </span>
                        </div>
                      </div>

                      {pts !== null && (
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-2xl font-bold text-purple-600">{pts}</span>
                          <span className="text-xs text-gray-400">Hero Points</span>
                        </div>
                      )}

                      {hasPermission(child.id, 'viewLevel') && pts !== null && (
                        <HeroLevelBadge points={pts} showProgress size="sm" />
                      )}

                      {pendingRewards > 0 && hasPermission(child.id, 'viewRewardRequests') && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {pendingRewards} pending reward request{pendingRewards !== 1 ? 's' : ''}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Reward Requests */}
            {approvedLinks.some(l => hasPermission(l.participantId, 'viewRewardRequests')) && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Gift className="w-5 h-5 text-purple-500" /> Hero Reward Requests
                  </h2>
                  {rewardRequests.filter(r =>
                    approvedLinks.some(l => l.participantId === r.participantId) && r.status === 'pending'
                  ).length > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold animate-pulse">
                      {rewardRequests.filter(r =>
                        approvedLinks.some(l => l.participantId === r.participantId) && r.status === 'pending'
                      ).length} pending
                    </span>
                  )}
                </div>

                <div className="flex gap-2 mb-4">
                  {(['pending', 'all'] as const).map(t => (
                    <button key={t} onClick={() => setRewardTab(t)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${rewardTab === t ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-purple-50'}`}>
                      {t === 'pending' ? `⏳ Pending` : '📋 All'}
                    </button>
                  ))}
                </div>

                {(() => {
                  const myChildIds = new Set(approvedLinks.map(l => l.participantId));
                  const displayed = rewardRequests
                    .filter(r => {
                      if (!myChildIds.has(r.participantId)) return false;
                      if (!hasPermission(r.participantId, 'viewRewardRequests')) return false;
                      if (rewardTab === 'pending') return r.status === 'pending';
                      return true;
                    })
                    .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());

                  if (displayed.length === 0) return (
                    <Card className="p-8 text-center text-gray-500">
                      <p className="text-3xl mb-2">🎁</p>
                      <p>{rewardTab === 'pending' ? 'No pending reward requests.' : 'No reward requests yet.'}</p>
                    </Card>
                  );

                  return (
                    <div className="space-y-3">
                      {displayed.map(req => {
                        const rt  = rewardTypes.find(r => r.id === req.rewardTypeId);
                        const cfg = REWARD_STATUS_CONFIG[req.status];
                        const isPending = req.status === 'pending';
                        const canApprove = hasPermission(req.participantId, 'approveRewardRequests');
                        const canDeny    = hasPermission(req.participantId, 'denyRewardRequests');

                        return (
                          <motion.div key={req.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                            <Card className={`overflow-hidden ${isPending ? 'border-l-4 border-l-yellow-400' : ''}`}>
                              <div className="p-5">
                                <div className="flex items-start justify-between gap-4 flex-wrap">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
                                        {cfg.icon}{cfg.label}
                                      </span>
                                      {isPending && <span className="text-xs text-yellow-600 font-medium">Needs your decision</span>}
                                    </div>
                                    <p className="font-semibold text-gray-800">{req.rewardName || rt?.name || 'Reward'}</p>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                      From: <strong>{req.participantName || 'Your child'}</strong>
                                      {req.requestedDuration && <span> · {req.requestedDuration} hour{req.requestedDuration !== 1 ? 's' : ''}</span>}
                                    </p>
                                    {req.childMessage && (
                                      <p className="text-sm text-purple-600 mt-1.5 italic bg-purple-50 rounded-lg px-3 py-1.5">
                                        💬 "{req.childMessage}"
                                      </p>
                                    )}
                                    {req.parentNote && (
                                      <p className="text-sm text-gray-600 mt-1.5 bg-gray-50 rounded-lg px-3 py-1.5">
                                        Your note: "{req.parentNote}"
                                      </p>
                                    )}
                                    <div className="flex items-center gap-4 mt-2">
                                      <span className="text-sm font-bold text-purple-700">
                                        <Star className="w-3.5 h-3.5 inline me-1 text-yellow-500" />
                                        {req.totalPointsRequired} Hero Points
                                      </span>
                                      <span className="text-xs text-gray-400">
                                        {format(new Date(req.requestedAt), 'MMM d, yyyy h:mm a')}
                                      </span>
                                    </div>
                                  </div>

                                  {isPending && (canApprove || canDeny) && (
                                    <div className="flex gap-2 flex-shrink-0">
                                      {canDeny && (
                                        <Button size="sm" variant="danger" onClick={() => openDecide(req.id, 'denied')}>
                                          <XCircle className="w-3.5 h-3.5" /> Deny
                                        </Button>
                                      )}
                                      {canApprove && (
                                        <Button size="sm" onClick={() => openDecide(req.id, 'approved')}
                                          className="bg-green-600 hover:bg-green-700">
                                          <CheckCircle className="w-3.5 h-3.5" /> Approve
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Pending access requests (additional children) */}
            {activeRequests.length > 0 && (
              <div>
                <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-purple-500" /> Pending Access Requests
                </h2>
                <div className="space-y-2">
                  {activeRequests.map(req => {
                    const cfg = REQUEST_STATUS_CONFIG[req.status];
                    return (
                      <Card key={req.id} className="p-3 flex items-center gap-4">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                        <p className="text-sm text-gray-700 flex-1">
                          {req.requestedChildUsername ? `@${req.requestedChildUsername}` : `Code: ${req.requestedChildCode}`}
                        </p>
                        <p className="text-xs text-gray-400">{format(new Date(req.createdAt), 'MMM d')}</p>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Decision dialog */}
      <Dialog
        open={!!decideId}
        title={decideAction === 'approved' ? '✅ Approve Reward?' : '❌ Deny Reward?'}
        onClose={() => setDecideId(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDecideId(null)}>Cancel</Button>
            <Button
              onClick={handleDecide}
              className={decideAction === 'approved' ? 'bg-green-600 hover:bg-green-700' : ''}
              variant={decideAction === 'denied' ? 'danger' : 'primary'}
            >
              {decideAction === 'approved' ? 'Approve & Deduct Points' : 'Deny Request'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            {decideAction === 'approved'
              ? 'Approving this reward will deduct the required Hero Points from your child\'s balance. This cannot be undone.'
              : 'Denying this request. No Hero Points will be deducted.'}
          </p>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Note to child (optional)</label>
            <textarea
              rows={2}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={decideAction === 'approved' ? 'e.g. You did great! Enjoy your reward.' : 'e.g. Keep earning points!'}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 resize-none"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
