import React from 'react';
import { cn } from '../../lib/utils';

interface StreakBadgeProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function StreakBadge({ streak, size = 'md', showLabel = false, className }: StreakBadgeProps) {
  if (streak < 2) return null;

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-0.5',
    md: 'text-sm px-2 py-1 gap-1',
    lg: 'text-base px-3 py-1.5 gap-1.5',
  };

  const isOnFire = streak >= 7;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-bold',
        isOnFire
          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-sm'
          : 'bg-orange-100 text-orange-600',
        sizeClasses[size],
        className,
      )}
    >
      🔥
      <span>{streak}</span>
      {showLabel && <span className="font-normal opacity-80">days</span>}
    </span>
  );
}
