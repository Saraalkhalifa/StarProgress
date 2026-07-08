import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Star, Clock, CheckCircle, XCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useRewards } from '../../contexts/RewardContext';
import { Card, Button, Dialog, Textarea, toast } from '../../components/ui';
import { format } from 'date-fns';

const statusConfig = {
  pending: { label: 'Pending Parent Approval', color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-3.5 h-3.5" /> },
  approved: { label: 'Approved!', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  denied: { label: 'Denied', color: 'bg-red-100 text-red-700', icon: <XCircle className="w-3.5 h-3.5" /> },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500', icon: <XCircle className="w-3.5 h-3.5" /> },
};

export function HeroRewards() {
  const { currentUser } = useAuth();
  const { getAcceptedPoints } = useData();
  const { rewardTypes, getRequestsForParticipant, addRewardRequest, updateRewardRequest } = useRewards();

  const [tab, setTab] = useState<'available' | 'history'>('available');
  const [requestDialog, setRequestDialog] = useState<string | null>(null);
  const [duration, setDuration] = useState(1);
  const [childMessage, setChildMessage] = useState('');

  const userId = currentUser!.id;
  const availablePoints = getAcceptedPoints(userId);
  const parentEmail = currentUser?.parentEmail;

  const myRequests = getRequestsForParticipant(userId);
  const pendingCount = myRequests.filter(r => r.status === 'pending').length;

  const activeRewards = rewardTypes.filter(r => r.isActive);
  const selectedReward = requestDialog ? rewardTypes.find(r => r.id === requestDialog) : null;
  const totalCost = selectedReward
    ? (selectedReward.costType === 'per_hour' ? selectedReward.pointCost * duration : selectedReward.pointCost)
    : 0;

  const handleRequest = () => {
    if (!selectedReward) return;
    if (!parentEmail) {
      toast.error('You need to add your parent\'s email in settings before requesting rewards.');
      return;
    }
    if (availablePoints < totalCost) {
      toast.error(`You need ${totalCost} Hero Points but only have ${availablePoints}. Keep earning!`);
      return;
    }

    addRewardRequest({
      participantId: userId,
      participantName: currentUser!.name,
      parentEmail,
      rewardTypeId: selectedReward.id,
      rewardName: selectedReward.name,
      requestedDuration: selectedReward.costType === 'per_hour' ? duration : undefined,
      totalPointsRequired: totalCost,
      childMessage: childMessage || undefined,
    });

    toast.success('🎁 Reward request sent to your parent!');
    setRequestDialog(null);
    setDuration(1);
    setChildMessage('');
    setTab('history');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Gift className="w-7 h-7 text-purple-500" /> Hero Rewards 🎁
        </h1>
        <p className="text-gray-500 text-sm mt-1">Spend your Hero Points to request real rewards from your parent!</p>
      </div>

      {/* Points banner */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-5 text-white flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-purple-100 text-sm">Your Hero Points</p>
          <p className="text-4xl font-extrabold">{availablePoints}</p>
        </div>
        <div className="text-right">
          {!parentEmail ? (
            <div className="flex items-center gap-2 bg-white/20 rounded-xl px-3 py-2">
              <AlertCircle className="w-4 h-4 text-yellow-200" />
              <p className="text-sm text-yellow-100">Add parent email in Settings to enable rewards</p>
            </div>
          ) : (
            <div>
              <p className="text-purple-100 text-sm">Parent linked</p>
              <p className="text-sm font-medium">✅ {parentEmail}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <p>Your Hero Points are <strong>only deducted when your parent approves</strong> your request. If denied, no points are spent.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['available', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-purple-50'}`}>
            {t === 'available' ? '🎁 Available Rewards' : `📋 My Requests${pendingCount > 0 ? ` (${pendingCount} pending)` : ''}`}
          </button>
        ))}
      </div>

      {tab === 'available' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeRewards.map(reward => {
            const cost = reward.costType === 'fixed' ? reward.pointCost : `${reward.pointCost}/hr`;
            const canAfford = reward.costType === 'fixed' ? availablePoints >= reward.pointCost : availablePoints >= reward.pointCost;
            const hasPending = myRequests.some(r => r.rewardTypeId === reward.id && r.status === 'pending');

            return (
              <motion.div key={reward.id} whileHover={{ scale: 1.01 }} transition={{ duration: 0.15 }}>
                <Card className="p-5 h-full flex flex-col justify-between hover:border-purple-200 transition-colors">
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-800">{reward.name}</h3>
                      <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${canAfford ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                        <Star className="w-3 h-3 inline me-1 text-yellow-500" />
                        {cost} pts{reward.costType === 'per_hour' ? '/hr' : ''}
                      </span>
                    </div>
                    {reward.description && <p className="text-sm text-gray-500">{reward.description}</p>}
                    {reward.costType === 'per_hour' && reward.maxDuration && (
                      <p className="text-xs text-gray-400 mt-1">Max {reward.maxDuration} hour{reward.maxDuration !== 1 ? 's' : ''}</p>
                    )}
                  </div>
                  <div className="mt-4">
                    {hasPending ? (
                      <Button variant="secondary" className="w-full" disabled size="sm">
                        <Clock className="w-3.5 h-3.5" /> Request Pending…
                      </Button>
                    ) : !canAfford ? (
                      <Button variant="secondary" className="w-full opacity-60" disabled size="sm">
                        Need {reward.pointCost} pts to request
                      </Button>
                    ) : (
                      <Button onClick={() => { setRequestDialog(reward.id); setDuration(1); setChildMessage(''); }}
                        className="w-full bg-purple-600 hover:bg-purple-700" size="sm">
                        <Gift className="w-3.5 h-3.5" /> Request Reward
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {myRequests.length === 0 ? (
            <Card className="p-8 text-center text-gray-500">
              <p className="text-3xl mb-2">🎁</p>
              <p>No reward requests yet. Go to <strong>Available Rewards</strong> to make your first request!</p>
            </Card>
          ) : (
            myRequests.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()).map(req => {
              const cfg = statusConfig[req.status];
              const isPending = req.status === 'pending';
              return (
                <Card key={req.id} className="p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
                          {cfg.icon}{cfg.label}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-800">{req.rewardName}</p>
                      {req.requestedDuration && (
                        <p className="text-sm text-gray-500">{req.requestedDuration} hour{req.requestedDuration !== 1 ? 's' : ''}</p>
                      )}
                      {req.childMessage && (
                        <p className="text-sm text-purple-600 mt-1 italic">Your message: "{req.childMessage}"</p>
                      )}
                      {req.parentNote && (
                        <p className="text-sm text-gray-600 mt-1 bg-gray-50 rounded-lg px-3 py-1.5">
                          Parent's note: "{req.parentNote}"
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-sm font-bold text-purple-700">
                          <Star className="w-3.5 h-3.5 inline me-1 text-yellow-500" />
                          {req.totalPointsRequired} pts {req.status === 'approved' ? 'spent' : 'required'}
                        </span>
                        <span className="text-xs text-gray-400">{format(new Date(req.requestedAt), 'MMM d, h:mm a')}</span>
                      </div>
                    </div>
                    {isPending && (
                      <Button size="sm" variant="secondary"
                        onClick={() => { updateRewardRequest(req.id, { status: 'cancelled', decidedAt: new Date().toISOString() }); toast.info('Request cancelled.'); }}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Request dialog */}
      <Dialog
        open={!!requestDialog}
        title={`🎁 Request: ${selectedReward?.name}`}
        onClose={() => setRequestDialog(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRequestDialog(null)}>Cancel</Button>
            <Button
              onClick={handleRequest}
              className="bg-purple-600 hover:bg-purple-700"
              disabled={availablePoints < totalCost}
            >
              Send Request ({totalCost} pts)
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {selectedReward?.costType === 'per_hour' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How many hours? (max {selectedReward.maxDuration || 3})
              </label>
              <div className="flex items-center gap-3">
                <button onClick={() => setDuration(Math.max(1, duration - 1))}
                  className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-lg font-bold">−</button>
                <span className="text-xl font-bold text-purple-600 w-8 text-center">{duration}</span>
                <button onClick={() => setDuration(Math.min(selectedReward.maxDuration || 3, duration + 1))}
                  className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-lg font-bold">+</button>
                <span className="text-sm text-gray-500">= <strong className="text-purple-700">{totalCost} pts</strong></span>
              </div>
            </div>
          )}

          <div className="bg-purple-50 rounded-xl p-4">
            <p className="text-sm text-purple-700">
              <Star className="w-4 h-4 inline me-1 text-yellow-500" />
              Total cost: <strong>{totalCost} Hero Points</strong>
            </p>
            <p className="text-xs text-purple-500 mt-1">
              You have {availablePoints} pts. {availablePoints >= totalCost ? `After this you'll have ${availablePoints - totalCost} pts (if approved).` : `You need ${totalCost - availablePoints} more points!`}
            </p>
          </div>

          <Textarea
            label="Message to your parent (optional)"
            placeholder="e.g. I worked really hard this week!"
            value={childMessage}
            onChange={e => setChildMessage(e.target.value)}
            rows={2}
          />

          <p className="text-xs text-gray-400 flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            Points are only deducted if your parent approves this request.
          </p>
        </div>
      </Dialog>
    </div>
  );
}
