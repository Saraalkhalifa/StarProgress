import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Lock, CheckCircle, Star, Sparkles, Palette,
  Eye, X, Zap, Crown, Clock,
} from 'lucide-react';
import { useAvatar } from '../../contexts/AvatarContext';
import { AnimalAvatar } from '../../components/avatar/AnimalAvatar';
import { AVATAR_ANIMALS, AVATAR_ACCESSORIES, AVATAR_COLOR_THEMES } from '../../lib/avatarData';
import { getMoodFromPoints, type ItemRarity } from '../../types/avatar';
import { Card, Button, toast } from '../../components/ui';
import { cn } from '../../lib/utils';
import { isSeasonalActive } from '../../lib/avatarShopConfig';

// ── Rarity config ─────────────────────────────────────────────────────────────

const RARITY: Record<ItemRarity, { label: string; chip: string; border: string; glow: string }> = {
  common:    { label: 'Common',    chip: 'bg-gray-100 text-gray-600',            border: 'border-gray-200',   glow: '' },
  rare:      { label: 'Rare',      chip: 'bg-blue-100 text-blue-700',            border: 'border-blue-200',   glow: 'shadow-blue-100' },
  epic:      { label: 'Epic',      chip: 'bg-purple-100 text-purple-700',        border: 'border-purple-200', glow: 'shadow-purple-100' },
  legendary: { label: 'Legendary', chip: 'bg-amber-100 text-amber-700',          border: 'border-amber-200',  glow: 'shadow-amber-100' },
  seasonal:  { label: 'Seasonal',  chip: 'bg-teal-100 text-teal-700',            border: 'border-teal-200',   glow: 'shadow-teal-100' },
  special:   { label: 'Special',   chip: 'bg-fuchsia-100 text-fuchsia-700',      border: 'border-fuchsia-200',glow: 'shadow-fuchsia-100' },
};

function RarityBadge({ rarity, size = 'sm' }: { rarity: ItemRarity; size?: 'xs' | 'sm' }) {
  const cfg = RARITY[rarity];
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 font-semibold rounded-full',
      size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5',
      cfg.chip,
    )}>
      {rarity === 'legendary' && <Crown className="w-2.5 h-2.5" />}
      {rarity === 'epic' && <Sparkles className="w-2.5 h-2.5" />}
      {cfg.label}
    </span>
  );
}

// ── Preview modal ─────────────────────────────────────────────────────────────

type PreviewTarget =
  | { type: 'animal';    id: string }
  | { type: 'accessory'; id: string }
  | { type: 'color';     id: string };

interface PreviewModalProps {
  target: PreviewTarget;
  onClose: () => void;
  equippedAnimalId: string;
  equippedAccessoryIds: string[];
  equippedColorId: string | null;
  mood: ReturnType<typeof getMoodFromPoints>;
  spendablePoints: number;
  totalEarnedPoints: number;
  ownsAnimal: (id: string) => boolean;
  ownsAccessory: (id: string) => boolean;
  ownsColor: (id: string) => boolean;
  canUnlockAnimal: (id: string) => boolean;
  canUnlockAccessory: (id: string) => boolean;
  canUnlockColor: (id: string) => boolean;
  purchaseAnimal: (id: string) => { success: boolean; error?: string };
  purchaseAccessory: (id: string) => { success: boolean; error?: string };
  purchaseColor: (id: string) => { success: boolean; error?: string };
  equipAnimal: (id: string) => void;
  toggleAccessory: (id: string) => void;
  equipColor: (id: string | null) => void;
}

