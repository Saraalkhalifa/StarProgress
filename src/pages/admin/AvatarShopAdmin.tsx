import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Sparkles, Star, Palette, Eye, EyeOff, Zap, Clock, Save } from 'lucide-react';
import { useAvatar } from '../../contexts/AvatarContext';
import { AnimalAvatar } from '../../components/avatar/AnimalAvatar';
import { AVATAR_ANIMALS, AVATAR_ACCESSORIES, AVATAR_COLOR_THEMES } from '../../lib/avatarData';
import { type ItemRarity, type AvatarShopItemOverride } from '../../types/avatar';
import { Card, Button, toast } from '../../components/ui';
import { cn } from '../../lib/utils';

type AdminTab = 'animals' | 'accessories' | 'colors';

const RARITY_OPTIONS: ItemRarity[] = ['common', 'rare', 'epic', 'legendary', 'seasonal', 'special'];

const RARITY_CHIP: Record<ItemRarity, string> = {
  common:    'bg-gray-100 text-gray-600',
  rare:      'bg-blue-100 text-blue-700',
  epic:      'bg-purple-100 text-purple-700',
  legendary: 'bg-amber-100 text-amber-700',
  seasonal:  'bg-teal-100 text-teal-700',
  special:   'bg-fuchsia-100 text-fuchsia-700',
};

// ── Per-item editor card ──────────────────────────────────────────────────────

interface ItemEditorProps {
  itemType: 'animal' | 'accessory' | 'color';
  itemId: string;
  itemName: string;
  baseRarity: ItemRarity;
  baseCost: number;
  baseUnlock: number;
  previewAnimalId?: string;
  previewAccessIds?: string[];
  previewColorId?: string | null;
  override: AvatarShopItemOverride | null;
  onSave: (override: AvatarShopItemOverride) => void;
}

function ItemEditorCard({
  itemType, itemId, itemName, baseRarity, baseCost, baseUnlock,
  previewAnimalId = 'cat',
  previewAccessIds = [],
  previewColorId = null,
  override, onSave,
}: ItemEditorProps) {
  const [isFeatured, setIsFeatured]         = useState(override?.isFeatured ?? false);
  const [isSeasonal, setIsSeasonal]         = useState(override?.isSeasonal ?? false);
  const [isHidden, setIsHidden]             = useState(override?.isHidden ?? false);
  const [seasonalEndDate, setSeasonalEndDate] = useState(override?.seasonalEndDate ?? '');
  const [dirty, setDirty] = useState(false);

  const mark = (fn: () => void) => { fn(); setDirty(true); };

  const handleSave = () => {
    const updated: AvatarShopItemOverride = {
      itemId, itemType,
      isFeatured, isSeasonal, isHidden,
      seasonalEndDate: isSeasonal && seasonalEndDate ? seasonalEndDate : undefined,
      updatedAt: new Date().toISOString(),
    };
    onSave(updated);
    setDirty(false);
    toast.success(`${itemName} updated`);
  };

  return (
    <Card className={cn(
      'p-4 space-y-3 transition-all',
      isHidden ? 'opacity-60' : '',
      dirty ? 'border-amber-300 ring-1 ring-amber-200' : '',
    )}>
      {/* Preview + name */}
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <AnimalAvatar
            animalId={previewAnimalId}
            mood={2}
            colorThemeId={previewColorId}
            accessoryIds={previewAccessIds}
            size={52}
            animated={false}
            showMoodBg={false}
          />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-800 text-sm truncate">{itemName}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', RARITY_CHIP[baseRarity])}>
              {baseRarity}
            </span>
            {baseCost > 0 && <span className="text-[10px] text-amber-600">{baseCost} pts</span>}
            {baseUnlock > 0 && <span className="text-[10px] text-gray-400">unlock at {baseUnlock}</span>}
          </div>
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={e => mark(() => setIsFeatured(e.target.checked))}
            className="w-3.5 h-3.5 rounded accent-amber-500"
          />
          <div className="flex items-center gap-1 text-xs text-gray-600 group-hover:text-gray-800">
            <Zap className="w-3 h-3 text-amber-500" />
            Featured in shop
          </div>
        </label>

        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={isSeasonal}
            onChange={e => mark(() => setIsSeasonal(e.target.checked))}
            className="w-3.5 h-3.5 rounded accent-teal-500"
          />
          <div className="flex items-center gap-1 text-xs text-gray-600 group-hover:text-gray-800">
            <Clock className="w-3 h-3 text-teal-500" />
            Seasonal / Limited
          </div>
        </label>

        {isSeasonal && (
          <div className="ps-5">
            <label className="text-xs text-gray-500 block mb-1">End date (leave blank = no expiry)</label>
            <input
              type="date"
              value={seasonalEndDate}
              onChange={e => mark(() => setSeasonalEndDate(e.target.value))}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-teal-400"
            />
          </div>
        )}

        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={isHidden}
            onChange={e => mark(() => setIsHidden(e.target.checked))}
            className="w-3.5 h-3.5 rounded accent-red-500"
          />
          <div className="flex items-center gap-1 text-xs text-gray-600 group-hover:text-gray-800">
            {isHidden ? <EyeOff className="w-3 h-3 text-red-400" /> : <Eye className="w-3 h-3 text-gray-400" />}
            Hidden (remove from shop)
          </div>
        </label>
      </div>

      {/* Save */}
      {dirty && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
          <Button size="sm" className="w-full text-xs" onClick={handleSave}>
            <Save className="w-3 h-3" /> Save changes
          </Button>
        </motion.div>
      )}
    </Card>
  );
}

