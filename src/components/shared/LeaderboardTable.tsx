import React from 'react';
import { Trophy, Medal, Star } from 'lucide-react';
import { Avatar } from '../ui';
import type { LeaderboardEntry } from '../../types';
import { cn } from '../../lib/utils';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

const rankIcons = [
  <Trophy className="w-5 h-5 text-yellow-500" />,
  <Medal className="w-5 h-5 text-gray-400" />,
  <Medal className="w-5 h-5 text-amber-600" />,
];

const rankStyles = [
  'bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-400',
  'bg-gradient-to-r from-gray-50 to-slate-50 border-l-4 border-gray-300',
  'bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-amber-400',
];

export function LeaderboardTable({ entries, currentUserId }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <div className="text-4xl mb-2">🏆</div>
        <p>No rankings yet. Be the first to earn points!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map(entry => {
        const isTop3 = entry.rank <= 3;
        const isCurrentUser = entry.user.id === currentUserId;
        return (
          <div
            key={entry.user.id}
            className={cn(
              'flex items-center gap-4 p-4 rounded-xl transition-all',
              isTop3 ? rankStyles[entry.rank - 1] : 'bg-gray-50 hover:bg-blue-50/50',
              isCurrentUser && !isTop3 && 'ring-2 ring-blue-400 bg-blue-50'
            )}
          >
            {/* Rank */}
            <div className="w-10 flex items-center justify-center flex-shrink-0">
              {isTop3 ? rankIcons[entry.rank - 1] : (
                <span className={cn('text-sm font-bold', isCurrentUser ? 'text-blue-600' : 'text-gray-400')}>
                  #{entry.rank}
                </span>
              )}
            </div>

            {/* Avatar */}
            <Avatar name={entry.user.name} color={entry.user.avatarColor} size="md" />

            {/* Name & Badge */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={cn('font-semibold truncate', isCurrentUser ? 'text-blue-700' : 'text-gray-800')}>
                  {entry.user.name}
                  {isCurrentUser && <span className="ml-1 text-xs text-blue-500">(You)</span>}
                </p>
              </div>
              {entry.badge && (
                <span className={cn('text-xs font-medium', entry.badge.color)}>
                  {entry.badge.icon} {entry.badge.name}
                </span>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="text-center hidden sm:block">
                <p className="text-xs text-gray-400">Activities</p>
                <p className="font-semibold text-gray-700">{entry.acceptedCount}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Points</p>
                <p className={cn('text-lg font-bold', isTop3 ? 'text-amber-600' : 'text-blue-600')}>
                  {entry.points}
                </p>
              </div>
              {entry.rank <= 3 && (
                <div className="hidden sm:block">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
