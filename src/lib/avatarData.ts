import type { AvatarAnimal, AvatarAccessory, AvatarColorTheme } from '../types/avatar';

export const AVATAR_ANIMALS: AvatarAnimal[] = [
  // ── Starters ─────────────────────────────────────────────────────────────────
  {
    id: 'cat', name: 'Cat', nameAr: 'قطة',
    description: 'A curious and playful orange cat', descriptionAr: 'قطة برتقالية فضولية ومرحة',
    isStarter: true, unlockPointsRequired: 0, purchaseCost: 0, isActive: true,
    defaultColor: '#F4A460', accentColor: '#FFB6C1', rarity: 'common',
  },
  {
    id: 'dog', name: 'Dog', nameAr: 'كلب',
    description: 'A loyal and friendly golden pup', descriptionAr: 'جرو ذهبي وفي وودود',
    isStarter: true, unlockPointsRequired: 0, purchaseCost: 0, isActive: true,
    defaultColor: '#C68642', accentColor: '#E8A060', rarity: 'common',
  },
  {
    id: 'rabbit', name: 'Rabbit', nameAr: 'أرنب',
    description: 'A fluffy white rabbit with big bright eyes', descriptionAr: 'أرنب أبيض ناعم بعيون كبيرة',
    isStarter: true, unlockPointsRequired: 0, purchaseCost: 0, isActive: true,
    defaultColor: '#F0E8D8', accentColor: '#FFB6C1', rarity: 'common',
  },
  {
    id: 'owl', name: 'Owl', nameAr: 'بومة',
    description: 'A wise owl with big amber eyes', descriptionAr: 'بومة حكيمة بعيون عنبرية كبيرة',
    isStarter: true, unlockPointsRequired: 0, purchaseCost: 0, isActive: true,
    defaultColor: '#9B8060', accentColor: '#D4A860', rarity: 'common',
  },
  {
    id: 'elephant', name: 'Elephant', nameAr: 'فيل',
    description: 'A gentle baby elephant with big ears', descriptionAr: 'فيل صغير لطيف بأذنين كبيرتين',
    isStarter: true, unlockPointsRequired: 0, purchaseCost: 0, isActive: true,
    defaultColor: '#A8B8C8', accentColor: '#C8D8E8', rarity: 'common',
  },
  {
    id: 'duck', name: 'Duck', nameAr: 'بطة',
    description: 'A cheerful yellow duck', descriptionAr: 'بطة صفراء مبهجة',
    isStarter: true, unlockPointsRequired: 0, purchaseCost: 0, isActive: true,
    defaultColor: '#FFE066', accentColor: '#FF9D00', rarity: 'common',
  },
  // ── Unlockable — Common ────────────────────────────────────────────────────
  {
    id: 'bat', name: 'Bat', nameAr: 'خفاش',
    description: 'A cute purple bat of the night', descriptionAr: 'خفاش بنفسجي لطيف في الليل',
    isStarter: false, unlockPointsRequired: 50, purchaseCost: 50, isActive: true,
    defaultColor: '#8878C8', accentColor: '#C8B8F0', rarity: 'common',
  },
  {
    id: 'squirrel', name: 'Squirrel', nameAr: 'سنجاب',
    description: 'A quick squirrel with a fluffy tail', descriptionAr: 'سنجاب سريع بذيل كثيف',
    isStarter: false, unlockPointsRequired: 0, purchaseCost: 75, isActive: true,
    defaultColor: '#B07848', accentColor: '#D0A870', rarity: 'common',
  },
  {
    id: 'monkey', name: 'Monkey', nameAr: 'قرد',
    description: 'A cheeky and playful monkey', descriptionAr: 'قرد شقي ومرح',
    isStarter: false, unlockPointsRequired: 100, purchaseCost: 0, isActive: true,
    defaultColor: '#C87830', accentColor: '#E8C890', rarity: 'common',
  },
  // ── Unlockable — Rare ─────────────────────────────────────────────────────
  {
    id: 'penguin', name: 'Penguin', nameAr: 'بطريق',
    description: 'A dapper black-and-white penguin', descriptionAr: 'بطريق أنيق أبيض وأسود',
    isStarter: false, unlockPointsRequired: 75, purchaseCost: 0, isActive: true,
    defaultColor: '#2A2A3A', accentColor: '#FFFFFF', rarity: 'rare',
  },
  {
    id: 'koala', name: 'Koala', nameAr: 'كوالا',
    description: 'A sleepy koala with giant fluffy ears', descriptionAr: 'كوالا نعسانة بأذنين ضخمتين',
    isStarter: false, unlockPointsRequired: 0, purchaseCost: 80, isActive: true,
    defaultColor: '#9898A8', accentColor: '#C0C0D0', rarity: 'rare',
  },
  {
    id: 'fox', name: 'Fox', nameAr: 'ثعلب',
    description: 'A clever orange fox with a bushy tail', descriptionAr: 'ثعلب برتقالي ذكي بذيل كثيف',
    isStarter: false, unlockPointsRequired: 100, purchaseCost: 75, isActive: true,
    defaultColor: '#D06820', accentColor: '#FFFFFF', rarity: 'rare',
  },
  {
    id: 'deer', name: 'Deer', nameAr: 'غزال',
    description: 'A graceful spotted deer with antlers', descriptionAr: 'غزال لطيف منقط بقرون',
    isStarter: false, unlockPointsRequired: 150, purchaseCost: 0, isActive: true,
    defaultColor: '#C8A060', accentColor: '#E8C888', rarity: 'rare',
  },
  {
    id: 'bear', name: 'Bear', nameAr: 'دب',
    description: 'A cuddly brown bear cub', descriptionAr: 'دب بني صغير مدلل',
    isStarter: false, unlockPointsRequired: 0, purchaseCost: 100, isActive: true,
    defaultColor: '#8B5E3C', accentColor: '#C8A070', rarity: 'rare',
  },
  // ── Unlockable — Epic ─────────────────────────────────────────────────────
  {
    id: 'lion', name: 'Lion', nameAr: 'أسد',
    description: 'A majestic lion with a golden mane', descriptionAr: 'أسد مهيب بلبدة ذهبية',
    isStarter: false, unlockPointsRequired: 100, purchaseCost: 100, isActive: true,
    defaultColor: '#E8B84B', accentColor: '#C47820', rarity: 'epic',
  },
  {
    id: 'tiger', name: 'Tiger', nameAr: 'نمر',
    description: 'A fierce striped tiger', descriptionAr: 'نمر مخطط قوي',
    isStarter: false, unlockPointsRequired: 100, purchaseCost: 150, isActive: true,
    defaultColor: '#E87820', accentColor: '#2C1408', rarity: 'epic',
  },
  {
    id: 'panda', name: 'Panda', nameAr: 'باندا',
    description: 'An adorable black-and-white panda', descriptionAr: 'باندا رائعة بالأبيض والأسود',
    isStarter: false, unlockPointsRequired: 150, purchaseCost: 100, isActive: true,
    defaultColor: '#FFFFFF', accentColor: '#2A2A2A', rarity: 'epic',
  },
  {
    id: 'giraffe', name: 'Giraffe', nameAr: 'زرافة',
    description: 'A graceful spotted giraffe', descriptionAr: 'زرافة رشيقة منقطة',
    isStarter: false, unlockPointsRequired: 250, purchaseCost: 100, isActive: true,
    defaultColor: '#E8C878', accentColor: '#C89028', rarity: 'epic',
  },
  {
    id: 'snake', name: 'Snake', nameAr: 'ثعبان',
    description: 'A cute coiled green snake', descriptionAr: 'ثعبان أخضر لطيف ملتف',
    isStarter: false, unlockPointsRequired: 200, purchaseCost: 125, isActive: true,
    defaultColor: '#78B858', accentColor: '#FFFFA0', rarity: 'epic',
  },
  // ── Unlockable — Legendary ────────────────────────────────────────────────
  {
    id: 'dinosaur', name: 'Dinosaur', nameAr: 'ديناصور',
    description: 'A spiky prehistoric dinosaur', descriptionAr: 'ديناصور شوكي من عصور سابقة',
    isStarter: false, unlockPointsRequired: 300, purchaseCost: 200, isActive: true,
    defaultColor: '#58C868', accentColor: '#3AA848', rarity: 'legendary',
  },
  {
    id: 'dragon', name: 'Dragon', nameAr: 'تنين',
    description: 'A legendary purple dragon — the rarest companion', descriptionAr: 'تنين أسطوري بنفسجي — أندر رفيق',
    isStarter: false, unlockPointsRequired: 500, purchaseCost: 300, isActive: true,
    defaultColor: '#8860D0', accentColor: '#C060FF', rarity: 'legendary',
  },
];

