import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, MessageSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Card, Button, StatusBadge, Dialog, Textarea, toast, EmptyState } from '../../components/ui';
import { Avatar } from '../../components/ui';
import { format } from 'date-fns';

export function ApprovalCenter() {
  const { currentUser } = useAuth();
  const { submissions, users, activities, approveSubmission, denySubmission } = useData();
  const [denyDialogId, setDenyDialogId] = useState<string | null>(null);
  const [denyComment, setDenyComment] = useState('');
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  const filtered = submissions
    .filter(s => filter === 'all' || s.status === 'pending')
    .sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (b.status === 'pending' && a.status !== 'pending') return 1;
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });

  const pendingCount = submissions.filter(s => s.status === 'pending').length;

  const handleApprove = (id: string) => {
    approveSubmission(id, currentUser!.id);
    toast.success('Submission approved! Points added. ✅');
  };

  const handleDeny = () => {
    if (!denyDialogId) return;
    denySubmission(denyDialogId, currentUser!.id, denyComment || undefined);
    toast.info('Submission denied.');
    setDenyDialogId(null);
    setDenyComment('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Approval Center ✅</h1>
          <p className="text-gray-500 text-sm mt-1">Review and approve participant submissions</p>
        </div>
        {pendingCount > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 animate-pulse">
            <Clock className="w-4 h-4" />
            {pendingCount} submission{pendingCount !== 1 ? 's' : ''} awaiting approval
          </div>
        )}
      </div>

      {/* Filter toggle */}
      <div className="flex gap-2">
        {(['pending', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-blue-50'}`}
          >
            {f === 'pending' ? `⏳ Pending (${pendingCount})` : '📋 All Submissions'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="🎉" title="No pending submissions!" description="All submissions have been reviewed. Great job!" />
      ) : (
        <div className="space-y-4">
          {filtered.map(sub => {
            const participant = users.find(u => u.id === sub.participantId);
            const activity = activities.find(a => a.id === sub.activityId);
            const isPending = sub.status === 'pending';
            const reviewer = sub.reviewedBy ? users.find(u => u.id === sub.reviewedBy) : null;

            return (
              <Card key={sub.id} className={`overflow-hidden ${isPending ? 'border-l-4 border-l-yellow-400' : ''}`}>
                <div className="p-5">
                  <div className="flex items-start gap-4 flex-wrap">
                    {/* Participant */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar name={participant?.name || '?'} color={participant?.avatarColor} size="md" />
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800">{participant?.name}</p>
                        <p className="text-xs text-gray-400">{format(new Date(sub.submittedAt), 'MMM d, yyyy HH:mm')}</p>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2">
                      <StatusBadge variant={isPending ? 'yellow' : sub.status === 'accepted' ? 'green' : 'red'}>
                        {sub.status}
                      </StatusBadge>
                    </div>
                  </div>

                  {/* Activity info */}
                  <div className="mt-4 p-3 bg-blue-50/60 rounded-xl flex items-start gap-3">
                    <span className="text-2xl">{activity?.icon || '📌'}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <p className="font-semibold text-gray-800">{activity?.name}</p>
                        <span className="text-blue-700 font-bold bg-blue-100 px-2 py-0.5 rounded-lg text-sm">
                          +{sub.pointsValueAtSubmission} pts
                        </span>
                      </div>
                      <div className="flex items-start gap-1 mt-1">
                        <MessageSquare className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600 italic">"{sub.note}"</p>
                      </div>
                    </div>
                  </div>

                  {sub.adminComment && (
                    <div className="mt-3 p-3 bg-red-50 rounded-xl text-sm text-red-600">
                      💬 Admin comment: {sub.adminComment}
                    </div>
                  )}

                  {reviewer && (
                    <p className="text-xs text-gray-400 mt-2">
                      Reviewed by {reviewer.name} on {sub.reviewedAt ? format(new Date(sub.reviewedAt), 'MMM d, yyyy') : ''}
                    </p>
                  )}

                  {/* Actions */}
                  {isPending && (
                    <div className="mt-4 flex gap-3">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleApprove(sub.id)}
                        className="flex-1 sm:flex-none"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Accept (+{sub.pointsValueAtSubmission} pts)
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => { setDenyDialogId(sub.id); setDenyComment(''); }}
                        className="flex-1 sm:flex-none"
                      >
                        <XCircle className="w-4 h-4" />
                        Deny
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
      <Dialog open={!!denyDialogId} onClose={() => setDenyDialogId(null)} title="Deny Submission">
        <p className="text-sm text-gray-600 mb-4">Optionally add a reason for the participant.</p>
        <Textarea
          value={denyComment}
          onChange={e => setDenyComment(e.target.value)}
          placeholder="e.g. Please provide more details about this activity"
          rows={3}
          label="Reason (optional)"
        />
        <div className="flex gap-3 mt-5">
          <Button variant="secondary" onClick={() => setDenyDialogId(null)} className="flex-1">Cancel</Button>
          <Button variant="danger" onClick={handleDeny} className="flex-1">
            <XCircle className="w-4 h-4" /> Deny Submission
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
