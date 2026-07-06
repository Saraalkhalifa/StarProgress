import React from 'react';
import { Trophy, Medal } from 'lucide-react';
import { AvatarBadge } from '../avatar/AvatarBadge';
import { StreakBadge } from '../streak/StreakBadge';
import type { LeaderboardEntry } from '../../types';
import type { TopStreak } from '../../types/streak';
import { cn } from '../../lib/utils';
import { getAvatarSettings } from '../../lib/avatarStorage';
import { DEFAULT_ANIMAL_ID } from '../../lib/avatarData';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  streaks?: TopStreak[];
}

const rankIcons = [
  <Trophy className="w-5 h-5 text-yellow-500" />,
  <Medal className="w-5 h-5 text-gray-400" />,
  <Medal className="w-5 h-5 text-amber-600" />,
];

const rankStyles = [
  'bg-gradient-to-r from-yellow-50 to-amber-50 border-s-4 border-yellow-400',
  'bg-gradient-to-r from-gray-50 to-slate-50 border-s-4 border-gray-300',
  'bg-gradient-to-r from-orange-50 to-amber-50 border-s-4 border-amber-400',
];

function getAvatarInfo(userId: string) {
  const s = getAvatarSettings(userId);
  return {
    animalId: s?.equippedAnimalId ?? DEFAULT_ANIMAL_ID,
    colorThemeId: s?.equippedColorId ?? null,
    accessoryIds: s?.equippedAccessoryIds ?? [],
  };
}

export function LeaderboardTable({ entries, currentUserId, streaks }: LeaderboardTableProps) {
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
        const { animalId, colorThemeId, accessoryIds } = getAvatarInfo(entry.user.id);
        const streak = streaks?.find(s => s.participantId === entry.user.id);

        return (
          <div
            key={entry.user.id}
            className={cn(
              'flex items-center gap-3 p-3 rounded-xl transition-all',
              isTop3 ? rankStyles[entry.rank - 1] : 'bg-gray-50 hover:bg-blue-50/50',
              isCurrentUser && !isTop3 && 'ring-2 ring-blue-400 bg-blue-50',
            )}
          >
            {/* Rank */}
            <div className="w-9 flex items-center justify-center flex-shrink-0">
              {isTop3 ? rankIcons[entry.rank - 1] : (
                <span className={cn('text-sm font-bold', isCurrentUser ? 'text-blue-600' : 'text-gray-400')}>
                  #{entry.rank}
                </span>
              )}
            </div>

            {/* Animal avatar */}
            <AvatarBadge
              animalId={animalId}
              points={entry.points}
              colorThemeId={colorThemeId}
              accessoryIds={accessoryIds}
              size={44}
              rank={isTop3 ? entry.rank : undefined}
              isCurrentUser={isCurrentUser}
            />

            {/* Name & Badge */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className={cn('font-semibold truncate text-sm', isCurrentUser ? 'text-blue-700' : 'text-gray-800')}>
                  {entry.user.name}
                  {isCurrentUser && <span className="ms-1 text-xs text-blue-500 font-normal">(You)</span>}
                </p>
              </div>
              {entry.badge && (
                <span className={cn('text-xs font-medium', entry.badge.color)}>
                  {entry.badge.icon} {entry.badge.name}
                </span>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {streak && streak.currentStreak >= 2 && (
                <StreakBadge streak={streak.currentStreak} size="sm" />
              )}
              <div className="text-center hidden sm:block">
                <p className="text-xs text-gray-400">Acts</p>
                <p className="font-semibold text-gray-700 text-sm">{entry.acceptedCount}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Pts</p>
                <p className={cn('text-base font-bold', isTop3 ? 'text-amber-600' : 'text-blue-600')}>
                  {entry.points}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
