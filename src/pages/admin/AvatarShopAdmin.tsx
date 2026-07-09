import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Sparkles, Star, Palette, Eye, EyeOff, Zap, Clock, Save, RotateCcw } from 'lucide-react';
import { useAvatar } from '../../contexts/AvatarContext';
import { AnimalAvatar } from '../../components/avatar/AnimalAvatar';
import { AVATAR_ANIMALS, AVATAR_ACCESSORIES, AVATAR_COLOR_THEMES } from '../../lib/avatarData';
import { type ItemRarity, type AvatarShopItemOverride } from '../../types/avatar';
import { Card, Button, toast } from '../../components/ui';
import { cn } from '../../lib/utils';

type AdminTab = 'animals' | 'accessories' | 'colors';

const RARITY_CHIP: Record<ItemRarity, string> = {
  common:    'bg-gray-100 text-gray-600',
  rare:      'bg-blue-100 text-blue-700',
  epic:      'bg-purple-100 text-purple-700',
  legendary: 'bg-amber-100 text-amber-700',
  seasonal:  'bg-teal-100 text-teal-700',
  special:   'bg-fuchsia-100 text-fuchsia-700',
};

// ── Validation helper ─────────────────────────────────────────────────────────

function parsePointsInput(str: string): { value: number | undefined; error: string } {
  if (str.trim() === '') return { value: undefined, error: '' }; // empty = use default
  if (!/^\d+$/.test(str.trim())) return { value: undefined, error: 'Must be a whole number (no decimals or letters)' };
  const n = parseInt(str.trim(), 10);
  if (n > 10_000) return { value: undefined, error: 'Cannot exceed 10,000 pts' };
  return { value: n, error: '' };
}

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
  const [isFeatured, setIsFeatured]   = useState(override?.isFeatured ?? false);
  const [isSeasonal, setIsSeasonal]   = useState(override?.isSeasonal ?? false);
  const [isHidden, setIsHidden]       = useState(override?.isHidden ?? false);
  const [seasonalEndDate, setSeasonalEndDate] = useState(override?.seasonalEndDate ?? '');

  // Price override inputs (empty string = use hardcoded default)
  const [customPriceStr, setCustomPriceStr]   = useState(
    override?.customPrice !== undefined ? String(override.customPrice) : ''
  );
  const [customUnlockStr, setCustomUnlockStr] = useState(
    override?.customUnlockPoints !== undefined ? String(override.customUnlockPoints) : ''
  );
  const [priceError, setPriceError]   = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [dirty, setDirty] = useState(false);

  const mark = (fn: () => void) => { fn(); setDirty(true); };

  const effectivePrice  = customPriceStr  !== '' && !priceError  ? Number(customPriceStr)  : baseCost;
  const effectiveUnlock = customUnlockStr !== '' && !unlockError ? Number(customUnlockStr) : baseUnlock;

  const handleSave = () => {
    const priceResult  = parsePointsInput(customPriceStr);
    const unlockResult = parsePointsInput(customUnlockStr);

    if (priceResult.error)  { setPriceError(priceResult.error);   return; }
    if (unlockResult.error) { setUnlockError(unlockResult.error); return; }

    const updated: AvatarShopItemOverride = {
      itemId, itemType,
      isFeatured, isSeasonal, isHidden,
      customPrice:        priceResult.value,
      customUnlockPoints: unlockResult.value,
      seasonalEndDate: isSeasonal && seasonalEndDate ? seasonalEndDate : undefined,
      updatedAt: new Date().toISOString(),
    };
    onSave(updated);
    setDirty(false);
    toast.success(`${itemName} saved`);
  };

  const handleResetPrice = () => {
    mark(() => { setCustomPriceStr(''); setPriceError(''); });
  };
  const handleResetUnlock = () => {
    mark(() => { setCustomUnlockStr(''); setUnlockError(''); });
  };

  return (
    <Card className={cn(
      'p-4 space-y-3 transition-all',
      isHidden ? 'opacity-60' : '',
      dirty ? 'border-amber-300 ring-1 ring-amber-200' : '',
    )}>
      {/* Preview + name row */}
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
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-800 text-sm truncate">{itemName}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', RARITY_CHIP[baseRarity])}>
              {baseRarity}
            </span>
            <span className={cn(
              'flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
              isHidden ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600',
            )}>
              {isHidden ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
              {isHidden ? 'Hidden' : 'Visible'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Price overrides ─────────────────────────────────────────────────── */}
      <div className="space-y-2 pt-2 border-t border-gray-100">
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Price controls</p>

        {/* Buy price */}
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <label className="text-xs text-gray-500">
              Buy price — default: <span className="font-medium">{baseCost === 0 ? 'Free' : `${baseCost} pts`}</span>
            </label>
            {customPriceStr !== '' && (
              <button
                type="button"
                onClick={handleResetPrice}
                className="flex items-center gap-0.5 text-[10px] text-gray-400 hover:text-gray-600"
                title="Reset to default"
              >
                <RotateCcw className="w-2.5 h-2.5" /> reset
              </button>
            )}
          </div>
          <input
            type="number"
            min="0"
            max="10000"
            step="1"
            placeholder={baseCost === 0 ? '0 (free)' : String(baseCost)}
            value={customPriceStr}
            onChange={e => mark(() => { setCustomPriceStr(e.target.value); setPriceError(''); })}
            className={cn(
              'w-full text-xs border rounded-lg px-2 py-1.5 focus:outline-none',
              priceError
                ? 'border-red-300 focus:border-red-400 bg-red-50'
                : 'border-gray-200 focus:border-amber-400',
            )}
          />
          {priceError && <p className="text-[10px] text-red-500 mt-0.5">{priceError}</p>}
          {!priceError && customPriceStr !== '' && (
            <p className="text-[10px] text-amber-600 mt-0.5">
              Custom price: <strong>{effectivePrice} pts</strong>
              {effectivePrice === 0 && ' (free)'}
            </p>
          )}
        </div>

        {/* Unlock threshold */}
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <label className="text-xs text-gray-500">
              Unlock threshold — default: <span className="font-medium">{baseUnlock === 0 ? 'None' : `${baseUnlock} pts`}</span>
            </label>
            {customUnlockStr !== '' && (
              <button
                type="button"
                onClick={handleResetUnlock}
                className="flex items-center gap-0.5 text-[10px] text-gray-400 hover:text-gray-600"
                title="Reset to default"
              >
                <RotateCcw className="w-2.5 h-2.5" /> reset
              </button>
            )}
          </div>
          <input
            type="number"
            min="0"
            max="10000"
            step="1"
            placeholder={baseUnlock === 0 ? '0 (no threshold)' : String(baseUnlock)}
            value={customUnlockStr}
            onChange={e => mark(() => { setCustomUnlockStr(e.target.value); setUnlockError(''); })}
            className={cn(
              'w-full text-xs border rounded-lg px-2 py-1.5 focus:outline-none',
              unlockError
                ? 'border-red-300 focus:border-red-400 bg-red-50'
                : 'border-gray-200 focus:border-amber-400',
            )}
          />
          {unlockError && <p className="text-[10px] text-red-500 mt-0.5">{unlockError}</p>}
          {!unlockError && customUnlockStr !== '' && (
            <p className="text-[10px] text-blue-600 mt-0.5">
              Custom threshold: <strong>{effectiveUnlock} total pts</strong>
            </p>
          )}
        </div>
      </div>

      {/* ── Visibility / feature toggles ───────────────────────────────────── */}
      <div className="space-y-2 pt-2 border-t border-gray-100">
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Visibility &amp; flags</p>

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
            {isHidden ? 'Hidden from participant shop' : 'Hide from participant shop'}
          </div>
        </label>
      </div>

      {/* Save button */}
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
          Control prices, visibility, and featured status for every shop item.
        </p>
      </div>

      {/* Info banner */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-xs text-blue-700">
          <strong>How it works:</strong> Leave price fields blank to use the hardcoded default. Enter a custom value to override. Set price to 0 to make an item free. Hidden items are invisible to participants but remain in their inventory if already owned. Changes sync to Supabase and apply immediately for all participants.
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