// ── Main admin page ───────────────────────────────────────────────────────────

export function AvatarShopAdmin() {
  const { getItemOverride, saveItemOverride, settings } = useAvatar();
  const [tab, setTab] = useState<AdminTab>('animals');

  const equippedAnimal = settings?.equippedAnimalId ?? 'cat';
  const equippedColor  = settings?.equippedColorId ?? null;

  const tabs = [
    { id: 'animals'     as AdminTab, label: 'Animals',     icon: <Sparkles className="w-4 h-4" />, count: AVATAR_ANIMALS.length },
    { id: 'accessories' as AdminTab, label: 'Accessories', icon: <Star className="w-4 h-4" />,      count: AVATAR_ACCESSORIES.length },
    { id: 'colors'      as AdminTab, label: 'Colors',      icon: <Palette className="w-4 h-4" />,   count: AVATAR_COLOR_THEMES.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ShoppingBag className="w-7 h-7 text-amber-500" />
          Avatar Shop — Admin
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Mark items as featured, seasonal, or hidden. Changes apply immediately for all participants.
        </p>
      </div>

      {/* Info banner */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-xs text-blue-700">
          <strong>Note:</strong> Rarity, prices, and unlock requirements are set in code. Use these controls to feature items in the shop, mark them as limited-time seasonal drops, or temporarily hide them. Hidden items remain owned if already purchased.
        </p>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all',
              tab === t.id ? 'bg-amber-500 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-amber-50',
            )}
          >
            {t.icon} {t.label}
            <span className={cn('text-xs px-1.5 py-0.5 rounded-full', tab === t.id ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500')}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Animals */}
      {tab === 'animals' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {AVATAR_ANIMALS.map(animal => (
            <ItemEditorCard
              key={animal.id}
              itemType="animal"
              itemId={animal.id}
              itemName={`${animal.name} (${animal.nameAr})`}
              baseRarity={animal.rarity}
              baseCost={animal.purchaseCost}
              baseUnlock={animal.unlockPointsRequired}
              previewAnimalId={animal.id}
              previewColorId={equippedColor}
              override={getItemOverride('animal', animal.id)}
              onSave={saveItemOverride}
            />
          ))}
        </div>
      )}

      {/* Accessories */}
      {tab === 'accessories' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {AVATAR_ACCESSORIES.map(acc => (
            <ItemEditorCard
              key={acc.id}
              itemType="accessory"
              itemId={acc.id}
              itemName={`${acc.name} (${acc.nameAr})`}
              baseRarity={acc.rarity}
              baseCost={acc.purchaseCost}
              baseUnlock={acc.unlockPointsRequired}
              previewAnimalId={equippedAnimal}
              previewAccessIds={[acc.id]}
              previewColorId={equippedColor}
              override={getItemOverride('accessory', acc.id)}
              onSave={saveItemOverride}
            />
          ))}
        </div>
      )}

      {/* Colors */}
      {tab === 'colors' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {AVATAR_COLOR_THEMES.map(theme => (
            <ItemEditorCard
              key={theme.id}
              itemType="color"
              itemId={theme.id}
              itemName={`${theme.name} (${theme.nameAr})`}
              baseRarity={theme.rarity}
              baseCost={theme.purchaseCost}
              baseUnlock={theme.unlockPointsRequired}
              previewAnimalId={equippedAnimal}
              previewColorId={theme.id}
              override={getItemOverride('color', theme.id)}
              onSave={saveItemOverride}
            />
          ))}
        </div>
      )}
    </div>
  );
}
