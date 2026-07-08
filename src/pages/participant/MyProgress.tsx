import React, { useState } from 'react';
import { format } from 'date-fns';
import { Filter, Clock, CheckCircle, XCircle, Flag, MessageSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Card, StatusBadge, Select } from '../../components/ui';
import type { SubmissionStatus } from '../../types';

const statusConfig: Record<SubmissionStatus, { label: string; variant: 'yellow' | 'green' | 'red' | 'blue' | 'gray'; icon: React.ReactNode }> = {
  pending: { label: 'Pending', variant: 'yellow', icon: <Clock className="w-3 h-3" /> },
  accepted: { label: 'Accepted', variant: 'green', icon: <CheckCircle className="w-3 h-3" /> },
  denied: { label: 'Denied', variant: 'red', icon: <XCircle className="w-3 h-3" /> },
  flagged: { label: 'Flagged', variant: 'red', icon: <Flag className="w-3 h-3" /> },
  needs_info: { label: 'Needs More Info', variant: 'blue', icon: <MessageSquare className="w-3 h-3" /> },
};

export function MyProgress() {
  const { currentUser } = useAuth();
  const { submissions, activities, getAcceptedPoints } = useData();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activityFilter, setActivityFilter] = useState<string>('all');

  const mySubmissions = submissions
    .filter(s => s.participantId === currentUser!.id)
    .filter(s => statusFilter === 'all' || s.status === statusFilter)
    .filter(s => activityFilter === 'all' || s.activityId === activityFilter)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  const totalPoints = getAcceptedPoints(currentUser!.id);
  const accepted = submissions.filter(s => s.participantId === currentUser!.id && s.status === 'accepted').length;
  const denied = submissions.filter(s => s.participantId === currentUser!.id && s.status === 'denied').length;
  const pending = submissions.filter(s => s.participantId === currentUser!.id && s.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">My Progress 📊</h1>
        <p className="text-gray-500 text-sm mt-1">Track all your submitted activities and their status</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Points', value: totalPoints, color: 'text-blue-600 bg-blue-50', icon: '⭐' },
          { label: 'Accepted', value: accepted, color: 'text-green-600 bg-green-50', icon: '✅' },
          { label: 'Pending', value: pending, color: 'text-yellow-600 bg-yellow-50', icon: '⏳' },
          { label: 'Denied', value: denied, color: 'text-red-500 bg-red-50', icon: '❌' },
        ].map(({ label, value, color, icon }) => (
          <Card key={label} className="p-4 text-center">
            <div className={`text-2xl w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center ${color.split(' ')[1]}`}>{icon}</div>
            <p className={`text-2xl font-bold ${color.split(' ')[0]}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="flex gap-3 flex-wrap flex-1">
            <Select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-auto"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="denied">Denied</option>
            </Select>
            <Select
              value={activityFilter}
              onChange={e => setActivityFilter(e.target.value)}
              className="w-auto"
            >
              <option value="all">All Activities</option>
              {activities.map(a => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
            </Select>
          </div>
          <span className="text-sm text-gray-400">{mySubmissions.length} records</span>
        </div>
      </Card>

      {/* Submissions list */}
      <Card>
        {mySubmissions.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-gray-500 font-medium">No submissions found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or submit a new activity</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {mySubmissions.map(sub => {
              const activity = activities.find(a => a.id === sub.activityId);
              const cfg = statusConfig[sub.status];
              return (
                <div key={sub.id} className="p-5 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-2xl flex-shrink-0">
                      {activity?.icon || '📌'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <p className="font-semibold text-gray-800">{activity?.name}</p>
                          <p className="text-sm text-gray-500 mt-0.5">{sub.note}</p>
                          {sub.status === 'denied' && sub.adminComment && (
                            <div className="mt-2 p-2 bg-red-50 rounded-lg text-xs text-red-600">
                              💬 Admin comment: {sub.adminComment}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <StatusBadge variant={cfg.variant}>
                            {cfg.icon} {cfg.label}
                          </StatusBadge>
                          {sub.status === 'accepted' && (
                            <span className="font-bold text-green-600">+{sub.pointsValueAtSubmission} pts</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-4 mt-2 text-xs text-gray-400">
                        <span>Submitted: {format(new Date(sub.submittedAt), 'MMM d, yyyy HH:mm')}</span>
                        {sub.reviewedAt && <span>Reviewed: {format(new Date(sub.reviewedAt), 'MMM d, yyyy')}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
