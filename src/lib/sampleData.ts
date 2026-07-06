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
    phoneNumber: '+966500000001',
    age: 30,
    dateOfBirth: '1996-01-01',
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
    phoneNumber: '+966500000002',
    age: 25,
    dateOfBirth: '2001-03-15',
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
    phoneNumber: '+966500000003',
    age: 20,
    dateOfBirth: '2006-06-10',
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
    phoneNumber: '+966500000004',
    age: 22,
    dateOfBirth: '2004-09-20',
  },
];

// Demo credentials — only shown in demo mode (no Supabase configured)
export const demoCredentials = [
  { role: 'Main Admin', username: 'MainAdmin', password: 'MainAdmin@2026', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { role: 'Admin',      username: 'fatima',    password: 'Admin@2026',     color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { role: 'Participant',username: 'sara',      password: 'Sara@2026',      color: 'bg-green-100 text-green-800 border-green-200' },
  { role: 'Participant',username: 'ali',       password: 'ali@2026',       color: 'bg-amber-100 text-amber-800 border-amber-200' },
];
