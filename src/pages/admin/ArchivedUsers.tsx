import React, { useEffect, useState } from 'react';
import { RotateCcw, Archive } from 'lucide-react';
import { format } from 'date-fns';
import { storage } from '../../lib/storage';
import { useData } from '../../contexts/DataContext';
import { Card, Button, Avatar, StatusBadge, EmptyState, toast } from '../../components/ui';
import type { User } from '../../types';

export function ArchivedUsers() {
  const { users, restoreUser, refresh } = useData();
  const [archived, setArchived] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const loadArchived = async () => {
    setLoading(true);
    try {
      const data = await storage.getArchivedUsers();
      setArchived(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadArchived(); }, []);

  const getDeleterName = (deletedById: string | undefined) => {
    if (!deletedById) return '—';
    const deleter = users.find(u => u.id === deletedById);
    return deleter ? deleter.name : `ID: ${deletedById.slice(0, 8)}…`;
  };

  const handleRestore = async (user: User) => {
    setRestoringId(user.id);
    try {
      await restoreUser(user.id);
      await refresh();
      await loadArchived();
      toast.success(`${user.name}'s account has been restored.`);
    } catch {
      toast.error('Failed to restore account. Please try again.');
    } finally {
      setRestoringId(null);
    }
  };

  const participants = archived.filter(u => u.role === 'participant');
  const admins = archived.filter(u => u.role === 'admin');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Archive className="w-6 h-6 text-gray-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Archived Users</h1>
          <p className="text-gray-500 text-sm">
            {archived.length} archived — {participants.length} participants, {admins.length} admins
          </p>
        </div>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
        These accounts have been soft-deleted. Their historical records are preserved for audit purposes.
        Only Main Admin can restore an account to active status.
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : archived.length === 0 ? (
          <EmptyState
            icon="🗃️"
            title="No archived users"
            description="Soft-deleted users will appear here"
          />
        ) : (
          <div className="divide-y divide-gray-50">
            {archived.map(user => (
              <div key={user.id} className="flex items-start gap-4 px-6 py-5 hover:bg-gray-50/50 transition-colors">
                <div className="flex-shrink-0 opacity-60">
                  <Avatar name={user.name} color={user.avatarColor} size="md" />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-700">{user.name}</p>
                    <StatusBadge variant="gray">
                      {user.role === 'main_admin' ? '👑 Main Admin' : user.role === 'admin' ? '⚙️ Admin' : '👤 Participant'}
                    </StatusBadge>
                    <StatusBadge variant="red">Archived</StatusBadge>
                  </div>
                  <p className="text-sm text-gray-400">@{user.username ?? '—'} · {user.email}</p>
                  <div className="flex flex-wrap gap-x-6 gap-y-0.5 text-xs text-gray-400 mt-1">
                    {user.deletedAt && (
                      <span>
                        <span className="text-gray-500 font-medium">Removed:</span>{' '}
                        {format(new Date(user.deletedAt), 'MMM d, yyyy · HH:mm')}
                      </span>
                    )}
                    {user.deletedBy && (
                      <span>
                        <span className="text-gray-500 font-medium">Removed by:</span>{' '}
                        {getDeleterName(user.deletedBy)}
                      </span>
                    )}
                    <span>
                      <span className="text-gray-500 font-medium">Joined:</span>{' '}
                      {format(new Date(user.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  loading={restoringId === user.id}
                  onClick={() => handleRestore(user)}
                  className="flex-shrink-0 text-green-700 border-green-200 hover:bg-green-50 gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restore
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
