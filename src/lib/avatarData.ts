import type { AvatarAnimal, AvatarAccessory, AvatarColorTheme } from '../types/avatar';

export const AVATAR_ANIMALS: AvatarAnimal[] = [
  // ── Starters (free, unlocked from the start) ──────────────────────────────
  {
    id: 'cat',
    name: 'Cat', nameAr: 'قطة',
    description: 'A curious and playful orange cat', descriptionAr: 'قطة برتقالية فضولية ومرحة',
    isStarter: true, unlockPointsRequired: 0, purchaseCost: 0, isActive: true,
    defaultColor: '#F4A460', accentColor: '#FFB6C1',
  },
  {
    id: 'dog',
    name: 'Dog', nameAr: 'كلب',
    description: 'A loyal and friendly golden pup', descriptionAr: 'جرو ذهبي وفي وودود',
    isStarter: true, unlockPointsRequired: 0, purchaseCost: 0, isActive: true,
    defaultColor: '#C68642', accentColor: '#E8A060',
  },
  {
    id: 'rabbit',
    name: 'Rabbit', nameAr: 'أرنب',
    description: 'A fluffy white rabbit with big eyes', descriptionAr: 'أرنب أبيض ناعم بعيون كبيرة',
    isStarter: true, unlockPointsRequired: 0, purchaseCost: 0, isActive: true,
    defaultColor: '#F0E8D8', accentColor: '#FFB6C1',
  },
  {
    id: 'owl',
    name: 'Owl', nameAr: 'بومة',
    description: 'A wise owl with big amber eyes', descriptionAr: 'بومة حكيمة بعيون عنبرية كبيرة',
    isStarter: true, unlockPointsRequired: 0, purchaseCost: 0, isActive: true,
    defaultColor: '#9B8060', accentColor: '#D4A860',
  },
  {
    id: 'elephant',
    name: 'Elephant', nameAr: 'فيل',
    description: 'A gentle baby elephant with big ears', descriptionAr: 'فيل صغير لطيف بأذنين كبيرتين',
    isStarter: true, unlockPointsRequired: 0, purchaseCost: 0, isActive: true,
    defaultColor: '#A8B8C8', accentColor: '#C8D8E8',
  },
  {
    id: 'duck',
    name: 'Duck', nameAr: 'بطة',
    description: 'A cheerful yellow duck', descriptionAr: 'بطة صفراء مبهجة',
    isStarter: true, unlockPointsRequired: 0, purchaseCost: 0, isActive: true,
    defaultColor: '#FFE066', accentColor: '#FF9D00',
  },
  // ── Unlockable animals ─────────────────────────────────────────────────────
  {
    id: 'monkey',
    name: 'Monkey', nameAr: 'قرد',
    description: 'A cheeky and playful monkey', descriptionAr: 'قرد شقي ومرح',
    isStarter: false, unlockPointsRequired: 100, purchaseCost: 0, isActive: true,
    defaultColor: '#C87830', accentColor: '#E8C890',
  },
  {
    id: 'bat',
    name: 'Bat', nameAr: 'خفاش',
    description: 'A cute purple bat of the night', descriptionAr: 'خفاش بنفسجي لطيف في الليل',
    isStarter: false, unlockPointsRequired: 50, purchaseCost: 50, isActive: true,
    defaultColor: '#8878C8', accentColor: '#C8B8F0',
  },
  {
    id: 'squirrel',
    name: 'Squirrel', nameAr: 'سنجاب',
    description: 'A quick squirrel with a fluffy tail', descriptionAr: 'سنجاب سريع بذيل كثيف',
    isStarter: false, unlockPointsRequired: 0, purchaseCost: 75, isActive: true,
    defaultColor: '#B07848', accentColor: '#D0A870',
  },
  {
    id: 'penguin',
    name: 'Penguin', nameAr: 'بطريق',
    description: 'A dapper black-and-white penguin', descriptionAr: 'بطريق أنيق أبيض وأسود',
    isStarter: false, unlockPointsRequired: 75, purchaseCost: 0, isActive: true,
    defaultColor: '#2A2A3A', accentColor: '#FFFFFF',
  },
  {
    id: 'koala',
    name: 'Koala', nameAr: 'كوالا',
    description: 'A sleepy koala with giant fluffy ears', descriptionAr: 'كوالا نعسانة بأذنين ضخمتين',
    isStarter: false, unlockPointsRequired: 0, purchaseCost: 80, isActive: true,
    defaultColor: '#9898A8', accentColor: '#C0C0D0',
  },
  {
    id: 'fox',
    name: 'Fox', nameAr: 'ثعلب',
    description: 'A clever orange fox with a fluffy tail', descriptionAr: 'ثعلب برتقالي ذكي بذيل كثيف',
    isStarter: false, unlockPointsRequired: 100, purchaseCost: 75, isActive: true,
    defaultColor: '#D06820', accentColor: '#FFFFFF',
  },
  {
    id: 'deer',
    name: 'Deer', nameAr: 'غزال',
    description: 'A gentle spotted deer with antlers', descriptionAr: 'غزال لطيف منقط بقرون',
    isStarter: false, unlockPointsRequired: 150, purchaseCost: 0, isActive: true,
    defaultColor: '#C8A060', accentColor: '#E8C888',
  },
  {
    id: 'bear',
    name: 'Bear', nameAr: 'دب',
    description: 'A cuddly brown bear cub', descriptionAr: 'دب بني صغير مدلل',
    isStarter: false, unlockPointsRequired: 0, purchaseCost: 100, isActive: true,
    defaultColor: '#8B5E3C', accentColor: '#C8A070',
  },
  {
    id: 'lion',
    name: 'Lion', nameAr: 'أسد',
    description: 'A majestic lion with a golden mane', descriptionAr: 'أسد مهيب بلبدة ذهبية',
    isStarter: false, unlockPointsRequired: 100, purchaseCost: 100, isActive: true,
    defaultColor: '#E8B84B', accentColor: '#C47820',
  },
  {
    id: 'tiger',
    name: 'Tiger', nameAr: 'نمر',
    description: 'A fierce striped tiger', descriptionAr: 'نمر مخطط قوي',
    isStarter: false, unlockPointsRequired: 100, purchaseCost: 150, isActive: true,
    defaultColor: '#E87820', accentColor: '#2C1408',
  },
  {
    id: 'panda',
    name: 'Panda', nameAr: 'باندا',
    description: 'An adorable black-and-white panda', descriptionAr: 'باندا رائعة بالأبيض والأسود',
    isStarter: false, unlockPointsRequired: 150, purchaseCost: 100, isActive: true,
    defaultColor: '#FFFFFF', accentColor: '#2A2A2A',
  },
  {
    id: 'giraffe',
    name: 'Giraffe', nameAr: 'زرافة',
    description: 'A graceful spotted giraffe', descriptionAr: 'زرافة رشيقة منقطة',
    isStarter: false, unlockPointsRequired: 250, purchaseCost: 100, isActive: true,
    defaultColor: '#E8C878', accentColor: '#C89028',
  },
  {
    id: 'snake',
    name: 'Snake', nameAr: 'ثعبان',
    description: 'A cute coiled green snake', descriptionAr: 'ثعبان أخضر لطيف ملتف',
    isStarter: false, unlockPointsRequired: 200, purchaseCost: 125, isActive: true,
    defaultColor: '#78B858', accentColor: '#FFFFA0',
  },
  {
    id: 'dinosaur',
    name: 'Dinosaur', nameAr: 'ديناصور',
    description: 'A spiky prehistoric dinosaur', descriptionAr: 'ديناصور شوكي من عصور سابقة',
    isStarter: false, unlockPointsRequired: 300, purchaseCost: 200, isActive: true,
    defaultColor: '#58C868', accentColor: '#3AA848',
  },
  {
    id: 'dragon',
    name: 'Dragon', nameAr: 'تنين',
    description: 'A legendary purple dragon', descriptionAr: 'تنين أسطوري بنفسجي',
    isStarter: false, unlockPointsRequired: 500, purchaseCost: 300, isActive: true,
    defaultColor: '#8860D0', accentColor: '#C060FF',
  },
];

