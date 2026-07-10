import React, { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { Filter, Clock, CheckCircle, XCircle, Flag, MessageSquare, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Card, StatusBadge, Select } from '../../components/ui';
import type { SubmissionStatus } from '../../types';

const PAGE_SIZE = 20;

const statusConfig: Record<SubmissionStatus, { label: string; variant: 'yellow' | 'green' | 'red' | 'blue' | 'gray'; icon: React.ReactNode }> = {
  pending:    { label: 'Pending',           variant: 'yellow', icon: <Clock className="w-3 h-3" /> },
  accepted:   { label: 'Accepted',          variant: 'green',  icon: <CheckCircle className="w-3 h-3" /> },
  denied:     { label: 'Denied',            variant: 'red',    icon: <XCircle className="w-3 h-3" /> },
  flagged:    { label: 'Flagged',           variant: 'red',    icon: <Flag className="w-3 h-3" /> },
  needs_info: { label: 'Needs More Info',   variant: 'blue',   icon: <MessageSquare className="w-3 h-3" /> },
};

function SkeletonStatCard() {
  return (
    <Card className="p-4 text-center animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-gray-200 mx-auto mb-2" />
      <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto mb-1" />
      <div className="h-3 bg-gray-100 rounded w-2/3 mx-auto" />
    </Card>
  );
}

function SkeletonRow() {
  return (
    <div className="p-5 flex items-start gap-4 animate-pulse">
      <div className="w-11 h-11 rounded-xl bg-gray-200 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-1/4" />
      </div>
      <div className="w-20 h-6 bg-gray-200 rounded-full flex-shrink-0" />
    </div>
  );
}

export function MyProgress() {
  const { currentUser } = useAuth();
  const { submissions, activities, getAcceptedPoints, loading } = useData();
  const [statusFilter, setStatusFilter]   = useState<string>('all');
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [visibleCount, setVisibleCount]   = useState(PAGE_SIZE);

  // Reset pagination whenever filters change
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [statusFilter, activityFilter]);

  const stats = useMemo(() => {
    const myAll = submissions.filter(s => s.participantId === currentUser!.id);
    return {
      totalPoints: getAcceptedPoints(currentUser!.id),
      accepted: myAll.filter(s => s.status === 'accepted').length,
      denied:   myAll.filter(s => s.status === 'denied').length,
      pending:  myAll.filter(s => s.status === 'pending').length,
    };
  }, [submissions, currentUser, getAcceptedPoints]);

  const allFiltered = useMemo(() =>
    submissions
      .filter(s => s.participantId === currentUser!.id)
      .filter(s => statusFilter   === 'all' || s.status     === statusFilter)
      .filter(s => activityFilter === 'all' || s.activityId === activityFilter)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()),
    [submissions, currentUser, statusFilter, activityFilter],
  );

  const activityMap = useMemo(() => new Map(activities.map(a => [a.id, a])), [activities]);

  const visibleSubmissions = useMemo(() => allFiltered.slice(0, visibleCount), [allFiltered, visibleCount]);
  const hasMore = visibleCount < allFiltered.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">My Progress 📊</h1>
        <p className="text-gray-500 text-sm mt-1">Track all your submitted activities and their status</p>
      </div>

      {/* Stats row */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => <SkeletonStatCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Points', value: stats.totalPoints, color: 'text-blue-600 bg-blue-50',    icon: '⭐' },
            { label: 'Accepted',     value: stats.accepted,    color: 'text-green-600 bg-green-50',  icon: '✅' },
            { label: 'Pending',      value: stats.pending,     color: 'text-yellow-600 bg-yellow-50', icon: '⏳' },
            { label: 'Denied',       value: stats.denied,      color: 'text-red-500 bg-red-50',      icon: '❌' },
          ].map(({ label, value, color, icon }) => (
            <Card key={label} className="p-4 text-center">
              <div className={`text-2xl w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center ${color.split(' ')[1]}`}>{icon}</div>
              <p className={`text-2xl font-bold ${color.split(' ')[0]}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="flex gap-3 flex-wrap flex-1">
            <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-auto">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="denied">Denied</option>
            </Select>
            <Select value={activityFilter} onChange={e => setActivityFilter(e.target.value)} className="w-auto">
              <option value="all">All Activities</option>
              {activities.map(a => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
            </Select>
          </div>
          {!loading && <span className="text-sm text-gray-400">{allFiltered.length} records</span>}
        </div>
      </Card>

      {/* Submissions list */}
      <Card>
        {loading ? (
          <div className="divide-y divide-gray-50">
            <div className="px-5 py-3 text-sm text-gray-400 border-b border-gray-50">
              Loading your progress record…
            </div>
            {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : allFiltered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-gray-500 font-medium">No submissions found</p>
            <p className="text-gray-400 text-sm mt-1">
              {statusFilter === 'all' && activityFilter === 'all'
                ? 'Submit your first Hero Action to start your journey!'
                : 'Try adjusting your filters or submit a new activity'}
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-50">
              {visibleSubmissions.map(sub => {
                const activity = activityMap.get(sub.activityId);
                const cfg = statusConfig[sub.status] ?? statusConfig.pending;
                return (
                  <div key={sub.id} className="p-5 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-2xl flex-shrink-0">
                        {activity?.icon || '📌'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <p className="font-semibold text-gray-800">{activity?.name ?? 'Unknown Activity'}</p>
                            <p className="text-sm text-gray-500 mt-0.5">{sub.note}</p>
                            {sub.status === 'denied' && sub.adminComment && (
                              <div className="mt-2 p-2 bg-red-50 rounded-lg text-xs text-red-600">
                                💬 Admin comment: {sub.adminComment}
                              </div>
                            )}
                            {sub.status === 'needs_info' && sub.adminComment && (
                              <div className="mt-2 p-2 bg-blue-50 rounded-lg text-xs text-blue-600">
                                💬 {sub.adminComment}
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
            {hasMore && (
              <div className="px-5 py-4 border-t border-gray-50 text-center">
                <button
                  onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                  Load more ({allFiltered.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
