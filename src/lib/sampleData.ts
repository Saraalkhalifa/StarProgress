import type { User, Activity, Badge } from '../types';
import { simpleHash, AVATAR_COLORS } from './utils';

const now = new Date();
const d = (daysAgo: number) => {
  const dt = new Date(now);
  dt.setDate(dt.getDate() - daysAgo);
  return dt.toISOString();
};

export const sampleBadges: Badge[] = [
  { id: 'b1', name: 'Beginner',     requiredPoints: 50,   icon: '🌱', color: 'text-green-600',  bgColor: 'bg-green-100' },
  { id: 'b2', name: 'Rising Star',  requiredPoints: 150,  icon: '⭐', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  { id: 'b3', name: 'Champion',     requiredPoints: 600,  icon: '🏆', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  { id: 'b4', name: 'Legend',       requiredPoints: 1500, icon: '👑', color: 'text-purple-600', bgColor: 'bg-purple-100' },
];

export const sampleActivities: Activity[] = [
  { id: 'a1',  name: 'Reading a Book',          nameAr: 'قراءة كتاب',     description: 'Read any educational or literary book',               points: 5,  icon: '📚', isActive: true, createdAt: d(60) },
  { id: 'a2',  name: 'Writing',                 nameAr: 'الكتابة',         description: 'Write essays, stories, or journals',                  points: 8,  icon: '✏️', isActive: true, createdAt: d(60) },
  { id: 'a3',  name: 'Practicing قدرات',         nameAr: 'تدريب قدرات',    description: 'Practice قدرات exam questions',                        points: 15, icon: '🧠', isActive: true, createdAt: d(60) },
  { id: 'a4',  name: 'Practicing تحصيلي',        nameAr: 'تدريب تحصيلي',  description: 'Practice تحصيلي exam questions',                       points: 10, icon: '📝', isActive: true, createdAt: d(60) },
  { id: 'a5',  name: 'Practicing IELTS',         nameAr: 'تدريب آيلتس',   description: 'Practice IELTS reading, writing, or speaking',         points: 10, icon: '🌐', isActive: true, createdAt: d(60) },
  { id: 'a6',  name: 'Drawing',                 nameAr: 'الرسم',           description: 'Draw or sketch any artwork',                           points: 7,  icon: '🎨', isActive: true, createdAt: d(60) },
  { id: 'a7',  name: 'Exercise & Sports',        nameAr: 'الرياضة',        description: 'Physical exercise or sports activity',                 points: 10, icon: '🏃', isActive: true, createdAt: d(60) },
  { id: 'a8',  name: 'Volunteering',             nameAr: 'التطوع',          description: 'Community service or volunteering work',               points: 15, icon: '🤝', isActive: true, createdAt: d(60) },
  { id: 'a9',  name: 'Learning a New Skill',     nameAr: 'تعلم مهارة جديدة', description: 'Learn any new practical skill',                    points: 15, icon: '💡', isActive: true, createdAt: d(60) },
  { id: 'a10', name: 'Meditation & Mindfulness', nameAr: 'التأمل',          description: 'Mindfulness or meditation session',                    points: 8,  icon: '🧘', isActive: true, createdAt: d(60) },
];

export const sampleUsers: User[] = [
  {
    id: 'u_main',
    name: 'Main Admin',
    email: 'mainadmin@starprogress.demo',
    username: 'MainAdmin',
    passwordHash: simpleHash('MainAdmin@2026'),
    role: 'main_admin',
    accountStatus: 'active',
    createdAt: d(90),
    avatarColor: AVATAR_COLORS[0],
  },
  {
    id: 'u_adm2',
    name: 'Fatima',
    email: 'fatima@starprogress.demo',
    username: 'fatima',
    passwordHash: simpleHash('Admin@2026'),
    role: 'admin',
    accountStatus: 'active',
    createdAt: d(85),
    avatarColor: AVATAR_COLORS[1],
  },
  {
    id: 'u_p1',
    name: 'Sara',
    email: 'sara@starprogress.demo',
    username: 'sara',
    passwordHash: simpleHash('Sara@2026'),
    role: 'participant',
    accountStatus: 'active',
    createdAt: d(80),
    avatarColor: AVATAR_COLORS[2],
  },
  {
    id: 'u_p2',
    name: 'Ali',
    email: 'ali@starprogress.demo',
    username: 'ali',
    passwordHash: simpleHash('ali@2026'),
    role: 'participant',
    accountStatus: 'active',
    createdAt: d(78),
    avatarColor: AVATAR_COLORS[3],
  },
];
