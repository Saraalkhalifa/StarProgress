import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, User } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardContent, Button, StatusBadge, Avatar, toast, EmptyState } from '../../components/ui';

export function AccountRequests() {
  const { users, approveAccount, denyAccount } = useData();
  const { isMainAdmin } = useAuth();
  const [filter, setFilter] = useState<'pending' | 'active' | 'denied'>('pending');

  const pendingParticipants = users.filter(
    u => u.role === 'participant' && u.accountStatus === 'pending'
  );
  const pendingAdmins = users.filter(
    u => u.role === 'admin' && u.accountStatus === 'pending'
  );
  const filtered = users.filter(u => u.accountStatus === filter && u.role !== 'main_admin');

  const handleApprove = async (userId: string, name: string) => {
    await approveAccount(userId);
    toast.success(`${name}'s account has been approved.`);
  };

  const handleDeny = async (userId: string, name: string) => {
    await denyAccount(userId);
    toast.error(`${name}'s account has been denied.`);
  };

  const canApprove = (role: string) => {
    if (role === 'admin') return isMainAdmin;
    return true; // any admin can approve participants
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Account Requests</h1>
        <p className="text-gray-500 text-sm mt-1">Review and approve or deny sign-up requests</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          label="Pending Participants"
          count={pendingParticipants.length}
          icon={<Clock className="w-5 h-5 text-amber-500" />}
          color="bg-amber-50 border-amber-200"
        />
        {isMainAdmin && (
          <SummaryCard
            label="Pending Admins"
            count={pendingAdmins.length}
            icon={<Clock className="w-5 h-5 text-indigo-500" />}
            color="bg-indigo-50 border-indigo-200"
          />
        )}
        <SummaryCard
          label="Total Pending"
          count={isMainAdmin ? pendingParticipants.length + pendingAdmins.length : pendingParticipants.length}
          icon={<User className="w-5 h-5 text-blue-500" />}
          color="bg-blue-50 border-blue-200"
        />
      </div>

      {/* Filter tabs */}
      <Card>
        <CardHeader>
          <div className="flex gap-2 flex-wrap">
            {(['pending', 'active', 'denied'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <EmptyState
              icon={filter === 'pending' ? '📭' : filter === 'active' ? '✅' : '🚫'}
              title={`No ${filter} accounts`}
              description={
                filter === 'pending'
                  ? 'No sign-up requests are waiting for review.'
                  : filter === 'active'
                  ? 'No approved accounts yet.'
                  : 'No denied accounts.'
              }
            />
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map(user => (
                <div key={user.id} className="py-4 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <Avatar name={user.name} color={user.avatarColor} size="md" />
                    <div>
                      <p className="font-medium text-gray-800">{user.name}</p>
                      <p className="text-xs text-gray-400">
                        @{user.username ?? user.email} &middot;{' '}
                        <span className="capitalize">{user.role.replace('_', ' ')}</span>
                      </p>
                      <p className="text-xs text-gray-400">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge
                      variant={
                        user.accountStatus === 'active'
                          ? 'green'
                          : user.accountStatus === 'denied'
                          ? 'red'
                          : 'yellow'
                      }
                    >
                      {user.accountStatus}
                    </StatusBadge>

                    {user.accountStatus === 'pending' && canApprove(user.role) && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleApprove(user.id, user.name)}
                          className="text-green-700 hover:bg-green-50 border border-green-200 gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeny(user.id, user.name)}
                          className="gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Deny
                        </Button>
                      </>
                    )}

                    {user.accountStatus === 'pending' && !canApprove(user.role) && (
                      <span className="text-xs text-gray-400 italic">Main Admin only</span>
                    )}

                    {user.accountStatus === 'denied' && isMainAdmin && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleApprove(user.id, user.name)}
                        className="text-green-700 hover:bg-green-50 border border-green-200 gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Re-approve
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  label,
  count,
  icon,
  color,
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className={`rounded-2xl border p-4 flex items-center gap-3 ${color}`}>
      <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{count}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}