export const AVATAR_ACCESSORIES: AvatarAccessory[] = [
  // ── Common — Free ────────────────────────────────────────────────────────
  { id: 'star_badge',    name: 'Star Badge',    nameAr: 'شارة نجمة',    category: 'star',    emoji: '⭐', unlockPointsRequired: 0,   purchaseCost: 0,   isActive: true, rarity: 'common' },
  { id: 'bow_tie',       name: 'Bow Tie',        nameAr: 'ربطة عنق',     category: 'bow',     emoji: '🎀', unlockPointsRequired: 0,   purchaseCost: 0,   isActive: true, rarity: 'common' },
  { id: 'flower_crown',  name: 'Flower Crown',   nameAr: 'تاج الزهور',   category: 'flower',  emoji: '🌸', unlockPointsRequired: 30,  purchaseCost: 0,   isActive: true, rarity: 'common' },
  { id: 'party_hat',     name: 'Party Hat',      nameAr: 'قبعة حفلة',    category: 'hat',     emoji: '🎉', unlockPointsRequired: 50,  purchaseCost: 0,   isActive: true, rarity: 'common' },
  { id: 'glasses',       name: 'Glasses',         nameAr: 'نظارة',        category: 'glasses', emoji: '🔭', unlockPointsRequired: 100, purchaseCost: 0,   isActive: true, rarity: 'common' },
  // ── Common — Purchasable ─────────────────────────────────────────────────
  { id: 'sunglasses',    name: 'Sunglasses',     nameAr: 'نظارة شمسية',  category: 'glasses', emoji: '😎', unlockPointsRequired: 0,   purchaseCost: 40,  isActive: true, rarity: 'common' },
  { id: 'top_hat',       name: 'Top Hat',         nameAr: 'قبعة عالية',   category: 'hat',     emoji: '🎩', unlockPointsRequired: 0,   purchaseCost: 50,  isActive: true, rarity: 'common' },
  { id: 'heart_glasses', name: 'Heart Glasses',  nameAr: 'نظارة قلوب',   category: 'glasses', emoji: '💗', unlockPointsRequired: 0,   purchaseCost: 35,  isActive: true, rarity: 'common' },
  // ── Rare ─────────────────────────────────────────────────────────────────
  { id: 'scarf',         name: 'Cozy Scarf',     nameAr: 'وشاح دافئ',    category: 'scarf',   emoji: '🧣', unlockPointsRequired: 150, purchaseCost: 0,   isActive: true, rarity: 'rare' },
  { id: 'medal',         name: 'Gold Medal',     nameAr: 'ميدالية ذهبية', category: 'medal',  emoji: '🏅', unlockPointsRequired: 300, purchaseCost: 0,   isActive: true, rarity: 'rare' },
  { id: 'wizard_hat',    name: 'Wizard Hat',     nameAr: 'قبعة ساحر',    category: 'hat',     emoji: '🪄', unlockPointsRequired: 0,   purchaseCost: 75,  isActive: true, rarity: 'rare' },
  { id: 'pirate_hat',    name: 'Pirate Hat',     nameAr: 'قبعة قرصان',   category: 'hat',     emoji: '☠️', unlockPointsRequired: 0,   purchaseCost: 80,  isActive: true, rarity: 'rare' },
  { id: 'cape',          name: 'Hero Cape',      nameAr: 'عباءة البطل',   category: 'cape',    emoji: '🦸', unlockPointsRequired: 250, purchaseCost: 200, isActive: true, rarity: 'rare' },
  // ── Epic ─────────────────────────────────────────────────────────────────
  { id: 'halo',          name: 'Golden Halo',    nameAr: 'هالة ذهبية',   category: 'halo',    emoji: '😇', unlockPointsRequired: 0,   purchaseCost: 200, isActive: true, rarity: 'epic' },
  { id: 'crown',         name: 'Royal Crown',    nameAr: 'تاج ملكي',     category: 'crown',   emoji: '👑', unlockPointsRequired: 200, purchaseCost: 100, isActive: true, rarity: 'epic' },
];

