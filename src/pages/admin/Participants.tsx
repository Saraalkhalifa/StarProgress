import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Card, Button, Input, Dialog, ConfirmDialog, Avatar, EmptyState, toast } from '../../components/ui';
import { simpleHash, AVATAR_COLORS } from '../../lib/utils';
import type { User } from '../../types';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
});
type FormData = z.infer<typeof schema>;

type StatusTab = 'all' | 'active' | 'pending' | 'suspended';

const TABS: { id: StatusTab; label: string }[] = [
  { id: 'all',       label: 'All' },
  { id: 'active',    label: 'Active' },
  { id: 'pending',   label: 'Pending' },
  { id: 'suspended', label: 'Suspended' },
];

export function ParticipantsManagement() {
  const { users, addUser, updateUser, softDeleteUser, getAcceptedPoints, submissions } = useData();
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'points' | 'activity'>('points');
  const [editUser, setEditUser] = useState<User | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const statusTab = (searchParams.get('status') || 'all') as StatusTab;
  const setStatusTab = (tab: StatusTab) => {
    setSearchParams(tab === 'all' ? {} : { status: tab }, { replace: true });
  };

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const allParticipants = users.filter(u => u.role === 'participant' && u.accountStatus !== 'deleted');

  const counts: Record<StatusTab, number> = {
    all:       allParticipants.length,
    active:    allParticipants.filter(u => u.accountStatus === 'active').length,
    pending:   allParticipants.filter(u => u.accountStatus === 'pending').length,
    suspended: allParticipants.filter(u => u.accountStatus === 'suspended').length,
  };

  const participants = allParticipants
    .filter(u => statusTab === 'all' || u.accountStatus === statusTab)
    .filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'points') return getAcceptedPoints(b.id) - getAcceptedPoints(a.id);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      const aLast = submissions.filter(s => s.participantId === a.id).sort((x, y) => new Date(y.submittedAt).getTime() - new Date(x.submittedAt).getTime())[0]?.submittedAt || '';
      const bLast = submissions.filter(s => s.participantId === b.id).sort((x, y) => new Date(y.submittedAt).getTime() - new Date(x.submittedAt).getTime())[0]?.submittedAt || '';
      return bLast.localeCompare(aLast);
    });

  const openEdit = (u: User) => {
    setEditUser(u);
    setValue('name', u.name);
    setValue('email', u.email);
    setValue('password', '');
  };

  const onSubmit = async (data: FormData) => {
    const emailExists = users.find(u => u.email.toLowerCase() === data.email.toLowerCase() && u.id !== editUser?.id);
    if (emailExists) { toast.error('This email is already in use.'); return; }

    if (editUser) {
      const updates: Partial<User> = { name: data.name, email: data.email };
      if (data.password) updates.passwordHash = simpleHash(data.password);
      await updateUser(editUser.id, updates);
      toast.success('Participant updated!');
      setEditUser(null);
    } else {
      const colorIndex = users.length % AVATAR_COLORS.length;
      await addUser({
        name: data.name,
        email: data.email,
        passwordHash: simpleHash(data.password || 'password123'),
        role: 'participant',
        accountStatus: 'active',
        avatarColor: AVATAR_COLORS[colorIndex],
      });
      toast.success('Participant added!');
      setShowAdd(false);
    }
    reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Participant Management 👥</h1>
          <p className="text-gray-500 text-sm">{counts.all} participants total</p>
        </div>
        <Button onClick={() => { setShowAdd(true); reset(); }}>
          <Plus className="w-4 h-4" /> Add Participant
        </Button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setStatusTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              statusTab === id
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
            {counts[id] > 0 && (
              <span className={`text-xs rounded-full px-1.5 py-0.5 font-semibold ${
                statusTab === id ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'
              }`}>
                {counts[id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search & sort */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
          />
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as 'name' | 'points' | 'activity')} className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white">
          <option value="points">Sort by Points</option>
          <option value="name">Sort by Name</option>
          <option value="activity">Sort by Activity</option>
        </select>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {participants.length === 0 ? (
          <EmptyState
            icon="👤"
            title={statusTab === 'all' ? 'No participants yet' : `No ${statusTab} participants`}
            description={statusTab === 'all' ? 'Add your first participant to get started' : `No participants with status "${statusTab}" found.`}
            action={statusTab === 'all' ? <Button onClick={() => setShowAdd(true)} size="sm"><Plus className="w-4 h-4" />Add Participant</Button> : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Participant</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Email</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Points</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Submissions</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {participants.map((p, i) => {
                  const pts = getAcceptedPoints(p.id);
                  const subs = submissions.filter(s => s.participantId === p.id).length;
                  const accepted = submissions.filter(s => s.participantId === p.id && s.status === 'accepted').length;
                  const statusColor: Record<string, string> = {
                    active:    'bg-green-100 text-green-700',
                    pending:   'bg-yellow-100 text-yellow-700',
                    suspended: 'bg-red-100 text-red-700',
                    denied:    'bg-gray-100 text-gray-500',
                  };
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar name={p.name} color={p.avatarColor} size="sm" />
                            <span className="absolute -top-1 -left-1 w-4 h-4 bg-blue-600 rounded-full text-white text-[9px] flex items-center justify-center font-bold">
                              {i + 1}
                            </span>
                          </div>
                          <span className="font-medium text-gray-800">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-500 hidden md:table-cell">{p.email}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusColor[p.accountStatus || 'active'] || 'bg-gray-100 text-gray-500'}`}>
                          {p.accountStatus || 'active'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center font-bold text-blue-600">{pts}</td>
                      <td className="px-4 py-4 text-center hidden sm:table-cell">
                        <span className="text-green-600">{accepted} ✓</span>
                        <span className="text-gray-400"> / {subs}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEdit(p)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 hover:text-blue-700 transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {p.id !== currentUser?.id && (
                            <button onClick={() => setDeleteId(p.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add/Edit dialog */}
      <Dialog open={showAdd || !!editUser} onClose={() => { setShowAdd(false); setEditUser(null); reset(); }} title={editUser ? 'Edit Participant' : 'Add New Participant'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Full Name" placeholder="e.g. Fatima Al-Zahra" error={errors.name?.message} {...register('name')} />
          <Input label="Email" type="email" placeholder="fatima@example.com" error={errors.email?.message} {...register('email')} />
          <Input label={editUser ? 'New Password (leave blank to keep)' : 'Password'} type="password" placeholder="••••••••" error={errors.password?.message} {...register('password')} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setShowAdd(false); setEditUser(null); reset(); }} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">{editUser ? 'Save Changes' : 'Add Participant'}</Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => { await softDeleteUser(deleteId!); toast.success('Participant removed.'); }}
        title="Remove Participant"
        message="This participant will be removed from active lists, leaderboards, dashboards, and login access. Their historical records will be kept privately for audit purposes. Are you sure?"
      />
    </div>
  );
}