export const AVATAR_ACCESSORIES: AvatarAccessory[] = [
  { id: 'star_badge', name: 'Star Badge', nameAr: 'شارة نجمة', category: 'star', emoji: '⭐', unlockPointsRequired: 0, purchaseCost: 0, isActive: true },
  { id: 'bow_tie', name: 'Bow Tie', nameAr: 'ربطة عنق', category: 'bow', emoji: '🎀', unlockPointsRequired: 0, purchaseCost: 0, isActive: true },
  { id: 'party_hat', name: 'Party Hat', nameAr: 'قبعة حفلة', category: 'hat', emoji: '🎉', unlockPointsRequired: 50, purchaseCost: 0, isActive: true },
  { id: 'glasses', name: 'Glasses', nameAr: 'نظارة', category: 'glasses', emoji: '🔭', unlockPointsRequired: 100, purchaseCost: 0, isActive: true },
  { id: 'scarf', name: 'Cozy Scarf', nameAr: 'وشاح دافئ', category: 'scarf', emoji: '🧣', unlockPointsRequired: 150, purchaseCost: 0, isActive: true },
  { id: 'medal', name: 'Gold Medal', nameAr: 'ميدالية ذهبية', category: 'medal', emoji: '🏅', unlockPointsRequired: 300, purchaseCost: 0, isActive: true },
  { id: 'top_hat', name: 'Top Hat', nameAr: 'قبعة عالية', category: 'hat', emoji: '🎩', unlockPointsRequired: 0, purchaseCost: 50, isActive: true },
  { id: 'sunglasses', name: 'Sunglasses', nameAr: 'نظارة شمسية', category: 'glasses', emoji: '😎', unlockPointsRequired: 0, purchaseCost: 40, isActive: true },
  { id: 'crown', name: 'Royal Crown', nameAr: 'تاج ملكي', category: 'crown', emoji: '👑', unlockPointsRequired: 200, purchaseCost: 100, isActive: true },
  { id: 'cape', name: 'Hero Cape', nameAr: 'عباءة البطل', category: 'cape', emoji: '🦸', unlockPointsRequired: 250, purchaseCost: 200, isActive: true },
];

