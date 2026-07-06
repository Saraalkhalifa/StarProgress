import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Lock, CheckCircle, Star, Sparkles } from 'lucide-react';
import { useAvatar } from '../../contexts/AvatarContext';
import { AnimalAvatar } from '../../components/avatar/AnimalAvatar';
import { AVATAR_ANIMALS, AVATAR_ACCESSORIES, AVATAR_COLOR_THEMES } from '../../lib/avatarData';
import { getMoodFromPoints } from '../../types/avatar';
import { Card, Button, toast } from '../../components/ui';
import { cn } from '../../lib/utils';

type ShopTab = 'animals' | 'accessories' | 'colors';

function ItemStatusBadge({ owned, needsPoints, threshold, cost, isFree }: {
  owned: boolean; needsPoints: boolean; threshold: number; cost: number; isFree: boolean;
}) {
  if (owned) return <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-0.5"><CheckCircle className="w-3 h-3" /> Owned</span>;
  if (needsPoints) return <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex items-center gap-0.5"><Lock className="w-3 h-3" /> {threshold} pts</span>;
  if (isFree && threshold > 0) return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Free at {threshold} pts</span>;
  if (isFree) return <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Free</span>;
  return <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">{cost} pts</span>;
}

export function AvatarShop() {
  const {
    settings, spendablePoints, totalEarnedPoints,
    ownsAnimal, ownsAccessory, ownsColor,
    canUnlockAnimal, canUnlockAccessory, canUnlockColor,
    purchaseAnimal, purchaseAccessory, purchaseColor,
    equipAnimal, toggleAccessory, equipColor,
  } = useAvatar();
  const [tab, setTab] = useState<ShopTab>('animals');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const mood = getMoodFromPoints(totalEarnedPoints);

  if (!settings) return null;

  const handleBuy = (type: ShopTab, id: string) => {
    let result: { success: boolean; error?: string };
    if (type === 'animals') result = purchaseAnimal(id);
    else if (type === 'accessories') result = purchaseAccessory(id);
    else result = purchaseColor(id);

    if (result.success) {
      toast.success('🎉 Purchased successfully!');
      // Auto-equip on purchase
      if (type === 'animals') { equipAnimal(id); setPreviewId(null); }
      else if (type === 'accessories') toggleAccessory(id);
      else equipColor(id);
    } else {
      toast.error(result.error ?? 'Purchase failed');
    }
  };

  const tabs: Array<{ id: ShopTab; label: string; icon: React.ReactNode; count: number }> = [
    { id: 'animals', label: 'Animals', icon: <Sparkles className="w-4 h-4" />,
      count: AVATAR_ANIMALS.filter(a => !ownsAnimal(a.id)).length },
    { id: 'accessories', label: 'Accessories', icon: <Star className="w-4 h-4" />,
      count: AVATAR_ACCESSORIES.filter(a => !ownsAccessory(a.id)).length },
    { id: 'colors', label: 'Colors', icon: <ShoppingBag className="w-4 h-4" />,
      count: AVATAR_COLOR_THEMES.filter(c => !ownsColor(c.id)).length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ShoppingBag className="w-7 h-7 text-amber-500" />
            Avatar Shop
          </h1>
          <p className="text-gray-500 text-sm mt-1">Unlock new animals, accessories, and color themes</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2">
            <Star className="w-4 h-4 text-blue-500" />
            <span className="font-bold text-blue-700">{totalEarnedPoints}</span>
            <span className="text-xs text-blue-500">total</span>
          </div>
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
            <ShoppingBag className="w-4 h-4 text-amber-500" />
            <span className="font-bold text-amber-700">{spendablePoints}</span>
            <span className="text-xs text-amber-500">spendable</span>
          </div>
        </div>
      </div>

      {/* Shop tabs */}
      <div className="flex gap-2">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all relative',
              tab === t.id ? 'bg-amber-500 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-amber-50'
            )}
          >
            {t.icon} {t.label}
            {t.count > 0 && (
              <span className="absolute -top-1.5 -end-1.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Preview panel (animals tab) */}
      {tab === 'animals' && previewId && (
        <Card className="p-4 flex items-center gap-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <AnimalAvatar animalId={previewId} mood={mood} size={80} animated />
          <div>
            <p className="font-bold text-gray-800 capitalize">{AVATAR_ANIMALS.find(a => a.id === previewId)?.name}</p>
            <p className="text-sm text-gray-500 mt-0.5">{AVATAR_ANIMALS.find(a => a.id === previewId)?.description}</p>
          </div>
          <button onClick={() => setPreviewId(null)} className="ms-auto text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </Card>
      )}

      {/* Shop grid */}
      {tab === 'animals' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {AVATAR_ANIMALS.map(animal => {
            const owned = ownsAnimal(animal.id);
            const canUnlock = canUnlockAnimal(animal.id);
            const needsPoints = !canUnlock;
            const isFree = animal.purchaseCost === 0;
            const isEquipped = settings.equippedAnimalId === animal.id;

            return (
              <motion.div key={animal.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card className={cn(
                  'p-4 text-center transition-all cursor-pointer',
                  owned ? 'border-green-200' : needsPoints ? 'opacity-65' : 'border-amber-200 hover:border-amber-400',
                  isEquipped && 'ring-2 ring-purple-400',
                )}
                  onClick={() => setPreviewId(previewId === animal.id ? null : animal.id)}>
                  <div className="flex justify-center mb-3">
                    <AnimalAvatar
                      animalId={animal.id}
                      mood={owned ? mood : 0}
                      size={72}
                      animated={!needsPoints}
                      showMoodBg={false}
                    />
                  </div>
                  <p className="font-semibold text-gray-800 text-sm">{animal.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5 mb-3 line-clamp-2">{animal.description}</p>

                  <div className="flex justify-center mb-3">
                    <ItemStatusBadge
                      owned={owned}
                      needsPoints={needsPoints}
                      threshold={animal.unlockPointsRequired}
                      cost={animal.purchaseCost}
                      isFree={isFree}
                    />
                  </div>

                  {!owned && canUnlock && !isFree && (
                    <Button size="sm" className="w-full text-xs"
                      disabled={spendablePoints < animal.purchaseCost}
                      onClick={e => { e.stopPropagation(); handleBuy('animals', animal.id); }}>
                      Buy for {animal.purchaseCost} pts
                    </Button>
                  )}
                  {owned && !isEquipped && (
                    <Button variant="secondary" size="sm" className="w-full text-xs"
                      onClick={e => { e.stopPropagation(); equipAnimal(animal.id); }}>
                      Equip
                    </Button>
                  )}
                  {isEquipped && (
                    <span className="block text-xs text-purple-600 font-semibold mt-1">✓ Equipped</span>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {tab === 'accessories' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {AVATAR_ACCESSORIES.map(acc => {
            const owned = ownsAccessory(acc.id);
            const equipped = settings.equippedAccessoryIds.includes(acc.id);
            const canUnlock = canUnlockAccessory(acc.id);
            const needsPoints = !canUnlock;
            const isFree = acc.purchaseCost === 0;

            return (
              <Card key={acc.id} className={cn(
                'p-4 text-center',
                equipped && 'ring-2 ring-purple-400 border-purple-200',
                needsPoints && 'opacity-65',
              )}>
                <div className="text-4xl mb-2">{acc.emoji}</div>
                <p className="font-semibold text-gray-800 text-xs">{acc.name}</p>
                <p className="text-xs text-gray-400 capitalize mt-0.5 mb-3">{acc.category}</p>

                <div className="flex justify-center mb-3">
                  <ItemStatusBadge owned={owned} needsPoints={needsPoints} threshold={acc.unlockPointsRequired} cost={acc.purchaseCost} isFree={isFree} />
                </div>

                {!owned && canUnlock && !isFree && (
                  <Button size="sm" className="w-full text-xs"
                    disabled={spendablePoints < acc.purchaseCost}
                    onClick={() => handleBuy('accessories', acc.id)}>
                    Buy {acc.purchaseCost} pts
                  </Button>
                )}
                {owned && (
                  <Button variant={equipped ? 'secondary' : 'primary'} size="sm" className="w-full text-xs"
                    onClick={() => toggleAccessory(acc.id)}>
                    {equipped ? 'Remove' : 'Equip'}
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {tab === 'colors' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {AVATAR_COLOR_THEMES.map(theme => {
            const owned = ownsColor(theme.id);
            const equipped = settings.equippedColorId === theme.id;
            const canUnlock = canUnlockColor(theme.id);
            const needsPoints = !canUnlock;
            const isFree = theme.purchaseCost === 0;
            const isDefault = theme.id === 'default';

            return (
              <Card key={theme.id} className={cn(
                'p-4 text-center',
                equipped && 'ring-2 ring-purple-400 border-purple-200',
                needsPoints && 'opacity-65',
              )}>
                <div className="flex justify-center gap-1.5 mb-3">
                  {isDefault ? (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-300 via-yellow-300 to-amber-400 border-2 border-white shadow" />
                  ) : (
                    (['primary', 'secondary', 'accent'] as const).map(k => (
                      <div key={k} className="w-7 h-7 rounded-full border-2 border-white shadow"
                        style={{ background: theme[k] }} />
                    ))
                  )}
                </div>
                <p className="font-semibold text-gray-800 text-sm">{theme.name}</p>
                <div className="flex justify-center my-3">
                  <ItemStatusBadge owned={owned} needsPoints={needsPoints} threshold={theme.unlockPointsRequired} cost={theme.purchaseCost} isFree={isFree} />
                </div>

                {!owned && canUnlock && !isFree && (
                  <Button size="sm" className="w-full text-xs"
                    disabled={spendablePoints < theme.purchaseCost}
                    onClick={() => handleBuy('colors', theme.id)}>
                    Buy {theme.purchaseCost} pts
                  </Button>
                )}
                {owned && (
                  <Button variant={equipped ? 'secondary' : 'primary'} size="sm" className="w-full text-xs"
                    onClick={() => equipColor(equipped ? null : theme.id)}>
                    {equipped ? 'Remove' : 'Apply'}
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Purchase note */}
      <Card className="p-4 bg-amber-50 border-amber-200">
        <p className="text-xs text-amber-700">
          <strong>💡 Shop info:</strong> Spending points here only affects your <em>Spendable Points</em> balance — your leaderboard ranking (based on Total Earned Points) is never affected. Keep competing and earn more points to unlock exclusive animals!
        </p>
      </Card>
    </div>
  );
}
