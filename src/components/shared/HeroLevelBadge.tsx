import React from 'react';
import { getLevelProgress } from '../../lib/heroLevels';
import { cn } from '../../lib/utils';

interface HeroLevelBadgeProps {
  points: number;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  className?: string;
}

export function HeroLevelBadge({ points, size = 'md', showProgress = false, className }: HeroLevelBadgeProps) {
  const { current, next, progress, pointsNeededForNext } = getLevelProgress(points);

  const sizeClasses = {
    sm: { badge: 'text-xs px-2 py-0.5', icon: 'text-sm', text: 'text-xs' },
    md: { badge: 'text-sm px-3 py-1', icon: 'text-base', text: 'text-sm' },
    lg: { badge: 'text-base px-4 py-2', icon: 'text-2xl', text: 'text-base' },
  }[size];

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <span className={sizeClasses.icon}>{current.icon}</span>
        <div>
          <div
            className={cn('inline-flex items-center gap-1 rounded-full font-bold text-white', sizeClasses.badge)}
            style={{ backgroundColor: current.color }}
          >
            <span>Lv.{current.level}</span>
            <span>{current.name}</span>
          </div>
        </div>
      </div>

      {showProgress && (
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className={cn('text-gray-500', sizeClasses.text)}>
              {next ? `${pointsNeededForNext} pts to Lv.${next.level}` : '🌟 Max level!'}
            </span>
            <span className={cn('font-medium', sizeClasses.text)} style={{ color: current.color }}>
              {progress}%
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, backgroundColor: current.color }}
            />
          </div>
          {next && (
            <div className="flex justify-between text-xs text-gray-400">
              <span>{current.name}</span>
              <span>{next.icon} {next.name}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
