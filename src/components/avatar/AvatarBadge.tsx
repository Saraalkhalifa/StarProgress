import React from 'react';
import { getAnimalComponent, AccessoryOverlay } from './AnimalSVG';
import { AVATAR_ANIMALS, AVATAR_COLOR_THEMES } from '../../lib/avatarData';
import { getMoodFromPoints } from '../../types/avatar';
import { cn } from '../../lib/utils';

interface AvatarBadgeProps {
  animalId: string;
  points?: number;
  colorThemeId?: string | null;
  accessoryIds?: string[];
  size?: number;
  className?: string;
  ring?: boolean;
  isCurrentUser?: boolean;
  rank?: number;
}

// Maps rank to ring color
const RANK_RINGS: Record<number, string> = {
  1: 'ring-yellow-400',
  2: 'ring-gray-300',
  3: 'ring-amber-500',
};

export function AvatarBadge({
  animalId,
  points = 0,
  colorThemeId = null,
  accessoryIds = [],
  size = 48,
  className,
  ring = false,
  isCurrentUser = false,
  rank,
}: AvatarBadgeProps) {
  const animalComponent = getAnimalComponent(animalId);
  const mood = getMoodFromPoints(points);
  const animalDef = AVATAR_ANIMALS.find(a => a.id === animalId);
  const colorTheme = colorThemeId ? AVATAR_COLOR_THEMES.find(c => c.id === colorThemeId) : null;

  const primaryColor = colorTheme?.primary || animalDef?.defaultColor;
  const accentColor  = colorTheme?.accent  || animalDef?.accentColor;

  const bgGradients = [
    'from-gray-100 to-gray-200',
    'from-blue-50 to-sky-100',
    'from-green-50 to-emerald-100',
    'from-yellow-50 to-amber-100',
    'from-pink-50 to-purple-100',
  ];

  const ringClass = rank && RANK_RINGS[rank]
    ? `ring-2 ${RANK_RINGS[rank]}`
    : isCurrentUser
    ? 'ring-2 ring-blue-500'
    : ring
    ? 'ring-2 ring-gray-300'
    : '';

  return (
    <div
      className={cn(
        'relative rounded-full flex items-center justify-center bg-gradient-to-br overflow-hidden',
        bgGradients[mood],
        ringClass,
        className,
      )}
      style={{ width: size, height: size, flexShrink: 0 }}
    >
      <svg
        viewBox="0 0 100 100"
        width={size * 0.88}
        height={size * 0.88}
        className="overflow-visible"
        aria-hidden="true"
      >
        {React.createElement(animalComponent, { mood, color: primaryColor, accent: accentColor })}
        {accessoryIds.slice(0, 2).map(id => (
          <AccessoryOverlay key={id} accessoryId={id} />
        ))}
      </svg>
    </div>
  );
}