export const AVATAR_COLOR_THEMES: AvatarColorTheme[] = [
  { id: 'default', name: 'Classic', nameAr: 'كلاسيكي', primary: '', secondary: '', accent: '', unlockPointsRequired: 0, purchaseCost: 0, isActive: true },
  { id: 'ocean', name: 'Ocean Blue', nameAr: 'أزرق المحيط', primary: '#4A90D9', secondary: '#B8D8F8', accent: '#1E6FAF', unlockPointsRequired: 50, purchaseCost: 0, isActive: true },
  { id: 'forest', name: 'Forest Green', nameAr: 'أخضر الغابة', primary: '#27AE60', secondary: '#B8F0D0', accent: '#1E8449', unlockPointsRequired: 100, purchaseCost: 0, isActive: true },
  { id: 'purple', name: 'Royal Purple', nameAr: 'بنفسجي ملكي', primary: '#9B59B6', secondary: '#E0C8F8', accent: '#7D3C98', unlockPointsRequired: 150, purchaseCost: 0, isActive: true },
  { id: 'gold', name: 'Golden', nameAr: 'ذهبي', primary: '#F1C40F', secondary: '#FEF9E7', accent: '#D4AC0D', unlockPointsRequired: 200, purchaseCost: 75, isActive: true },
  { id: 'pink', name: 'Bubblegum Pink', nameAr: 'وردي', primary: '#E91E8C', secondary: '#FBCEEB', accent: '#C2185B', unlockPointsRequired: 0, purchaseCost: 50, isActive: true },
  { id: 'sunset', name: 'Sunset', nameAr: 'غروب الشمس', primary: '#FF6B35', secondary: '#FFE8D6', accent: '#CC4A12', unlockPointsRequired: 300, purchaseCost: 100, isActive: true },
  { id: 'rainbow', name: 'Rainbow', nameAr: 'قوس قزح', primary: '#FF6B6B', secondary: '#FFF0F0', accent: '#4ECDC4', unlockPointsRequired: 500, purchaseCost: 200, isActive: true },
];

export const STARTER_ANIMAL_IDS = AVATAR_ANIMALS.filter(a => a.isStarter).map(a => a.id);
export const DEFAULT_ANIMAL_ID = 'cat';
