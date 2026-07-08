export type AvatarMood = 0 | 1 | 2 | 3 | 4;

export function getMoodFromPoints(points: number): AvatarMood {
  if (points >= 600) return 4;
  if (points >= 300) return 3;
  if (points >= 150) return 2;
  if (points >= 50) return 1;
  return 0;
}

export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'seasonal' | 'special';

export interface AvatarAnimal {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  isStarter: boolean;
  unlockPointsRequired: number;
  purchaseCost: number;
  isActive: boolean;
  defaultColor: string;
  accentColor: string;
  rarity: ItemRarity;
}

export type AccessoryCategory =
  | 'hat' | 'glasses' | 'bow' | 'crown' | 'star'
  | 'cape' | 'scarf' | 'medal' | 'halo' | 'flower';

export interface AvatarAccessory {
  id: string;
  name: string;
  nameAr: string;
  category: AccessoryCategory;
  emoji: string;
  unlockPointsRequired: number;
  purchaseCost: number;
  isActive: boolean;
  rarity: ItemRarity;
}

export interface AvatarColorTheme {
  id: string;
  name: string;
  nameAr: string;
  primary: string;
  secondary: string;
  accent: string;
  unlockPointsRequired: number;
  purchaseCost: number;
  isActive: boolean;
  rarity: ItemRarity;
}

export interface AvatarInventoryItem {
  id: string;
  participantId: string;
  itemType: 'animal' | 'accessory' | 'color';
  itemId: string;
  acquiredAt: string;
}

export interface AvatarSettings {
  participantId: string;
  equippedAnimalId: string;
  equippedAccessoryIds: string[];
  equippedColorId: string | null;
  updatedAt: string;
}

export interface PointsWallet {
  participantId: string;
  totalSpentPoints: number;
  updatedAt: string;
}

/** Admin-configurable per-item shop flags — stored in localStorage (+ optional Supabase). */
export interface AvatarShopItemOverride {
  itemId: string;
  itemType: 'animal' | 'accessory' | 'color';
  isFeatured: boolean;
  isSeasonal: boolean;
  isHidden: boolean;
  seasonalEndDate?: string; // YYYY-MM-DD; undefined = no expiry
  updatedAt: string;
}
