import React from 'react';
import { cn } from '../../lib/utils';
import { ProgressBar } from '../ui';
import type { Badge } from '../../types';

interface BadgeDisplayProps {
  badge: Badge | null;
  nextBadge: Badge | null;
  currentPoints: number;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function BadgeDisplay({ badge, nextBadge, currentPoints, showProgress = false, size = 'md' }: BadgeDisplayProps) {
  const iconSizes = { sm: 'text-xl w-8 h-8', md: 'text-3xl w-12 h-12', lg: 'text-5xl w-16 h-16' };
  const textSizes = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' };

  if (!badge) {
    return (
      <div className="flex flex-col items-center gap-1">
        <div className={cn('rounded-full bg-gray-100 flex items-center justify-center', iconSizes[size])}>
          <span className="text-gray-400">?</span>
        </div>
        <p className={cn('text-gray-400 font-medium', textSizes[size])}>No badge yet</p>
        {nextBadge && showProgress && (
          <div className="w-full mt-2 space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Progress to {nextBadge.name}</span>
              <span>{currentPoints} / {nextBadge.requiredPoints}</span>
            </div>
            <ProgressBar value={currentPoints} max={nextBadge.requiredPoints} color="bg-blue-400" />
          </div>
        )}
      </div>
    );
  }

  const progress = nextBadge
    ? ((currentPoints - badge.requiredPoints) / (nextBadge.requiredPoints - badge.requiredPoints)) * 100
    : 100;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={cn('rounded-full flex items-center justify-center shadow-sm border-2 border-white', badge.bgColor, iconSizes[size])}>
        <span>{badge.icon}</span>
      </div>
      <p className={cn('font-bold', badge.color, textSizes[size])}>{badge.name}</p>
      {showProgress && (
        <div className="w-full mt-2 space-y-1">
          {nextBadge ? (
            <>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Next: {nextBadge.name} {nextBadge.icon}</span>
                <span>{currentPoints} / {nextBadge.requiredPoints} pts</span>
              </div>
              <ProgressBar value={Math.max(0, progress)} max={100} color="bg-gradient-to-r from-blue-400 to-blue-600" />
              <p className="text-xs text-gray-400 text-center">{nextBadge.requiredPoints - currentPoints} more points to go!</p>
            </>
          ) : (
            <p className="text-xs text-purple-500 font-medium text-center">🎉 Maximum badge reached!</p>
          )}
        </div>
      )}
    </div>
  );
}