function PreviewModal({
  target, onClose,
  equippedAnimalId, equippedAccessoryIds, equippedColorId,
  mood, spendablePoints, totalEarnedPoints,
  ownsAnimal, ownsAccessory, ownsColor,
  canUnlockAnimal, canUnlockAccessory, canUnlockColor,
  purchaseAnimal, purchaseAccessory, purchaseColor,
  equipAnimal, toggleAccessory, equipColor,
}: PreviewModalProps) {
  const { type, id } = target;

  // Resolve item metadata
  const animal    = type === 'animal'    ? AVATAR_ANIMALS.find(a => a.id === id) : null;
  const accessory = type === 'accessory' ? AVATAR_ACCESSORIES.find(a => a.id === id) : null;
  const color     = type === 'color'     ? AVATAR_COLOR_THEMES.find(c => c.id === id) : null;

  const item = animal ?? accessory ?? color;
  if (!item) return null;

  const rarity: ItemRarity = item.rarity;
  const name = item.name;
  const cost = item.purchaseCost;
  const unlockPts = item.unlockPointsRequired;
  const description = 'description' in item ? item.description : '';

  const owned    = type === 'animal' ? ownsAnimal(id) : type === 'accessory' ? ownsAccessory(id) : ownsColor(id);
  const canUnlock = type === 'animal' ? canUnlockAnimal(id) : type === 'accessory' ? canUnlockAccessory(id) : canUnlockColor(id);
  const equipped = type === 'animal'
    ? equippedAnimalId === id
    : type === 'accessory'
    ? equippedAccessoryIds.includes(id)
    : equippedColorId === id;

  // Avatar preview config
  const previewAnimalId  = type === 'animal'    ? id : equippedAnimalId;
  const previewAccessIds = type === 'accessory'  ? [id] : equippedAccessoryIds;
  const previewColorId   = type === 'color'      ? id : equippedColorId;

  const handleBuyAndEquip = () => {
    let result: { success: boolean; error?: string };
    if (type === 'animal')    result = purchaseAnimal(id);
    else if (type === 'accessory') result = purchaseAccessory(id);
    else result = purchaseColor(id);

    if (result.success) {
      toast.success(`${name} unlocked! 🎉`);
      if (type === 'animal')    { equipAnimal(id); }
      else if (type === 'accessory') { toggleAccessory(id); }
      else { equipColor(id); }
      onClose();
    } else {
      toast.error(result.error ?? 'Purchase failed');
    }
  };

  const handleEquip = () => {
    if (type === 'animal')    equipAnimal(id);
    else if (type === 'accessory') toggleAccessory(id);
    else equipColor(equipped ? null : id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ duration: 0.18 }}
        className={cn(
          'relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4',
          'border-2', RARITY[rarity].border,
        )}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-4 h-4" />
        </button>

        {/* Animated avatar preview */}
        <div className={cn(
          'flex justify-center py-4 rounded-2xl',
          rarity === 'legendary' ? 'bg-gradient-to-br from-amber-50 to-yellow-50' :
          rarity === 'epic'      ? 'bg-gradient-to-br from-purple-50 to-pink-50' :
          rarity === 'rare'      ? 'bg-gradient-to-br from-blue-50 to-sky-50' :
          'bg-gradient-to-br from-gray-50 to-slate-50',
        )}>
          <AnimalAvatar
            animalId={previewAnimalId}
            mood={mood}
            colorThemeId={previewColorId}
            accessoryIds={previewAccessIds}
            size={160}
            animated
          />
        </div>

        {/* Info */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-bold text-gray-900">{name}</h3>
            <RarityBadge rarity={rarity} />
          </div>
          {description && <p className="text-sm text-gray-500 leading-relaxed">{description}</p>}
        </div>

        {/* Color swatches */}
        {type === 'color' && color && color.id !== 'default' && (
          <div className="flex gap-2">
            {(['primary', 'secondary', 'accent'] as const).map(k => (
              <div key={k} className="w-8 h-8 rounded-full border-2 border-white shadow-sm ring-1 ring-gray-200"
                style={{ background: color[k] }} />
            ))}
          </div>
        )}

        {/* Unlock info */}
        {!owned && (
          <div className="text-sm text-gray-500 space-y-0.5">
            {unlockPts > 0 && totalEarnedPoints < unlockPts && (
              <p className="flex items-center gap-1 text-gray-400">
                <Lock className="w-3.5 h-3.5" /> Requires {unlockPts} total points
              </p>
            )}
            {cost > 0 && (
              <p className="flex items-center gap-1 font-medium text-amber-700">
                <Star className="w-3.5 h-3.5" /> {cost} spendable points
                {spendablePoints < cost && (
                  <span className="text-red-400 font-normal ml-1">(need {cost - spendablePoints} more)</span>
                )}
              </p>
            )}
            {cost === 0 && unlockPts > 0 && (
              <p className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-3.5 h-3.5" /> Free — earn {unlockPts} total points
              </p>
            )}
            {cost === 0 && unlockPts === 0 && (
              <p className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-3.5 h-3.5" /> Free item
              </p>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-2 pt-1">
          {owned && (
            <Button
              className="w-full"
              variant={equipped ? 'secondary' : 'primary'}
              onClick={handleEquip}
            >
              {equipped
                ? (type === 'animal' ? 'Currently equipped' : 'Remove')
                : (type === 'animal' ? 'Equip this animal' : type === 'color' ? 'Apply theme' : 'Equip accessory')}
            </Button>
          )}
          {!owned && canUnlock && (
            <Button
              className="w-full"
              onClick={handleBuyAndEquip}
              disabled={cost > 0 && spendablePoints < cost}
            >
              {cost === 0 ? `Unlock for free` : `Buy & Equip — ${cost} pts`}
            </Button>
          )}
          {!owned && !canUnlock && (
            <div className="text-center py-2 text-sm text-gray-400 flex items-center justify-center gap-1.5">
              <Lock className="w-4 h-4" />
              Earn {unlockPts - totalEarnedPoints} more points to unlock
            </div>
          )}
          <Button variant="secondary" size="sm" className="w-full" onClick={onClose}>
            Close preview
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Tab types ─────────────────────────────────────────────────────────────────

type ShopTab = 'featured' | 'animals' | 'accessories' | 'colors';

// ── Main shop ─────────────────────────────────────────────────────────────────

export function AvatarShop() {
  const {
    settings, spendablePoints, totalEarnedPoints,
    shopOverrides,
    ownsAnimal, ownsAccessory, ownsColor,
    canUnlockAnimal, canUnlockAccessory, canUnlockColor,
    purchaseAnimal, purchaseAccessory, purchaseColor,
    equipAnimal, toggleAccessory, equipColor,
  } = useAvatar();
  const [tab, setTab] = useState<ShopTab>('featured');
  const [preview, setPreview] = useState<PreviewTarget | null>(null);
  const mood = getMoodFromPoints(totalEarnedPoints);

  const openPreview = useCallback((t: PreviewTarget) => setPreview(t), []);
  const closePreview = useCallback(() => setPreview(null), []);

  if (!settings) return null;

  const getOverride = (type: 'animal' | 'accessory' | 'color', id: string) =>
    shopOverrides.find(o => o.itemType === type && o.itemId === id) ?? null;

  // Featured: admin-marked featured items + active seasonal items
  const featuredAnimals      = AVATAR_ANIMALS.filter(a => {
    const o = getOverride('animal', a.id);
    if (o?.isHidden) return false;
    if (o?.isFeatured) return true;
    if (o?.isSeasonal && isSeasonalActive(o)) return true;
    return false;
  });
  const featuredAccessories  = AVATAR_ACCESSORIES.filter(a => {
    const o = getOverride('accessory', a.id);
    if (o?.isHidden) return false;
    if (o?.isFeatured) return true;
    if (o?.isSeasonal && isSeasonalActive(o)) return true;
    return false;
  });
  const featuredColors       = AVATAR_COLOR_THEMES.filter(c => {
    const o = getOverride('color', c.id);
    if (o?.isHidden) return false;
    if (o?.isFeatured) return true;
    if (o?.isSeasonal && isSeasonalActive(o)) return true;
    return false;
  });

  // Fallback featured: top 6 unowned items by rarity when no admin-configured ones
  const rarityOrder: ItemRarity[] = ['legendary', 'epic', 'rare', 'common'];
  const allFeatured = [...featuredAnimals.map(a => ({ type: 'animal' as const, item: a })),
    ...featuredAccessories.map(a => ({ type: 'accessory' as const, item: a })),
    ...featuredColors.map(c => ({ type: 'color' as const, item: c }))];

  const fallbackFeatured = allFeatured.length === 0
    ? [
        ...AVATAR_ANIMALS.filter(a => a.rarity === 'legendary' || a.rarity === 'epic').map(a => ({ type: 'animal' as const, item: a })),
        ...AVATAR_ACCESSORIES.filter(a => a.rarity === 'epic').map(a => ({ type: 'accessory' as const, item: a })),
        ...AVATAR_COLOR_THEMES.filter(c => c.rarity === 'legendary' || c.rarity === 'epic').map(c => ({ type: 'color' as const, item: c })),
      ]
        .sort((a, b) => rarityOrder.indexOf(a.item.rarity) - rarityOrder.indexOf(b.item.rarity))
        .slice(0, 6)
    : allFeatured;

  const visibleAnimals      = AVATAR_ANIMALS.filter(a => !(getOverride('animal', a.id)?.isHidden));
  const visibleAccessories  = AVATAR_ACCESSORIES.filter(a => !(getOverride('accessory', a.id)?.isHidden));
  const visibleColors       = AVATAR_COLOR_THEMES.filter(c => !(getOverride('color', c.id)?.isHidden));

  const tabs: Array<{ id: ShopTab; label: string; icon: React.ReactNode }> = [
    { id: 'featured',    label: 'Featured',    icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'animals',     label: 'Animals',     icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'accessories', label: 'Accessories', icon: <Star className="w-3.5 h-3.5" /> },
    { id: 'colors',      label: 'Colors',      icon: <Palette className="w-3.5 h-3.5" /> },
  ];

  const modalProps = {
    equippedAnimalId: settings.equippedAnimalId,
    equippedAccessoryIds: settings.equippedAccessoryIds,
    equippedColorId: settings.equippedColorId,
    mood, spendablePoints, totalEarnedPoints,
    ownsAnimal, ownsAccessory, ownsColor,
    canUnlockAnimal, canUnlockAccessory, canUnlockColor,
    purchaseAnimal, purchaseAccessory, purchaseColor,
    equipAnimal, toggleAccessory, equipColor,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ShoppingBag className="w-7 h-7 text-amber-500" />
            Avatar Shop
          </h1>
          <p className="text-gray-500 text-sm mt-1">Collect animals, accessories, and color themes</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-1.5">
            <Star className="w-3.5 h-3.5 text-blue-500" />
            <span className="font-bold text-blue-700 text-sm">{totalEarnedPoints}</span>
            <span className="text-xs text-blue-400">total pts</span>
          </div>
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
            <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-bold text-amber-700 text-sm">{spendablePoints}</span>
            <span className="text-xs text-amber-400">spendable</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all',
              tab === t.id
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-amber-50 hover:border-amber-200',
            )}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

          {/* ── FEATURED ── */}
          {tab === 'featured' && (
            <div className="space-y-4">
              {fallbackFeatured.length === 0 ? (
                <Card className="p-8 text-center text-gray-400">
                  <Zap className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No featured items right now. Check back soon!</p>
                </Card>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {fallbackFeatured.map(({ type, item }) => {
                    const override = getOverride(type, item.id);
                    const owned =
                      type === 'animal' ? ownsAnimal(item.id)
                      : type === 'accessory' ? ownsAccessory(item.id)
                      : ownsColor(item.id);
                    const isSeasonal = override?.isSeasonal && isSeasonalActive(override);

                    return (
                      <FeaturedCard key={`${type}-${item.id}`}
                        type={type} item={item} owned={owned}
                        isSeasonal={!!isSeasonal} seasonalEndDate={override?.seasonalEndDate}
                        settings={settings} mood={mood}
                        onPreview={() => openPreview({ type, id: item.id } as PreviewTarget)}
                      />
                    );
                  })}
                </div>
              )}

              <Card className="p-4 bg-amber-50 border-amber-200">
                <p className="text-xs text-amber-700">
                  <strong>Featured</strong> items are highlighted by your program admin. Seasonal items expire on their end date — grab them while they last!
                </p>
              </Card>
            </div>
          )}

          {/* ── ANIMALS ── */}
          {tab === 'animals' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {visibleAnimals.map(animal => {
                const owned = ownsAnimal(animal.id);
                const canUnlock = canUnlockAnimal(animal.id);
                const isEquipped = settings.equippedAnimalId === animal.id;
                const cfg = RARITY[animal.rarity];

                return (
                  <motion.div key={animal.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Card className={cn(
                      'p-3 flex flex-col items-center gap-2 cursor-pointer relative transition-all',
                      isEquipped ? 'ring-2 ring-purple-400 border-purple-200' : '',
                      !owned && !canUnlock ? 'opacity-60' : '',
                      owned ? cfg.border : '',
                      owned && animal.rarity !== 'common' ? `shadow-sm ${cfg.glow}` : '',
                    )}
                      onClick={() => openPreview({ type: 'animal', id: animal.id })}
                    >
                      <AnimalAvatar
                        animalId={animal.id}
                        mood={owned ? mood : 0}
                        size={72}
                        animated={false}
                        showMoodBg={false}
                      />

                      <div className="text-center space-y-1 w-full">
                        <p className="font-semibold text-gray-800 text-sm truncate">{animal.name}</p>
                        <RarityBadge rarity={animal.rarity} size="xs" />
                      </div>

                      <div className="w-full">
                        {isEquipped && (
                          <span className="block text-center text-xs text-purple-600 font-semibold">✓ Equipped</span>
                        )}
                        {!isEquipped && owned && (
                          <span className="block text-center text-xs text-green-600 font-medium">Owned</span>
                        )}
                        {!owned && canUnlock && animal.purchaseCost === 0 && (
                          <span className="block text-center text-xs text-green-600">Free to unlock</span>
                        )}
                        {!owned && canUnlock && animal.purchaseCost > 0 && (
                          <span className="block text-center text-xs text-amber-600 font-medium">{animal.purchaseCost} pts</span>
                        )}
                        {!owned && !canUnlock && (
                          <span className="block text-center text-xs text-gray-400 flex items-center justify-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" /> {animal.unlockPointsRequired} pts
                          </span>
                        )}
                      </div>

                      <button
                        onClick={e => { e.stopPropagation(); openPreview({ type: 'animal', id: animal.id }); }}
                        className="absolute top-2 right-2 p-1 rounded-full bg-white/80 hover:bg-white shadow-sm text-gray-400 hover:text-gray-600 transition-colors"
                        title="Preview"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* ── ACCESSORIES ── */}
          {tab === 'accessories' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {visibleAccessories.map(acc => {
                const owned = ownsAccessory(acc.id);
                const equipped = settings.equippedAccessoryIds.includes(acc.id);
                const canUnlock = canUnlockAccessory(acc.id);
                const cfg = RARITY[acc.rarity];

                return (
                  <motion.div key={acc.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Card className={cn(
                      'p-3 flex flex-col items-center gap-2 cursor-pointer relative transition-all',
                      equipped ? 'ring-2 ring-purple-400 border-purple-200' : '',
                      !owned && !canUnlock ? 'opacity-60' : '',
                      owned ? cfg.border : '',
                    )}
                      onClick={() => openPreview({ type: 'accessory', id: acc.id })}
                    >
                      {/* Accessory preview on current animal */}
                      <div className="relative">
                        <AnimalAvatar
                          animalId={settings.equippedAnimalId}
                          mood={owned ? mood : 0}
                          colorThemeId={settings.equippedColorId}
                          accessoryIds={[acc.id]}
                          size={72}
                          animated={false}
                          showMoodBg={false}
                        />
                      </div>

                      <div className="text-center space-y-1 w-full">
                        <p className="font-semibold text-gray-800 text-xs truncate">{acc.name}</p>
                        <RarityBadge rarity={acc.rarity} size="xs" />
                      </div>

                      <div className="w-full">
                        {equipped && <span className="block text-center text-xs text-purple-600 font-semibold">✓ Equipped</span>}
                        {!equipped && owned && <span className="block text-center text-xs text-green-600">Owned</span>}
                        {!owned && canUnlock && acc.purchaseCost === 0 && <span className="block text-center text-xs text-green-600">Free</span>}
                        {!owned && canUnlock && acc.purchaseCost > 0 && <span className="block text-center text-xs text-amber-600 font-medium">{acc.purchaseCost} pts</span>}
                        {!owned && !canUnlock && (
                          <span className="block text-center text-xs text-gray-400 flex items-center justify-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" /> {acc.unlockPointsRequired} pts
                          </span>
                        )}
                      </div>

                      <button
                        onClick={e => { e.stopPropagation(); openPreview({ type: 'accessory', id: acc.id }); }}
                        className="absolute top-2 right-2 p-1 rounded-full bg-white/80 hover:bg-white shadow-sm text-gray-400 hover:text-gray-600 transition-colors"
                        title="Preview"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* ── COLORS ── */}
          {tab === 'colors' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {visibleColors.map(theme => {
                const owned = ownsColor(theme.id);
                const equipped = settings.equippedColorId === theme.id;
                const canUnlock = canUnlockColor(theme.id);
                const cfg = RARITY[theme.rarity];

                return (
                  <motion.div key={theme.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Card className={cn(
                      'p-3 flex flex-col items-center gap-2 cursor-pointer relative transition-all',
                      equipped ? 'ring-2 ring-purple-400 border-purple-200' : '',
                      !owned && !canUnlock ? 'opacity-60' : '',
                      owned ? cfg.border : '',
                    )}
                      onClick={() => openPreview({ type: 'color', id: theme.id })}
                    >
                      {/* Color preview on current animal */}
                      <AnimalAvatar
                        animalId={settings.equippedAnimalId}
                        mood={owned ? mood : 0}
                        colorThemeId={theme.id}
                        accessoryIds={settings.equippedAccessoryIds}
                        size={72}
                        animated={false}
                        showMoodBg={false}
                      />

                      <div className="flex gap-1 justify-center">
                        {theme.id === 'default' ? (
                          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-orange-300 to-amber-400 border border-gray-200" />
                        ) : (
                          (['primary', 'secondary', 'accent'] as const).map(k => (
                            <div key={k} className="w-4 h-4 rounded-full border border-gray-200" style={{ background: theme[k] }} />
                          ))
                        )}
                      </div>

                      <div className="text-center space-y-1 w-full">
                        <p className="font-semibold text-gray-800 text-xs truncate">{theme.name}</p>
                        <RarityBadge rarity={theme.rarity} size="xs" />
                      </div>

                      <div className="w-full">
                        {equipped && <span className="block text-center text-xs text-purple-600 font-semibold">✓ Applied</span>}
                        {!equipped && owned && <span className="block text-center text-xs text-green-600">Owned</span>}
                        {!owned && canUnlock && theme.purchaseCost === 0 && <span className="block text-center text-xs text-green-600">Free</span>}
                        {!owned && canUnlock && theme.purchaseCost > 0 && <span className="block text-center text-xs text-amber-600 font-medium">{theme.purchaseCost} pts</span>}
                        {!owned && !canUnlock && (
                          <span className="block text-center text-xs text-gray-400 flex items-center justify-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" /> {theme.unlockPointsRequired} pts
                          </span>
                        )}
                      </div>

                      <button
                        onClick={e => { e.stopPropagation(); openPreview({ type: 'color', id: theme.id }); }}
                        className="absolute top-2 right-2 p-1 rounded-full bg-white/80 hover:bg-white shadow-sm text-gray-400 hover:text-gray-600 transition-colors"
                        title="Preview"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* Info footer */}
      <Card className="p-4 bg-amber-50 border-amber-200">
        <p className="text-xs text-amber-700">
          <strong>How points work:</strong> Your <em>Total Points</em> determine leaderboard rank and never decrease. <em>Spendable Points</em> are used to buy items here — purchases don't affect your rank.
        </p>
      </Card>

      {/* Preview modal */}
      <AnimatePresence>
        {preview && (
          <PreviewModal
            key={`${preview.type}-${preview.id}`}
            target={preview}
            onClose={closePreview}
            {...modalProps}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Featured card ─────────────────────────────────────────────────────────────

function FeaturedCard({
  type, item, owned, isSeasonal, seasonalEndDate, settings, mood, onPreview,
}: {
  type: 'animal' | 'accessory' | 'color';
  item: { id: string; name: string; rarity: ItemRarity; purchaseCost: number; unlockPointsRequired: number };
  owned: boolean;
  isSeasonal: boolean;
  seasonalEndDate?: string;
  settings: { equippedAnimalId: string; equippedAccessoryIds: string[]; equippedColorId: string | null };
  mood: ReturnType<typeof getMoodFromPoints>;
  onPreview: () => void;
}) {
  const previewAnimalId  = type === 'animal'    ? item.id : settings.equippedAnimalId;
  const previewAccessIds = type === 'accessory'  ? [item.id] : settings.equippedAccessoryIds;
  const previewColorId   = type === 'color'      ? item.id : settings.equippedColorId;

  const daysLeft = seasonalEndDate
    ? Math.max(0, Math.ceil((new Date(seasonalEndDate + 'T23:59:59').getTime() - Date.now()) / 86400000))
    : null;

  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Card
        className={cn(
          'p-4 flex flex-col items-center gap-2 cursor-pointer relative transition-all',
          RARITY[item.rarity].border,
          item.rarity !== 'common' ? `shadow-sm ${RARITY[item.rarity].glow}` : '',
        )}
        onClick={onPreview}
      >
        {/* Seasonal badge */}
        {isSeasonal && (
          <div className="absolute top-2 left-2 flex items-center gap-0.5 bg-teal-100 text-teal-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            <Clock className="w-2.5 h-2.5" />
            {daysLeft !== null ? `${daysLeft}d left` : 'Limited'}
          </div>
        )}

        <AnimalAvatar
          animalId={previewAnimalId}
          mood={owned ? mood : 1}
          colorThemeId={previewColorId}
          accessoryIds={previewAccessIds}
          size={88}
          animated
          showMoodBg={false}
        />

        <div className="text-center space-y-1">
          <p className="font-bold text-gray-800 text-sm">{item.name}</p>
          <RarityBadge rarity={item.rarity} size="xs" />
        </div>

        <div className="text-xs text-center">
          {owned
            ? <span className="text-green-600 font-medium">Owned ✓</span>
            : item.purchaseCost === 0
            ? <span className="text-green-600">Free to unlock</span>
            : <span className="text-amber-600 font-medium">{item.purchaseCost} pts</span>}
        </div>

        <button className="absolute top-2 right-2 p-1 rounded-full bg-white/80 hover:bg-white shadow-sm text-gray-400 hover:text-gray-600"
          title="Preview">
          <Eye className="w-3 h-3" />
        </button>
      </Card>
    </motion.div>
  );
}
