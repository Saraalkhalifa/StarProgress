import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Star, CheckCircle, XCircle, Clock, ChevronRight, Gift, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useRewards } from '../../contexts/RewardContext';
import { Card, Button, Dialog, Textarea, toast } from '../../components/ui';
import { HeroLevelBadge } from '../../components/shared/HeroLevelBadge';
import { format } from 'date-fns';

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-3.5 h-3.5" /> },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  denied: { label: 'Denied', color: 'bg-red-100 text-red-700', icon: <XCircle className="w-3.5 h-3.5" /> },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500', icon: <XCircle className="w-3.5 h-3.5" /> },
};

export function ParentDashboard() {
  const { currentUser } = useAuth();
  const { users, getAcceptedPoints } = useData();
  const { rewardTypes, getRequestsForParent, updateRewardRequest } = useRewards();
  const [decideId, setDecideId] = useState<string | null>(null);
  const [decideAction, setDecideAction] = useState<'approved' | 'denied'>('approved');
  const [note, setNote] = useState('');
  const [tab, setTab] = useState<'pending' | 'all'>('pending');

  const parentEmail = currentUser!.email;
  const allRequests = getRequestsForParent(parentEmail);
  const pendingRequests = allRequests.filter(r => r.status === 'pending');
  const displayedRequests = tab === 'pending' ? pendingRequests : allRequests;

  // Find children who have this parent's email listed
  const linkedChildren = users.filter(u => u.role === 'participant' && u.parentEmail?.toLowerCase() === parentEmail.toLowerCase());

  const openDecide = (id: string, action: 'approved' | 'denied') => {
    setDecideId(id);
    setDecideAction(action);
    setNote('');
  };

  const handleDecide = () => {
    if (!decideId) return;
    const req = allRequests.find(r => r.id === decideId);
    if (!req) return;

    if (decideAction === 'approved') {
      // Check if the child still has enough points
      const childPoints = getAcceptedPoints(req.participantId);
      if (childPoints < req.totalPointsRequired) {
        toast.error(`${req.participantName || 'Your child'} no longer has enough Hero Points for this reward.`);
        setDecideId(null);
        return;
      }
    }

    updateRewardRequest(decideId, {
      status: decideAction,
      parentNote: note || undefined,
      decidedAt: new Date().toISOString(),
    });

    toast.success(decideAction === 'approved' ? '✅ Reward approved! Points have been deducted.' : '❌ Reward denied. No points were deducted.');
    setDecideId(null);
    setNote('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      <header className="bg-white border-b border-purple-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-800">Action Heroes — Parent Portal</h1>
            <p className="text-xs text-purple-500">Welcome, {currentUser?.name}</p>
          </div>
        </div>
        <button
          onClick={() => { import('../../contexts/AuthContext').then(m => m.useAuth); window.location.href = '#/'; }}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Sign Out
        </button>
      </header>

      <div className="max-w-4xl mx-auto p-4 lg:p-8 space-y-6">
        {/* Linked children */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <User className="w-5 h-5 text-purple-500" /> My Children
          </h2>
          {linkedChildren.length === 0 ? (
            <Card className="p-6 text-center text-gray-500">
              <p className="text-2xl mb-2">🔗</p>
              <p className="font-medium">No children linked yet.</p>
              <p className="text-sm mt-1">Ask your child to include your email (<strong>{parentEmail}</strong>) when they sign up on Action Heroes.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {linkedChildren.map(child => {
                const pts = getAcceptedPoints(child.id);
                return (
                  <Card key={child.id} className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl font-bold text-white"
                        style={{ background: 'linear-gradient(135deg,#a855f7,#6366f1)' }}>
                        {child.name[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{child.name}</p>
                        <p className="text-xs text-gray-400">@{child.username || child.email}</p>
                      </div>
                      <div className="ms-auto text-right">
                        <p className="text-xl font-bold text-purple-600">{pts}</p>
                        <p className="text-xs text-gray-400">Hero Points</p>
                      </div>
                    </div>
                    <HeroLevelBadge points={pts} showProgress size="sm" />
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Reward requests */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-500" /> Hero Reward Requests
            </h2>
            {pendingRequests.length > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold animate-pulse">
                {pendingRequests.length} pending
              </span>
            )}
          </div>

          <div className="flex gap-2 mb-4">
            {(['pending', 'all'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-purple-50'}`}>
                {t === 'pending' ? `⏳ Pending (${pendingRequests.length})` : '📋 All Requests'}
              </button>
            ))}
          </div>

          {displayedRequests.length === 0 ? (
            <Card className="p-8 text-center text-gray-500">
              <p className="text-3xl mb-2">🎁</p>
              <p>{tab === 'pending' ? 'No pending requests! Your child has not requested any rewards yet.' : 'No reward requests yet.'}</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {displayedRequests.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()).map(req => {
                const rt = rewardTypes.find(r => r.id === req.rewardTypeId);
                const cfg = statusConfig[req.status];
                const isPending = req.status === 'pending';

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

                          {isPending && (
                            <div className="flex gap-2 flex-shrink-0">
                              <Button size="sm" variant="danger" onClick={() => openDecide(req.id, 'denied')}>
                                <XCircle className="w-3.5 h-3.5" /> Deny
                              </Button>
                              <Button size="sm" onClick={() => openDecide(req.id, 'approved')}
                                className="bg-green-600 hover:bg-green-700">
                                <CheckCircle className="w-3.5 h-3.5" /> Approve
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
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
          {decideAction === 'approved' ? (
            <p className="text-sm text-gray-600">
              Approving this reward will deduct the required Hero Points from your child's balance. This cannot be undone.
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              Denying this request. No Hero Points will be deducted.
            </p>
          )}
          <Textarea
            label="Note to child (optional)"
            placeholder={decideAction === 'approved' ? 'e.g. You did great! Enjoy your reward.' : 'e.g. Maybe next time! Keep earning points.'}
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
          />
        </div>
      </Dialog>
    </div>
  );
}
