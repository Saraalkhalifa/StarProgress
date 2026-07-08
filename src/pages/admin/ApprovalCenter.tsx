import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, MessageSquare, Flag, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Card, Button, StatusBadge, Dialog, Textarea, toast, EmptyState } from '../../components/ui';
import { Avatar } from '../../components/ui';
import { format } from 'date-fns';
import type { SubmissionStatus } from '../../types';

type FilterMode = 'pending' | 'flagged' | 'needs_info' | 'all';

const statusVariant: Record<SubmissionStatus, 'yellow' | 'green' | 'red' | 'blue' | 'gray'> = {
  pending: 'yellow',
  accepted: 'green',
  denied: 'red',
  flagged: 'red',
  needs_info: 'blue',
};

export function ApprovalCenter() {
  const { currentUser } = useAuth();
  const { submissions, users, activities, approveSubmission, denySubmission, updateSubmission, addAcceptedSubmission, getAcceptedPoints } = useData();

  const [filter, setFilter] = useState<FilterMode>('pending');
  const [denyDialogId, setDenyDialogId] = useState<string | null>(null);
  const [denyComment, setDenyComment] = useState('');
  const [flagDialogId, setFlagDialogId] = useState<string | null>(null);
  const [flagNote, setFlagNote] = useState('');
  const [infoDialogId, setInfoDialogId] = useState<string | null>(null);
  const [infoRequest, setInfoRequest] = useState('');
  const [penaltyDialogId, setPenaltyDialogId] = useState<string | null>(null);
  const [penaltyReason, setPenaltyReason] = useState('');

  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const flaggedCount = submissions.filter(s => s.status === 'flagged').length;
  const needsInfoCount = submissions.filter(s => s.status === 'needs_info').length;

  const filtered = submissions
    .filter(s => {
      if (filter === 'all') return true;
      return s.status === filter;
    })
    .sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (b.status === 'pending' && a.status !== 'pending') return 1;
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });

  const handleApprove = async (id: string) => {
    await approveSubmission(id, currentUser!.id);
    toast.success('Action approved! Hero Points added. ✅');
  };

  const handleDeny = async () => {
    if (!denyDialogId) return;
    await denySubmission(denyDialogId, currentUser!.id, denyComment || undefined);
    toast.info('Submission denied. No points awarded.');
    setDenyDialogId(null);
    setDenyComment('');
  };

  const handleFlag = async () => {
    if (!flagDialogId) return;
    await updateSubmission(flagDialogId, {
      status: 'flagged',
      isFlagged: true,
      flagNote: flagNote || 'Flagged for review',
      adminComment: flagNote || 'This submission has been flagged for review.',
      reviewedBy: currentUser!.id,
      reviewedAt: new Date().toISOString(),
    });
    toast.warning('Submission flagged for review. 🚩');
    setFlagDialogId(null);
    setFlagNote('');
  };

  const handleNeedsInfo = async () => {
    if (!infoDialogId) return;
    await updateSubmission(infoDialogId, {
      status: 'needs_info',
      adminComment: infoRequest || 'Please provide more details about this activity.',
      reviewedBy: currentUser!.id,
      reviewedAt: new Date().toISOString(),
    });
    toast.info('Participant notified to provide more information. 💬');
    setInfoDialogId(null);
    setInfoRequest('');
  };

  const handleCheatingPenalty = async () => {
    if (!penaltyDialogId) return;
    if (!penaltyReason.trim()) {
      toast.error('A reason is required for cheating penalties.');
      return;
    }
    const sub = submissions.find(s => s.id === penaltyDialogId);
    if (!sub) return;

    await denySubmission(penaltyDialogId, currentUser!.id, `Cheating detected: ${penaltyReason}`);
    await addAcceptedSubmission({
      participantId: sub.participantId,
      activityId: sub.activityId,
      note: `CHEATING PENALTY: ${penaltyReason}`,
      pointsValueAtSubmission: -100,
      activity_date: new Date().toISOString().slice(0, 10),
      sourceType: 'activity_submission',
    });
    toast.success(`⚠️ Cheating penalty applied. −100 Hero Points deducted and submission denied.`);
    setPenaltyDialogId(null);
    setPenaltyReason('');
  };

  const filters: { key: FilterMode; label: string; count: number; color: string }[] = [
    { key: 'pending', label: 'Pending', count: pendingCount, color: 'bg-yellow-100 text-yellow-700' },
    { key: 'flagged', label: 'Flagged', count: flaggedCount, color: 'bg-red-100 text-red-700' },
    { key: 'needs_info', label: 'Needs Info', count: needsInfoCount, color: 'bg-blue-100 text-blue-700' },
    { key: 'all', label: 'All', count: submissions.length, color: 'bg-gray-100 text-gray-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Review Queue ✅</h1>
          <p className="text-gray-500 text-sm mt-1">Review hero action submissions and award Hero Points</p>
        </div>
        {pendingCount > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 animate-pulse">
            <Clock className="w-4 h-4" />
            {pendingCount} action{pendingCount !== 1 ? 's' : ''} awaiting review
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-blue-50'}`}
          >
            {f.label} {f.count > 0 && <span className={`ms-1 text-xs px-1.5 py-0.5 rounded-full ${filter === f.key ? 'bg-white/20' : f.color}`}>{f.count}</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="🎉" title="All clear!" description="No submissions in this category. Great job!" />
      ) : (
        <div className="space-y-4">
          {filtered.map(sub => {
            const participant = users.find(u => u.id === sub.participantId);
            const activity = activities.find(a => a.id === sub.activityId);
            const isPending = sub.status === 'pending';
            const isFlagged = sub.status === 'flagged';
            const reviewer = sub.reviewedBy ? users.find(u => u.id === sub.reviewedBy) : null;
            const participantPoints = getAcceptedPoints(sub.participantId);

            return (
              <Card key={sub.id} className={`overflow-hidden ${isPending ? 'border-l-4 border-l-yellow-400' : isFlagged ? 'border-l-4 border-l-red-400' : ''}`}>
                <div className="p-5">
                  <div className="flex items-start gap-4 flex-wrap">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar name={participant?.name || '?'} color={participant?.avatarColor} size="md" />
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800">{participant?.name}</p>
                        <p className="text-xs text-gray-400">@{participant?.username || participant?.email}</p>
                        <p className="text-xs text-blue-600 font-medium">{participantPoints} Hero Points total</p>
                      </div>
                    </div>
                    <StatusBadge variant={statusVariant[sub.status] ?? 'gray'}>
                      {sub.status.replace('_', ' ')}
                    </StatusBadge>
                  </div>

                  {/* Activity + description */}
                  <div className="mt-4 p-3 bg-blue-50/60 rounded-xl flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{activity?.icon || '📌'}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <p className="font-semibold text-gray-800">{activity?.name}</p>
                        <span className="text-blue-700 font-bold bg-blue-100 px-2 py-0.5 rounded-lg text-sm">
                          +{sub.pointsValueAtSubmission} pts
                        </span>
                      </div>
                      {sub.activity_date && (
                        <p className="text-xs text-gray-400 mt-0.5">Activity date: {sub.activity_date}</p>
                      )}
                      <div className="flex items-start gap-1 mt-2">
                        <MessageSquare className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700">{sub.note}</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-1.5">
                        Submitted {format(new Date(sub.submittedAt), 'MMM d, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>

                  {sub.adminComment && (
                    <div className={`mt-3 p-3 rounded-xl text-sm ${sub.status === 'needs_info' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                      💬 {sub.adminComment}
                    </div>
                  )}

                  {reviewer && (
                    <p className="text-xs text-gray-400 mt-2">
                      Reviewed by {reviewer.name} · {sub.reviewedAt ? format(new Date(sub.reviewedAt), 'MMM d, yyyy') : ''}
                    </p>
                  )}

                  {/* Action buttons */}
                  {(isPending || isFlagged) && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => handleApprove(sub.id)} className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="w-4 h-4" /> Accept (+{sub.pointsValueAtSubmission} pts)
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => { setDenyDialogId(sub.id); setDenyComment(''); }}>
                        <XCircle className="w-4 h-4" /> Deny
                      </Button>
                      {isPending && (
                        <>
                          <Button size="sm" variant="secondary" onClick={() => { setInfoDialogId(sub.id); setInfoRequest(''); }}>
                            <MessageSquare className="w-4 h-4" /> Needs Info
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => { setFlagDialogId(sub.id); setFlagNote(''); }}
                            className="text-orange-600 border-orange-200 hover:bg-orange-50">
                            <Flag className="w-4 h-4" /> Flag
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="secondary" onClick={() => { setPenaltyDialogId(sub.id); setPenaltyReason(''); }}
                        className="text-red-600 border-red-200 hover:bg-red-50">
                        <AlertTriangle className="w-4 h-4" /> Cheating Penalty
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Deny dialog */}
      <Dialog open={!!denyDialogId} onClose={() => setDenyDialogId(null)} title="Deny Submission"
        footer={<><Button variant="secondary" onClick={() => setDenyDialogId(null)}>Cancel</Button><Button variant="danger" onClick={handleDeny}><XCircle className="w-4 h-4" /> Deny</Button></>}>
        <Textarea value={denyComment} onChange={e => setDenyComment(e.target.value)}
          placeholder="e.g. Your description is too short. Please resubmit with more details."
          rows={3} label="Reason for denial (optional but recommended)" />
      </Dialog>

      {/* Flag dialog */}
      <Dialog open={!!flagDialogId} onClose={() => setFlagDialogId(null)} title="🚩 Flag Submission for Review"
        footer={<><Button variant="secondary" onClick={() => setFlagDialogId(null)}>Cancel</Button><Button onClick={handleFlag} className="bg-orange-500 hover:bg-orange-600">Flag Submission</Button></>}>
        <p className="text-sm text-gray-600 mb-3">Flag this submission for closer review. The participant will see this status.</p>
        <Textarea value={flagNote} onChange={e => setFlagNote(e.target.value)}
          placeholder="Reason for flagging (e.g. Submission appears suspicious, repeated activity)"
          rows={3} label="Flag reason (optional)" />
      </Dialog>

      {/* Needs More Info dialog */}
      <Dialog open={!!infoDialogId} onClose={() => setInfoDialogId(null)} title="💬 Request More Information"
        footer={<><Button variant="secondary" onClick={() => setInfoDialogId(null)}>Cancel</Button><Button onClick={handleNeedsInfo}>Send Request</Button></>}>
        <p className="text-sm text-gray-600 mb-3">The participant will see this message and can update their submission before it returns to Pending.</p>
        <Textarea value={infoRequest} onChange={e => setInfoRequest(e.target.value)}
          placeholder="e.g. Please tell us the book name and how many pages you read."
          rows={3} label="What information is needed?" />
      </Dialog>

      {/* Cheating penalty dialog */}
      <Dialog open={!!penaltyDialogId} onClose={() => setPenaltyDialogId(null)} title="⚠️ Apply Cheating Penalty"
        footer={<><Button variant="secondary" onClick={() => setPenaltyDialogId(null)}>Cancel</Button><Button variant="danger" onClick={handleCheatingPenalty}><AlertTriangle className="w-4 h-4" /> Apply −100 Penalty</Button></>}>
        <div className="space-y-3">
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
            <p className="font-semibold mb-1">Warning: This action deducts 100 Hero Points</p>
            <p>This will deny the submission and deduct 100 Hero Points from the hero's account. A reason is required. This action is logged and can be reversed by the Main Admin.</p>
          </div>
          <Textarea value={penaltyReason} onChange={e => setPenaltyReason(e.target.value)}
            placeholder="Required: Explain why the cheating penalty is being applied."
            rows={3} label="Reason for penalty (required)" />
        </div>
      </Dialog>
    </div>
  );
}