export const AVATAR_COLOR_THEMES: AvatarColorTheme[] = [
  { id: 'default', name: 'Classic',        nameAr: 'كلاسيكي',       primary: '', secondary: '', accent: '', unlockPointsRequired: 0,   purchaseCost: 0,   isActive: true, rarity: 'common' },
  { id: 'ocean',   name: 'Ocean Blue',     nameAr: 'أزرق المحيط',   primary: '#4A90D9', secondary: '#B8D8F8', accent: '#1E6FAF', unlockPointsRequired: 50,  purchaseCost: 0,   isActive: true, rarity: 'common' },
  { id: 'forest',  name: 'Forest Green',   nameAr: 'أخضر الغابة',   primary: '#27AE60', secondary: '#B8F0D0', accent: '#1E8449', unlockPointsRequired: 100, purchaseCost: 0,   isActive: true, rarity: 'common' },
  { id: 'pink',    name: 'Bubblegum Pink', nameAr: 'وردي',           primary: '#E91E8C', secondary: '#FBCEEB', accent: '#C2185B', unlockPointsRequired: 0,   purchaseCost: 50,  isActive: true, rarity: 'common' },
  { id: 'purple',  name: 'Royal Purple',   nameAr: 'بنفسجي ملكي',   primary: '#9B59B6', secondary: '#E0C8F8', accent: '#7D3C98', unlockPointsRequired: 150, purchaseCost: 0,   isActive: true, rarity: 'rare' },
  { id: 'gold',    name: 'Golden',         nameAr: 'ذهبي',           primary: '#F1C40F', secondary: '#FEF9E7', accent: '#D4AC0D', unlockPointsRequired: 200, purchaseCost: 75,  isActive: true, rarity: 'rare' },
  { id: 'sunset',  name: 'Sunset',         nameAr: 'غروب الشمس',    primary: '#FF6B35', secondary: '#FFE8D6', accent: '#CC4A12', unlockPointsRequired: 300, purchaseCost: 100, isActive: true, rarity: 'epic' },
  { id: 'rainbow', name: 'Rainbow',        nameAr: 'قوس قزح',       primary: '#FF6B6B', secondary: '#FFF0F0', accent: '#4ECDC4', unlockPointsRequired: 500, purchaseCost: 200, isActive: true, rarity: 'legendary' },
];

