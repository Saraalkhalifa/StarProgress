import type { HeroLevel } from '../types';

export const HERO_LEVELS: HeroLevel[] = [
  { level: 1,  name: 'New Player',         nameAr: 'لاعب جديد',               pointsRequired: 0,     color: '#94a3b8', icon: '🌱' },
  { level: 2,  name: 'Beginner',           nameAr: 'مبتدئ',                   pointsRequired: 50,    color: '#84cc16', icon: '⭐' },
  { level: 3,  name: 'Little Helper',      nameAr: 'مساعد صغير',              pointsRequired: 100,   color: '#22c55e', icon: '🤝' },
  { level: 4,  name: 'Active Kid',         nameAr: 'طفل نشيط',                pointsRequired: 200,   color: '#10b981', icon: '🏃' },
  { level: 5,  name: 'Good Starter',       nameAr: 'بداية موفقة',             pointsRequired: 350,   color: '#06b6d4', icon: '💡' },
  { level: 6,  name: 'Rising Star',        nameAr: 'نجم صاعد',                pointsRequired: 500,   color: '#3b82f6', icon: '🌟' },
  { level: 7,  name: 'Kind Soul',          nameAr: 'روح طيبة',                pointsRequired: 700,   color: '#8b5cf6', icon: '💜' },
  { level: 8,  name: 'Smart Achiever',     nameAr: 'منجز ذكي',                pointsRequired: 950,   color: '#a855f7', icon: '🧠' },
  { level: 9,  name: 'Bronze Hero',        nameAr: 'بطل برونزي',              pointsRequired: 1250,  color: '#b45309', icon: '🥉' },
  { level: 10, name: 'Silver Hero',        nameAr: 'بطل فضي',                 pointsRequired: 1600,  color: '#6b7280', icon: '🥈' },
  { level: 11, name: 'Golden Hero',        nameAr: 'بطل ذهبي',                pointsRequired: 2000,  color: '#d97706', icon: '🥇' },
  { level: 12, name: 'Super Achiever',     nameAr: 'منجز خارق',               pointsRequired: 2500,  color: '#f59e0b', icon: '🏆' },
  { level: 13, name: 'Brave Leader',       nameAr: 'قائد شجاع',               pointsRequired: 3100,  color: '#ef4444', icon: '⚡' },
  { level: 14, name: 'Wise Champion',      nameAr: 'بطل حكيم',                pointsRequired: 3800,  color: '#dc2626', icon: '📚' },
  { level: 15, name: 'Community Hero',     nameAr: 'بطل المجتمع',             pointsRequired: 4600,  color: '#b91c1c', icon: '🌍' },
  { level: 16, name: 'Master Builder',     nameAr: 'بانٍ متمكن',              pointsRequired: 5500,  color: '#7c3aed', icon: '🔨' },
  { level: 17, name: 'Grand Champion',     nameAr: 'البطل الكبير',            pointsRequired: 6500,  color: '#6d28d9', icon: '🎯' },
  { level: 18, name: 'Legend',             nameAr: 'أسطورة',                  pointsRequired: 7800,  color: '#4c1d95', icon: '👑' },
  { level: 19, name: 'Royal Legend',       nameAr: 'أسطورة ملكية',            pointsRequired: 9200,  color: '#1e3a5f', icon: '💎' },
  { level: 20, name: 'King of Good Deeds', nameAr: 'ملك الأعمال الصالحة',    pointsRequired: 11000, color: '#92400e', icon: '🌈' },
];

export function getHeroLevel(points: number): HeroLevel {
  let current = HERO_LEVELS[0];
  for (const lvl of HERO_LEVELS) {
    if (points >= lvl.pointsRequired) current = lvl;
    else break;
  }
  return current;
}

export function getNextHeroLevel(points: number): HeroLevel | null {
  for (const lvl of HERO_LEVELS) {
    if (points < lvl.pointsRequired) return lvl;
  }
  return null;
}

export function getLevelProgress(points: number): {
  current: HeroLevel;
  next: HeroLevel | null;
  progress: number;
  pointsIntoLevel: number;
  pointsNeededForNext: number;
} {
  const current = getHeroLevel(points);
  const next = getNextHeroLevel(points);
  if (!next) return { current, next: null, progress: 100, pointsIntoLevel: points - current.pointsRequired, pointsNeededForNext: 0 };
  const rangeStart = current.pointsRequired;
  const rangeEnd = next.pointsRequired;
  const pointsIntoLevel = points - rangeStart;
  const pointsNeededForNext = rangeEnd - points;
  const progress = Math.min(100, Math.round((pointsIntoLevel / (rangeEnd - rangeStart)) * 100));
  return { current, next, progress, pointsIntoLevel, pointsNeededForNext };
}
