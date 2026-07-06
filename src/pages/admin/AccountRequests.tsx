import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, User, PauseCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardContent, Button, StatusBadge, Avatar, toast, EmptyState } from '../../components/ui';

type FilterStatus = 'pending' | 'active' | 'denied' | 'suspended';

export function AccountRequests() {
  const { users, approveAccount, denyAccount, suspendAccount } = useData();
  const { isMainAdmin, currentUser } = useAuth();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<FilterStatus>('pending');
  const [denyingId, setDenyingId] = useState<string | null>(null);
  const [denialReason, setDenialReason] = useState('');

  const pendingParticipants = users.filter(u => u.role === 'participant' && u.accountStatus === 'pending');
  const pendingAdmins = users.filter(u => u.role === 'admin' && u.accountStatus === 'pending');
  const filtered = users.filter(u => u.accountStatus === filter && u.role !== 'main_admin' && u.id !== currentUser?.id);

  const canApprove = (role: string) => role === 'admin' ? isMainAdmin : true;

  const handleApprove = async (userId: string, name: string) => {
    await approveAccount(userId);
    toast.success(`${name}'s account has been approved.`);
  };

  const handleDenySubmit = async (userId: string, name: string) => {
    await denyAccount(userId, denialReason || undefined);
    toast.error(`${name}'s account has been denied.`);
    setDenyingId(null);
    setDenialReason('');
  };

  const handleSuspend = async (userId: string, name: string) => {
    await suspendAccount(userId);
    toast.warning(`${name}'s account has been suspended.`);
  };

  const filterLabels: Record<FilterStatus, string> = {
    pending: t('submissions.pending'),
    active: t('submissions.accepted'),
    denied: t('submissions.denied'),
    suspended: 'Suspended',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">👤 {t('accountRequests.title')}</h1>
        <p className="text-gray-500 text-sm mt-1">{t('accountRequests.pending')}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <SummaryCard label={t('participants.title')} count={pendingParticipants.length} icon={<Clock className="w-5 h-5 text-amber-500" />} color="bg-amber-50 border-amber-200" />
        {isMainAdmin && <SummaryCard label="Admin Requests" count={pendingAdmins.length} icon={<Clock className="w-5 h-5 text-indigo-500" />} color="bg-indigo-50 border-indigo-200" />}
        <SummaryCard label="Total Pending" count={isMainAdmin ? pendingParticipants.length + pendingAdmins.length : pendingParticipants.length} icon={<User className="w-5 h-5 text-blue-500" />} color="bg-blue-50 border-blue-200" />
      </div>

      {/* Filter tabs */}
      <Card>
        <CardHeader>
          <div className="flex gap-2 flex-wrap">
            {(['pending', 'active', 'denied', 'suspended'] as FilterStatus[]).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
                  filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {filterLabels[f]}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <EmptyState icon={filter === 'pending' ? '📭' : filter === 'active' ? '✅' : '🚫'} title={`No ${filterLabels[filter].toLowerCase()} accounts`} description="" />
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map(user => (
                <div key={user.id} className="py-4 space-y-3">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <Avatar name={user.name} color={user.avatarColor} size="md" />
                      <div>
                        <p className="font-medium text-gray-800">{user.name}</p>
                        <p className="text-xs text-gray-400">@{user.username ?? '—'} · {user.email}</p>
                        {user.phoneNumber && <p className="text-xs text-gray-400">📱 {user.phoneNumber}</p>}
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400 capitalize">{user.role.replace('_', ' ')}</span>
                          <span className="text-gray-300">·</span>
                          <span className="text-xs text-gray-400">{format(new Date(user.createdAt), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge variant={user.accountStatus === 'active' ? 'green' : user.accountStatus === 'denied' ? 'red' : user.accountStatus === 'suspended' ? 'gray' : 'yellow'}>
                        {user.accountStatus}
                      </StatusBadge>

                      {user.accountStatus === 'pending' && canApprove(user.role) && (
                        <>
                          <Button variant="secondary" size="sm" onClick={() => handleApprove(user.id, user.name)} className="text-green-700 hover:bg-green-50 border border-green-200 gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> {t('accountRequests.approve')}
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => setDenyingId(user.id)} className="gap-1">
                            <XCircle className="w-3.5 h-3.5" /> {t('accountRequests.deny')}
                          </Button>
                        </>
                      )}

                      {user.accountStatus === 'pending' && !canApprove(user.role) && (
                        <span className="text-xs text-gray-400 italic">Main Admin only</span>
                      )}

                      {user.accountStatus === 'active' && isMainAdmin && (
                        <Button variant="secondary" size="sm" onClick={() => handleSuspend(user.id, user.name)} className="text-amber-600 border border-amber-200 gap-1">
                          <PauseCircle className="w-3.5 h-3.5" /> Suspend
                        </Button>
                      )}

                      {(user.accountStatus === 'denied' || user.accountStatus === 'suspended') && isMainAdmin && (
                        <Button variant="secondary" size="sm" onClick={() => handleApprove(user.id, user.name)} className="text-green-700 hover:bg-green-50 border border-green-200 gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Re-approve
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Signup message */}
                  {user.signupMessage && (
                    <div className="ms-12 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
                      <span className="font-medium">{t('accountRequests.signupMessage')}:</span> {user.signupMessage}
                    </div>
                  )}

                  {/* Denial reason shown */}
                  {user.denialReason && (
                    <div className="ms-12 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
                      <span className="font-medium">Denial reason:</span> {user.denialReason}
                    </div>
                  )}

                  {/* Deny with reason input */}
                  {denyingId === user.id && (
                    <div className="ms-12 space-y-2">
                      <textarea rows={2} placeholder={t('accountRequests.denialReason')} value={denialReason}
                        onChange={e => setDenialReason(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-red-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 resize-none" />
                      <div className="flex gap-2">
                        <Button variant="danger" size="sm" onClick={() => handleDenySubmit(user.id, user.name)}>
                          Confirm Denial
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => { setDenyingId(null); setDenialReason(''); }}>
                          {t('common.cancel')}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ label, count, icon, color }: { label: string; count: number; icon: React.ReactNode; color: string }) {
  return (
    <div className={`rounded-2xl border p-4 flex items-center gap-3 ${color}`}>
      <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{count}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}
