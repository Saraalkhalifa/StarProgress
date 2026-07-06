import type { User, Activity, Badge } from '../types';
import { simpleHash, AVATAR_COLORS } from './utils';

const now = new Date();
const d = (daysAgo: number) => {
  const dt = new Date(now);
  dt.setDate(dt.getDate() - daysAgo);
  return dt.toISOString();
};

export const sampleBadges: Badge[] = [
  { id: 'b1', name: 'Beginner',    nameAr: 'مبتدئ',      requiredPoints: 50,   icon: '🌱', color: 'text-green-600',  bgColor: 'bg-green-100' },
  { id: 'b2', name: 'Rising Star', nameAr: 'نجم صاعد',   requiredPoints: 150,  icon: '⭐', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  { id: 'b3', name: 'Champion',    nameAr: 'بطل',         requiredPoints: 600,  icon: '🏆', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  { id: 'b4', name: 'Legend',      nameAr: 'أسطورة',      requiredPoints: 1500, icon: '👑', color: 'text-purple-600', bgColor: 'bg-purple-100' },
];

export const sampleActivities: Activity[] = [
  { id: 'a1',  name: 'Reading a Book',          nameAr: 'قراءة كتاب',         description: 'Read any educational or literary book',           descriptionAr: 'قراءة أي كتاب تعليمي أو أدبي',              points: 5,  icon: '📚', isActive: true, createdAt: d(60) },
  { id: 'a2',  name: 'Writing',                 nameAr: 'الكتابة',              description: 'Write essays, stories, or journals',              descriptionAr: 'كتابة مقالات أو قصص أو يوميات',              points: 8,  icon: '✏️', isActive: true, createdAt: d(60) },
  { id: 'a3',  name: 'Practicing قدرات',         nameAr: 'تدريب قدرات',         description: 'Practice قدرات exam questions',                    descriptionAr: 'التدرب على أسئلة اختبار القدرات',            points: 15, icon: '🧠', isActive: true, createdAt: d(60) },
  { id: 'a4',  name: 'Practicing تحصيلي',        nameAr: 'تدريب تحصيلي',        description: 'Practice تحصيلي exam questions',                   descriptionAr: 'التدرب على أسئلة الاختبار التحصيلي',         points: 10, icon: '📝', isActive: true, createdAt: d(60) },
  { id: 'a5',  name: 'Practicing IELTS',         nameAr: 'تدريب آيلتس',         description: 'Practice IELTS reading, writing, or speaking',    descriptionAr: 'التدرب على مهارات آيلتس',                    points: 10, icon: '🌐', isActive: true, createdAt: d(60) },
  { id: 'a6',  name: 'Drawing',                 nameAr: 'الرسم',               description: 'Draw or sketch any artwork',                       descriptionAr: 'رسم أو تخطيط أي عمل فني',                   points: 7,  icon: '🎨', isActive: true, createdAt: d(60) },
  { id: 'a7',  name: 'Exercise & Sports',        nameAr: 'الرياضة',             description: 'Physical exercise or sports activity',            descriptionAr: 'ممارسة التمارين الرياضية',                   points: 10, icon: '🏃', isActive: true, createdAt: d(60) },
  { id: 'a8',  name: 'Volunteering',             nameAr: 'التطوع',              description: 'Community service or volunteering work',          descriptionAr: 'خدمة المجتمع أو العمل التطوعي',              points: 15, icon: '🤝', isActive: true, createdAt: d(60) },
  { id: 'a9',  name: 'Learning a New Skill',     nameAr: 'تعلم مهارة جديدة',   description: 'Learn any new practical skill',                   descriptionAr: 'تعلم أي مهارة عملية جديدة',                 points: 15, icon: '💡', isActive: true, createdAt: d(60) },
  { id: 'a10', name: 'Meditation & Mindfulness', nameAr: 'التأمل والتركيز',     description: 'Mindfulness or meditation session',               descriptionAr: 'جلسة تأمل أو ذهن واعٍ',                     points: 8,  icon: '🧘', isActive: true, createdAt: d(60) },
];

// Single default account — CHANGE PASSWORD BEFORE REAL USE
export const sampleUsers: User[] = [
  {
    id: 'u_main',
    name: 'Sara',
    email: 'admin@starprogress.demo',
    username: 'Mainadmin',
    passwordHash: simpleHash('MainAdmin@2026'),
    role: 'main_admin',
    accountStatus: 'active',
    createdAt: d(0),
    avatarColor: AVATAR_COLORS[0],
  },
];

// Demo credentials panel — only shown when Supabase is NOT configured
// ⚠ These are for local testing only. Change the password before real use.
export const demoCredentials = [
  {
    role: 'Main Admin',
    username: 'Mainadmin',
    password: 'MainAdmin@2026',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
  },
];

// All localStorage keys owned by the demo app (excludes sp_auth_v2 intentionally)
const DEMO_LS_KEYS = [
  'sp_users',
  'sp_activities',
  'sp_submissions',
  'sp_badges',
  'sp_notifications',
  'sp_daily_winners',
  'sp_streaks',
  'sp_streak_bonuses',
  'sp_streak_settings',
  'sp_av_inventory',
  'sp_av_settings',
  'sp_av_wallets',
];

// Wipes all demo data from localStorage. Call before re-seeding.
// Does NOT clear sp_auth_v2 so the current session survives the reset.
export function clearDemoData(): void {
  for (const key of DEMO_LS_KEYS) {
    localStorage.removeItem(key);
  }
}