// ── Human Characters (emoji-based, available alongside animal companions) ──────
// These reuse the full avatar shop system — inventory, purchases, settings — but
// are rendered as large emoji rather than SVG so they are always recognisable.
export const HUMAN_CHARACTER_ANIMALS: typeof AVATAR_ANIMALS[number][] = [
  {
    id: 'hc_boy',       name: 'Young Hero',         nameAr: 'البطل الصغير',
    description: 'A young male hero ready for adventure', descriptionAr: 'بطل شاب مستعد للمغامرة',
    isStarter: true, unlockPointsRequired: 0, purchaseCost: 0, isActive: true,
    defaultColor: '#F4D03F', accentColor: '#E67E22', rarity: 'common', characterEmoji: '👦',
  },
  {
    id: 'hc_girl',      name: 'Young Heroine',       nameAr: 'البطلة الصغيرة',
    description: 'A young female hero, brave and determined', descriptionAr: 'بطلة شابة شجاعة ومصممة',
    isStarter: true, unlockPointsRequired: 0, purchaseCost: 0, isActive: true,
    defaultColor: '#E91E8C', accentColor: '#F8BBD0', rarity: 'common', characterEmoji: '👧',
  },
  {
    id: 'hc_child',     name: 'Little Champion',     nameAr: 'البطل الصغير',
    description: 'A cheerful little champion', descriptionAr: 'بطل صغير مبهج',
    isStarter: true, unlockPointsRequired: 0, purchaseCost: 0, isActive: true,
    defaultColor: '#2196F3', accentColor: '#BBDEFB', rarity: 'common', characterEmoji: '🧒',
  },
  {
    id: 'hc_man',       name: 'Adult Hero',          nameAr: 'البطل البالغ',
    description: 'A strong and capable adult hero', descriptionAr: 'بطل بالغ قوي وقادر',
    isStarter: false, unlockPointsRequired: 100, purchaseCost: 0, isActive: true,
    defaultColor: '#1565C0', accentColor: '#90CAF9', rarity: 'rare', characterEmoji: '👨',
  },
  {
    id: 'hc_woman',     name: 'Adult Heroine',        nameAr: 'البطلة البالغة',
    description: 'A wise and powerful adult heroine', descriptionAr: 'بطلة بالغة حكيمة وقوية',
    isStarter: false, unlockPointsRequired: 100, purchaseCost: 0, isActive: true,
    defaultColor: '#880E4F', accentColor: '#F48FB1', rarity: 'rare', characterEmoji: '👩',
  },
  {
    id: 'hc_elder_m',   name: 'Wise Elder',          nameAr: 'الحكيم الكبير',
    description: 'A wise elder hero with years of experience', descriptionAr: 'بطل حكيم كبير بسنوات من الخبرة',
    isStarter: false, unlockPointsRequired: 250, purchaseCost: 0, isActive: true,
    defaultColor: '#795548', accentColor: '#BCAAA4', rarity: 'epic', characterEmoji: '👴',
  },
  {
    id: 'hc_elder_f',   name: 'Wise Heroine Elder',  nameAr: 'الحكيمة الكبيرة',
    description: 'A wise elder heroine full of stories', descriptionAr: 'بطلة حكيمة كبيرة مليئة بالقصص',
    isStarter: false, unlockPointsRequired: 250, purchaseCost: 0, isActive: true,
    defaultColor: '#4A148C', accentColor: '#CE93D8', rarity: 'epic', characterEmoji: '👵',
  },
  {
    id: 'hc_superhero', name: 'Superhero',           nameAr: 'البطل الخارق',
    description: 'A legendary superhero — earned by the greatest heroes', descriptionAr: 'بطل خارق أسطوري — يناله أعظم الأبطال',
    isStarter: false, unlockPointsRequired: 500, purchaseCost: 0, isActive: true,
    defaultColor: '#B71C1C', accentColor: '#FFD700', rarity: 'legendary', characterEmoji: '🦸',
  },
];

// Merge so the full shop includes both animals and human characters
AVATAR_ANIMALS.push(...HUMAN_CHARACTER_ANIMALS);

export const STARTER_ANIMAL_IDS = AVATAR_ANIMALS.filter(a => a.isStarter).map(a => a.id);
export const DEFAULT_ANIMAL_ID = 'cat';
