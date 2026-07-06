import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ShoppingBag, Palette, Check, Lock, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAvatar } from '../../contexts/AvatarContext';
import { AnimalAvatar, MoodIndicator } from '../../components/avatar/AnimalAvatar';
import { AVATAR_ANIMALS, AVATAR_ACCESSORIES, AVATAR_COLOR_THEMES } from '../../lib/avatarData';
import { getMoodFromPoints } from '../../types/avatar';
import { Card, Button, toast } from '../../components/ui';
import { cn } from '../../lib/utils';

type TabId = 'animals' | 'accessories' | 'colors';

export function AvatarPage() {
  const { t } = useTranslation();
  const {
    settings, spendablePoints, totalEarnedPoints, loading,
    ownsAnimal, ownsAccessory, ownsColor,
    canUnlockAnimal, canUnlockAccessory, canUnlockColor,
    equipAnimal, toggleAccessory, equipColor,
    purchaseAnimal, purchaseAccessory, purchaseColor,
  } = useAvatar();
  const [tab, setTab] = useState<TabId>('animals');
  const [previewAnimalId, setPreviewAnimalId] = useState<string | null>(null);

  if (loading || !settings) {
    return <div className="flex items-center justify-center h-64 text-gray-400">{t('common.loading')}</div>;
  }

  const displayAnimalId = previewAnimalId ?? settings.equippedAnimalId;
  const mood = getMoodFromPoints(totalEarnedPoints);

  const handleBuyAnimal = (id: string) => {
    const result = purchaseAnimal(id);
    if (result.success) {
      toast.success('Animal unlocked! 🎉 Equip it now!');
    } else {
      toast.error(result.error ?? 'Cannot purchase');
    }
  };

  const handleBuyAccessory = (id: string) => {
    const result = purchaseAccessory(id);
    if (result.success) toast.success('Accessory unlocked! 🎉');
    else toast.error(result.error ?? 'Cannot purchase');
  };

  const handleBuyColor = (id: string) => {
    const result = purchaseColor(id);
    if (result.success) toast.success('Color theme unlocked! 🎉');
    else toast.error(result.error ?? 'Cannot purchase');
  };

  const tabs: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
    { id: 'animals',     label: 'Animals',     icon: <Sparkles className="w-4 h-4" /> },
    { id: 'accessories', label: 'Accessories', icon: <Star className="w-4 h-4" /> },
    { id: 'colors',      label: 'Colors',      icon: <Palette className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-purple-500" />
          My Character
        </h1>
        <p className="text-gray-500 text-sm mt-1">Choose and customize your animal avatar</p>
      </div>

      {/* Wallet strip */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2">
          <span className="text-blue-600 font-bold text-lg">{totalEarnedPoints}</span>
          <span className="text-blue-500 text-sm">Total Earned Points</span>
        </div>
        <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl px-4 py-2">
          <ShoppingBag className="w-4 h-4 text-purple-500" />
          <span className="text-purple-600 font-bold text-lg">{spendablePoints}</span>
          <span className="text-purple-500 text-sm">Spendable Points</span>
        </div>
        <div className="flex items-center gap-2">
          <MoodIndicator mood={mood} points={totalEarnedPoints} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar preview panel */}
        <div className="lg:col-span-1">
          <Card className="p-6 text-center sticky top-4">
            <h2 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">Your Avatar</h2>

            <div className="flex justify-center mb-4">
              <AnimalAvatar
                animalId={displayAnimalId}
                mood={mood}
                colorThemeId={settings.equippedColorId}
                accessoryIds={settings.equippedAccessoryIds}
                size={180}
                animated
              />
            </div>

            <p className="font-bold text-gray-800 text-lg capitalize">
              {AVATAR_ANIMALS.find(a => a.id === displayAnimalId)?.name ?? displayAnimalId}
            </p>
            {previewAnimalId && previewAnimalId !== settings.equippedAnimalId && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-gray-400 italic">Previewing...</p>
                {ownsAnimal(previewAnimalId) && (
                  <Button size="sm" className="w-full" onClick={() => { equipAnimal(previewAnimalId); setPreviewAnimalId(null); }}>
                    <Check className="w-3.5 h-3.5" /> Equip This Animal
                  </Button>
                )}
                <Button variant="secondary" size="sm" className="w-full" onClick={() => setPreviewAnimalId(null)}>
                  Cancel Preview
                </Button>
              </div>
            )}

            {/* Active accessories */}
            {settings.equippedAccessoryIds.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1 justify-center">
                {settings.equippedAccessoryIds.map(id => {
                  const acc = AVATAR_ACCESSORIES.find(a => a.id === id);
                  return (
                    <button key={id} onClick={() => toggleAccessory(id)}
                      className="text-xs bg-gray-100 hover:bg-red-50 hover:text-red-500 px-2 py-0.5 rounded-full transition-colors"
                      title="Click to remove"
                    >
                      {acc?.emoji} {acc?.name} ×
                    </button>
                  );
                })}
              </div>
            )}

            {settings.equippedColorId && settings.equippedColorId !== 'default' && (
              <div className="mt-2">
                <button onClick={() => equipColor(null)}
                  className="text-xs bg-gray-100 hover:bg-red-50 hover:text-red-500 px-2 py-0.5 rounded-full transition-colors"
                  title="Remove color theme"
                >
                  🎨 {AVATAR_COLOR_THEMES.find(c => c.id === settings.equippedColorId)?.name} ×
                </button>
              </div>
            )}
          </Card>
        </div>

        {/* Selection panel */}
        <div className="lg:col-span-2">
          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                  tab === t.id ? 'bg-purple-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-purple-50'
                )}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>

              {/* ── ANIMALS ── */}
              {tab === 'animals' && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {AVATAR_ANIMALS.map(animal => {
                    const owned = ownsAnimal(animal.id);
                    const canUnlock = canUnlockAnimal(animal.id);
                    const isEquipped = settings.equippedAnimalId === animal.id;
                    const isPreviewing = previewAnimalId === animal.id;
                    const isFree = animal.purchaseCost === 0;
                    const needsPoints = !canUnlock;

                    return (
                      <motion.div key={animal.id} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                        <button
                          onClick={() => {
                            if (owned) {
                              setPreviewAnimalId(isPreviewing ? null : animal.id);
                            } else if (!needsPoints && isFree) {
                              equipAnimal(animal.id); // auto-unlock free milestone items
                              setPreviewAnimalId(null);
                            }
                          }}
                          className={cn(
                            'w-full rounded-2xl border-2 p-3 transition-all relative overflow-hidden',
                            isEquipped ? 'border-purple-500 bg-purple-50 shadow-md' :
                            isPreviewing ? 'border-blue-400 bg-blue-50' :
                            owned ? 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/50' :
                            'border-gray-100 bg-gray-50 cursor-not-allowed opacity-75',
                          )}
                        >
                          {/* Animal SVG preview */}
                          <div className="flex justify-center mb-2">
                            <AnimalAvatar
                              animalId={animal.id}
                              mood={owned ? mood : 0}
                              size={64}
                              animated={false}
                              showMoodBg={false}
                            />
                          </div>
                          <p className="text-xs font-semibold text-gray-700 truncate">{animal.name}</p>

                          {/* Status badge */}
                          <div className="mt-1">
                            {isEquipped && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">Equipped</span>
                            )}
                            {!owned && !needsPoints && isFree && (
                              <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Free ✓</span>
                            )}
                            {!owned && !needsPoints && !isFree && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">{animal.purchaseCost} pts</span>
                            )}
                            {needsPoints && (
                              <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 justify-center">
                                <Lock className="w-2.5 h-2.5" /> {animal.unlockPointsRequired} pts
                              </span>
                            )}
                          </div>

                          {/* Lock overlay */}
                          {!owned && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              {needsPoints && (
                                <div className="absolute bottom-1 end-1 bg-gray-800/70 rounded-full p-0.5">
                                  <Lock className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                          )}
                        </button>

                        {/* Buy button */}
                        {!owned && canUnlock && !isFree && (
                          <Button size="sm" className="w-full mt-1 text-xs py-1" onClick={() => handleBuyAnimal(animal.id)}
                            disabled={spendablePoints < animal.purchaseCost}>
                            Buy {animal.purchaseCost} pts
                          </Button>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* ── ACCESSORIES ── */}
              {tab === 'accessories' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {AVATAR_ACCESSORIES.map(acc => {
                    const owned = ownsAccessory(acc.id);
                    const equipped = settings.equippedAccessoryIds.includes(acc.id);
                    const canUnlock = canUnlockAccessory(acc.id);
                    const needsPoints = !canUnlock;
                    const isFree = acc.purchaseCost === 0;

                    return (
                      <div key={acc.id} className={cn(
                        'rounded-2xl border-2 p-4 transition-all',
                        equipped ? 'border-purple-500 bg-purple-50' :
                        owned ? 'border-gray-200 bg-white hover:border-purple-200' :
                        'border-gray-100 bg-gray-50 opacity-75',
                      )}>
                        <div className="text-4xl text-center mb-2">{acc.emoji}</div>
                        <p className="text-xs font-semibold text-gray-700 text-center">{acc.name}</p>
                        <p className="text-xs text-gray-400 text-center capitalize mt-0.5">{acc.category}</p>

                        <div className="mt-3 space-y-1">
                          {owned ? (
                            <Button size="sm" variant={equipped ? 'secondary' : 'primary'} className="w-full text-xs py-1"
                              onClick={() => toggleAccessory(acc.id)}>
                              {equipped ? 'Remove' : 'Equip'}
                            </Button>
                          ) : needsPoints ? (
                            <div className="text-center text-xs text-gray-500 flex items-center justify-center gap-1">
                              <Lock className="w-3 h-3" /> {acc.unlockPointsRequired} pts to unlock
                            </div>
                          ) : isFree ? (
                            <span className="block text-center text-xs text-green-600">Unlocked at {acc.unlockPointsRequired} pts</span>
                          ) : (
                            <Button size="sm" className="w-full text-xs py-1" onClick={() => handleBuyAccessory(acc.id)}
                              disabled={spendablePoints < acc.purchaseCost}>
                              Buy {acc.purchaseCost} pts
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── COLORS ── */}
              {tab === 'colors' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {AVATAR_COLOR_THEMES.map(theme => {
                    const owned = ownsColor(theme.id);
                    const equipped = settings.equippedColorId === theme.id;
                    const canUnlock = canUnlockColor(theme.id);
                    const needsPoints = !canUnlock;
                    const isFree = theme.purchaseCost === 0;
                    const isDefault = theme.id === 'default';

                    return (
                      <div key={theme.id} className={cn(
                        'rounded-2xl border-2 p-4 transition-all text-center',
                        equipped ? 'border-purple-500 bg-purple-50' :
                        owned ? 'border-gray-200 bg-white hover:border-purple-200' :
                        'border-gray-100 bg-gray-50 opacity-75',
                      )}>
                        {/* Color preview swatch */}
                        <div className="flex justify-center gap-1 mb-3">
                          {isDefault ? (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-300 to-amber-400 border border-gray-200" />
                          ) : (
                            <>
                              <div className="w-6 h-6 rounded-full border border-gray-200" style={{ background: theme.primary }} />
                              <div className="w-6 h-6 rounded-full border border-gray-200" style={{ background: theme.secondary }} />
                              <div className="w-6 h-6 rounded-full border border-gray-200" style={{ background: theme.accent }} />
                            </>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-gray-700">{theme.name}</p>

                        <div className="mt-3 space-y-1">
                          {owned ? (
                            <Button size="sm" variant={equipped ? 'secondary' : 'primary'} className="w-full text-xs py-1"
                              onClick={() => equipColor(equipped ? null : theme.id)}>
                              {equipped ? 'Remove' : 'Apply'}
                            </Button>
                          ) : needsPoints ? (
                            <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
                              <Lock className="w-3 h-3" /> {theme.unlockPointsRequired} pts
                            </div>
                          ) : isFree ? (
                            <span className="text-xs text-green-600">Unlocked at {theme.unlockPointsRequired} pts</span>
                          ) : (
                            <Button size="sm" className="w-full text-xs py-1" onClick={() => handleBuyColor(theme.id)}
                              disabled={spendablePoints < theme.purchaseCost}>
                              Buy {theme.purchaseCost} pts
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Info note about spendable points */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
        <strong>How points work:</strong> Your <em>Total Earned Points</em> determine your leaderboard rank and never decrease. Your <em>Spendable Points</em> are used for purchases here — buying items reduces your spendable balance but does NOT affect your ranking.
      </div>
    </div>
  );
}
