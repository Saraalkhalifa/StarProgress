import React from 'react';
import { motion } from 'framer-motion';
import type { AvatarMood } from '../../types/avatar';
import { getAnimalComponent, AccessoryOverlay } from './AnimalSVG';
import { AVATAR_ANIMALS, AVATAR_COLOR_THEMES } from '../../lib/avatarData';
import { cn } from '../../lib/utils';

interface AnimalAvatarProps {
  animalId: string;
  mood?: AvatarMood;
  colorThemeId?: string | null;
  accessoryIds?: string[];
  size?: number;           // px, renders as square
  animated?: boolean;      // enable bounce/pulse animations
  className?: string;
  showMoodBg?: boolean;    // colored background circle
}

const MOOD_BG_COLORS = [
  'from-gray-100 to-gray-200',
  'from-blue-100 to-sky-200',
  'from-green-100 to-emerald-200',
  'from-yellow-100 to-amber-200',
  'from-pink-100 to-purple-200',
];

const MOOD_SHADOW_COLORS = [
  '',
  'shadow-blue-200',
  'shadow-green-200',
  'shadow-yellow-200',
  'shadow-purple-300',
];

export function AnimalAvatar({
  animalId,
  mood = 0,
  colorThemeId = null,
  accessoryIds = [],
  size = 120,
  animated = true,
  className,
  showMoodBg = true,
}: AnimalAvatarProps) {
  const animalComponent = getAnimalComponent(animalId);
  const animalDef = AVATAR_ANIMALS.find(a => a.id === animalId);
  const colorTheme = colorThemeId
    ? AVATAR_COLOR_THEMES.find(c => c.id === colorThemeId)
    : null;

  const primaryColor = colorTheme?.primary || animalDef?.defaultColor;
  const accentColor  = colorTheme?.accent  || animalDef?.accentColor;

  const animateProps = animated && mood >= 4
    ? { scale: [1, 1.04, 1] as number[], y: [0, -6, 0] as number[] }
    : animated && mood >= 3
    ? { y: [0, -6, 0] as number[] }
    : animated && mood >= 2
    ? { y: [0, -3, 0] as number[] }
    : {};

  return (
    <motion.div
      className={cn('relative flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      animate={animateProps}
    transition={{ duration: mood >= 3 ? 1.2 : 2, repeat: animated && mood >= 2 ? Infinity : 0, ease: 'easeInOut' }}
    >
      {/* Mood background */}
      {showMoodBg && (
        <div
          className={cn(
            'absolute inset-0 rounded-full bg-gradient-to-br',
            MOOD_BG_COLORS[mood],
            mood >= 2 && 'shadow-lg',
            MOOD_SHADOW_COLORS[mood],
          )}
        />
      )}

      {/* SVG Animal */}
      <svg
        viewBox="0 0 100 100"
        width={size * 0.9}
        height={size * 0.9}
        className="relative z-10 overflow-visible"
        aria-hidden="true"
      >
        {React.createElement(animalComponent, { mood, color: primaryColor, accent: accentColor })}
        {/* Accessory overlays */}
        {accessoryIds.map(id => (
          <AccessoryOverlay key={id} accessoryId={id} color={colorTheme?.secondary} />
        ))}
      </svg>

      {/* Mood 4 glow ring */}
      {mood >= 4 && animated && (
        <motion.div
          className="absolute inset-0 rounded-full ring-4 ring-yellow-400/60"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}

// ── Compact mood badge used in top-of-page widgets ────────────────────────────

interface MoodIndicatorProps {
  mood: AvatarMood;
  points: number;
}

const MOOD_LABELS = ['Calm', 'Happy', 'Joyful', 'Excited', 'Euphoric!'];
const MOOD_LABELS_AR = ['هادئ', 'سعيد', 'مبهج', 'متحمس', 'نشوان!'];

export function MoodIndicator({ mood, points }: MoodIndicatorProps) {
  const colors = ['bg-gray-100 text-gray-600', 'bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 'bg-amber-100 text-amber-700', 'bg-purple-100 text-purple-700'];
  const emojis = ['😐', '🙂', '😊', '😄', '🤩'];
  const thresholds = [0, 50, 150, 300, 600];
  const nextThreshold = thresholds[Math.min(mood + 1, 4)];

  return (
    <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', colors[mood])}>
      <span>{emojis[mood]}</span>
      <span>{MOOD_LABELS[mood]}</span>
      {mood < 4 && (
        <span className="opacity-60 text-xs">· {nextThreshold - points} pts to next</span>
      )}
    </div>
  );
}
