import React, { useState } from 'react';
import { Trash2, Search } from 'lucide-react';
import { format } from 'date-fns';
import { useData } from '../../contexts/DataContext';
import { Card, StatusBadge, Select, ConfirmDialog, EmptyState, toast } from '../../components/ui';
import { Avatar } from '../../components/ui';

export function ProgressRecords() {
  const { submissions, users, activities, deleteSubmission } = useData();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [participantFilter, setParticipantFilter] = useState('all');
  const [activityFilter, setActivityFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const participants = users.filter(u => u.role === 'participant');
  const now = new Date();

  const filtered = submissions
    .filter(s => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (participantFilter !== 'all' && s.participantId !== participantFilter) return false;
      if (activityFilter !== 'all' && s.activityId !== activityFilter) return false;
      if (monthFilter !== 'all') {
        const d = new Date(s.submittedAt);
        const [y, m] = monthFilter.split('-').map(Number);
        if (d.getFullYear() !== y || d.getMonth() !== m) return false;
      }
      const participant = users.find(u => u.id === s.participantId);
      const activity = activities.find(a => a.id === s.activityId);
      if (search) {
        const q = search.toLowerCase();
        if (!participant?.name.toLowerCase().includes(q) && !activity?.name.toLowerCase().includes(q) && !s.note.toLowerCase().includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  const statusConfig = {
    pending: { variant: 'yellow' as const },
    accepted: { variant: 'green' as const },
    denied: { variant: 'red' as const },
  };

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return { value: `${d.getFullYear()}-${d.getMonth()}`, label: format(d, 'MMMM yyyy') };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Progress Records 📋</h1>
        <p className="text-gray-500 text-sm">{filtered.length} records</p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, activity, note..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="denied">Denied</option>
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
        {filtered.length === 0 ? (
          <EmptyState icon="📋" title="No records found" description="Try adjusting your filters" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Participant</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Activity</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Note</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Points</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(sub => {
                  const participant = users.find(u => u.id === sub.participantId);
                  const activity = activities.find(a => a.id === sub.activityId);
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
                      <td className="px-4 py-3 text-center font-bold text-blue-600">{sub.pointsValueAtSubmission}</td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge variant={statusConfig[sub.status].variant}>{sub.status}</StatusBadge>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 hidden lg:table-cell">
                        {format(new Date(sub.submittedAt), 'MMM d, yyyy HH:mm')}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setDeleteId(sub.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={async () => { await deleteSubmission(deleteId!); toast.success('Record deleted.'); }} title="Delete Record" message="This will permanently delete this submission record." />
    </div>
  );
}
