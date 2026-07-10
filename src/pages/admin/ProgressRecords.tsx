import React, { useState, useMemo, useEffect } from 'react';
import { Trash2, Search, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { useData } from '../../contexts/DataContext';
import { Card, StatusBadge, Select, ConfirmDialog, EmptyState, toast } from '../../components/ui';
import { Avatar } from '../../components/ui';

const PAGE_SIZE = 20;

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gray-200 flex-shrink-0" />
          <div className="h-3 bg-gray-200 rounded w-20" />
        </div>
      </td>
      <td className="px-4 py-3"><div className="h-3 bg-gray-200 rounded w-24" /></td>
      <td className="px-4 py-3 hidden md:table-cell"><div className="h-3 bg-gray-200 rounded w-32" /></td>
      <td className="px-4 py-3 text-center"><div className="h-3 bg-gray-200 rounded w-8 mx-auto" /></td>
      <td className="px-4 py-3 text-center"><div className="h-5 bg-gray-200 rounded-full w-16 mx-auto" /></td>
      <td className="px-4 py-3 hidden lg:table-cell"><div className="h-3 bg-gray-200 rounded w-24" /></td>
      <td className="px-4 py-3"><div className="w-6 h-6 bg-gray-200 rounded" /></td>
    </tr>
  );
}

const statusVariant: Record<string, 'yellow' | 'green' | 'red' | 'blue' | 'gray'> = {
  pending:    'yellow',
  accepted:   'green',
  denied:     'red',
  flagged:    'red',
  needs_info: 'blue',
};

export function ProgressRecords() {
  const { submissions, users, activities, deleteSubmission, loading } = useData();
  const [search, setSearch]                   = useState('');
  const [statusFilter, setStatusFilter]       = useState('all');
  const [participantFilter, setParticipantFilter] = useState('all');
  const [activityFilter, setActivityFilter]   = useState('all');
  const [monthFilter, setMonthFilter]         = useState('all');
  const [deleteId, setDeleteId]               = useState<string | null>(null);
  const [visibleCount, setVisibleCount]       = useState(PAGE_SIZE);

  // Reset pagination when any filter changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, statusFilter, participantFilter, activityFilter, monthFilter]);

  const participants = useMemo(() => users.filter(u => u.role === 'participant'), [users]);

  // O(1) lookups instead of O(n) linear search inside the render loop
  const userMap     = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);
  const activityMap = useMemo(() => new Map(activities.map(a => [a.id, a])), [activities]);

  const months = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return { value: `${d.getFullYear()}-${d.getMonth()}`, label: format(d, 'MMMM yyyy') };
    });
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return submissions
      .filter(s => {
        if (statusFilter      !== 'all' && s.status        !== statusFilter)      return false;
        if (participantFilter !== 'all' && s.participantId !== participantFilter) return false;
        if (activityFilter    !== 'all' && s.activityId    !== activityFilter)    return false;
        if (monthFilter !== 'all') {
          const d = new Date(s.submittedAt);
          const [y, m] = monthFilter.split('-').map(Number);
          if (d.getFullYear() !== y || d.getMonth() !== m) return false;
        }
        if (q) {
          const participant = userMap.get(s.participantId);
          const activity    = activityMap.get(s.activityId);
          if (
            !participant?.name.toLowerCase().includes(q) &&
            !activity?.name.toLowerCase().includes(q) &&
            !s.note.toLowerCase().includes(q)
          ) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }, [submissions, statusFilter, participantFilter, activityFilter, monthFilter, search, userMap, activityMap]);

  const visibleRows = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore = visibleCount < filtered.length;

  const tableHead = (
    <thead className="bg-gray-50 border-b border-gray-100">
      <tr>
        <th className="text-left px-6 py-3 font-medium text-gray-500">Participant</th>
        <th className="text-left px-4 py-3 font-medium text-gray-500">Activity</th>
        <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Note</th>
        <th className="text-center px-4 py-3 font-medium text-gray-500">Points</th>
        <th className="text-center px-4 py-3 font-medium text-gray-500">Status</th>
        <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Date</th>
        <th className="px-4 py-3" />
      </tr>
    </thead>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Progress Records 📋</h1>
        <p className="text-gray-500 text-sm">
          {loading ? 'Loading records…' : `${filtered.length} records`}
        </p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, activity, note…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="denied">Denied</option>
            <option value="flagged">Flagged</option>
            <option value="needs_info">Needs Info</option>
          </Select>
          <Select value={participantFilter} onChange={e => setParticipantFilter(e.target.value)}>
            <option value="all">All Participants</option>
            {participants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <Select value={activityFilter} onChange={e => setActivityFilter(e.target.value)}>
            <option value="all">All Activities</option>
            {activities.map(a => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
          </Select>
          <Select value={monthFilter} onChange={e => setMonthFilter(e.target.value)}>
            <option value="all">All Time</option>
            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              {tableHead}
              <tbody className="divide-y divide-gray-50">
                {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
              </tbody>
            </table>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="📋" title="No records found" description="Try adjusting your filters" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                {tableHead}
                <tbody className="divide-y divide-gray-50">
                  {visibleRows.map(sub => {
                    const participant = userMap.get(sub.participantId);
                    const activity    = activityMap.get(sub.activityId);
                    return (
                      <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar name={participant?.name || '?'} color={participant?.avatarColor} size="sm" />
                            <span className="font-medium text-gray-800 text-xs">{participant?.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span>{activity?.icon}</span>
                            <span className="text-gray-700 text-xs">{activity?.name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs max-w-xs hidden md:table-cell">
                          <p className="truncate">{sub.note}</p>
                          {sub.adminComment && <p className="text-red-400 truncate">💬 {sub.adminComment}</p>}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-blue-600">
                          {sub.pointsValueAtSubmission}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <StatusBadge variant={statusVariant[sub.status] ?? 'gray'}>
                            {sub.status}
                          </StatusBadge>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 hidden lg:table-cell">
                          {format(new Date(sub.submittedAt), 'MMM d, yyyy HH:mm')}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setDeleteId(sub.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {hasMore && (
              <div className="px-6 py-4 border-t border-gray-50 text-center">
                <button
                  onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                  Load more ({filtered.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => { await deleteSubmission(deleteId!); toast.success('Record deleted.'); }}
        title="Delete Record"
        message="This will permanently delete this submission record."
      />
    </div>
  );
}
