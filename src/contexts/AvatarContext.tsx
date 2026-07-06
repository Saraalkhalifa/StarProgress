import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AvatarSettings, AvatarInventoryItem, PointsWallet } from '../types/avatar';
import {
  getInventory, hasItem, addInventoryItem, bulkAddInventoryItems,
  getAvatarSettings, saveAvatarSettings, getWallet, spendPoints,
} from '../lib/avatarStorage';
import {
  AVATAR_ANIMALS, AVATAR_ACCESSORIES, AVATAR_COLOR_THEMES,
  STARTER_ANIMAL_IDS, DEFAULT_ANIMAL_ID,
} from '../lib/avatarData';
import { useAuth } from './AuthContext';
import { useData } from './DataContext';

interface AvatarContextType {
  // State
  inventory: AvatarInventoryItem[];
  settings: AvatarSettings | null;
  wallet: PointsWallet;
  totalEarnedPoints: number;
  spendablePoints: number;
  loading: boolean;
  // Derived helpers
  ownsAnimal: (animalId: string) => boolean;
  ownsAccessory: (id: string) => boolean;
  ownsColor: (id: string) => boolean;
  canUnlockAnimal: (animalId: string) => boolean;
  canUnlockAccessory: (id: string) => boolean;
  canUnlockColor: (id: string) => boolean;
  // Actions
  equipAnimal: (animalId: string) => void;
  toggleAccessory: (accessoryId: string) => void;
  equipColor: (colorId: string | null) => void;
  purchaseAnimal: (animalId: string) => { success: boolean; error?: string };
  purchaseAccessory: (accessoryId: string) => { success: boolean; error?: string };
  purchaseColor: (colorId: string) => { success: boolean; error?: string };
  unlockFreeItem: (type: 'animal' | 'accessory' | 'color', id: string) => void;
}

const AvatarContext = createContext<AvatarContextType | null>(null);

export function AvatarProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const { getAcceptedPoints } = useData();
  const [inventory, setInventory] = useState<AvatarInventoryItem[]>([]);
  const [settings, setSettings] = useState<AvatarSettings | null>(null);
  const [wallet, setWallet] = useState<PointsWallet>({ participantId: '', totalSpentPoints: 0, updatedAt: '' });
  const [loading, setLoading] = useState(true);

  const participantId = currentUser?.id ?? '';
  const totalEarnedPoints = currentUser ? getAcceptedPoints(currentUser.id) : 0;
  const spendablePoints = Math.max(0, totalEarnedPoints - wallet.totalSpentPoints);

  // Load / initialize avatar data for the current participant
  const loadAvatarData = useCallback(() => {
    if (!participantId) { setLoading(false); return; }

    const savedSettings = getAvatarSettings(participantId);
    const savedWallet   = getWallet(participantId);

    // Ensure all starter animals are in inventory
    bulkAddInventoryItems(participantId, STARTER_ANIMAL_IDS.map(id => ({ type: 'animal' as const, id })));
    // Free accessories (cost 0, no unlock requirement)
    const freeAccessories = AVATAR_ACCESSORIES.filter(a => a.purchaseCost === 0 && a.unlockPointsRequired === 0);
    bulkAddInventoryItems(participantId, freeAccessories.map(a => ({ type: 'accessory' as const, id: a.id })));
    // Default color theme
    bulkAddInventoryItems(participantId, [{ type: 'color' as const, id: 'default' }]);

    const inv = getInventory(participantId);
    setInventory(inv);
    setWallet(savedWallet);

    if (savedSettings) {
      setSettings(savedSettings);
    } else {
      // Create default settings
      const defaults: AvatarSettings = {
        participantId,
        equippedAnimalId: DEFAULT_ANIMAL_ID,
        equippedAccessoryIds: [],
        equippedColorId: null,
        updatedAt: new Date().toISOString(),
      };
      saveAvatarSettings(defaults);
      setSettings(defaults);
    }

    setLoading(false);
  }, [participantId]);

  useEffect(() => {
    loadAvatarData();
  }, [loadAvatarData]);

  // Auto-unlock point-gated free items when totalEarnedPoints increases
  useEffect(() => {
    if (!participantId || totalEarnedPoints === 0) return;
    let changed = false;
    for (const animal of AVATAR_ANIMALS) {
      if (!animal.isStarter && animal.purchaseCost === 0 && animal.unlockPointsRequired <= totalEarnedPoints) {
        if (!hasItem(participantId, 'animal', animal.id)) {
          addInventoryItem(participantId, 'animal', animal.id);
          changed = true;
        }
      }
    }
    for (const acc of AVATAR_ACCESSORIES) {
      if (acc.purchaseCost === 0 && acc.unlockPointsRequired <= totalEarnedPoints) {
        if (!hasItem(participantId, 'accessory', acc.id)) {
          addInventoryItem(participantId, 'accessory', acc.id);
          changed = true;
        }
      }
    }
    for (const color of AVATAR_COLOR_THEMES) {
      if (color.purchaseCost === 0 && color.unlockPointsRequired <= totalEarnedPoints) {
        if (!hasItem(participantId, 'color', color.id)) {
          addInventoryItem(participantId, 'color', color.id);
          changed = true;
        }
      }
    }
    if (changed) setInventory(getInventory(participantId));
  }, [participantId, totalEarnedPoints]);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const ownsAnimal     = (id: string) => inventory.some(i => i.itemType === 'animal'     && i.itemId === id);
  const ownsAccessory  = (id: string) => inventory.some(i => i.itemType === 'accessory'  && i.itemId === id);
  const ownsColor      = (id: string) => inventory.some(i => i.itemType === 'color'      && i.itemId === id);

  const canUnlockAnimal    = (id: string) => totalEarnedPoints >= (AVATAR_ANIMALS.find(a => a.id === id)?.unlockPointsRequired ?? 0);
  const canUnlockAccessory = (id: string) => totalEarnedPoints >= (AVATAR_ACCESSORIES.find(a => a.id === id)?.unlockPointsRequired ?? 0);
  const canUnlockColor     = (id: string) => totalEarnedPoints >= (AVATAR_COLOR_THEMES.find(c => c.id === id)?.unlockPointsRequired ?? 0);

  // ── Settings mutations ────────────────────────────────────────────────────────

  const updateSettings = (patch: Partial<AvatarSettings>) => {
    const next = { ...settings!, ...patch, updatedAt: new Date().toISOString() };
    saveAvatarSettings(next);
    setSettings(next);
  };

  const equipAnimal = (animalId: string) => {
    if (!ownsAnimal(animalId)) return;
    updateSettings({ equippedAnimalId: animalId });
  };

  const toggleAccessory = (accessoryId: string) => {
    if (!ownsAccessory(accessoryId)) return;
    const current = settings?.equippedAccessoryIds ?? [];
    const next = current.includes(accessoryId)
      ? current.filter(id => id !== accessoryId)
      : [...current.slice(-2), accessoryId]; // max 3 accessories
    updateSettings({ equippedAccessoryIds: next });
  };

  const equipColor = (colorId: string | null) => {
    if (colorId && !ownsColor(colorId)) return;
    updateSettings({ equippedColorId: colorId });
  };

  // ── Purchases ────────────────────────────────────────────────────────────────

  const purchaseAnimal = (animalId: string): { success: boolean; error?: string } => {
    const animal = AVATAR_ANIMALS.find(a => a.id === animalId);
    if (!animal) return { success: false, error: 'Animal not found' };
    if (ownsAnimal(animalId)) return { success: false, error: 'Already owned' };
    if (!canUnlockAnimal(animalId)) return { success: false, error: `Need ${animal.unlockPointsRequired} total points first` };
    if (spendablePoints < animal.purchaseCost) return { success: false, error: `Need ${animal.purchaseCost} spendable points` };
    spendPoints(participantId, animal.purchaseCost);
    addInventoryItem(participantId, 'animal', animalId);
    setInventory(getInventory(participantId));
    setWallet(getWallet(participantId));
    return { success: true };
  };

  const purchaseAccessory = (accessoryId: string): { success: boolean; error?: string } => {
    const acc = AVATAR_ACCESSORIES.find(a => a.id === accessoryId);
    if (!acc) return { success: false, error: 'Accessory not found' };
    if (ownsAccessory(accessoryId)) return { success: false, error: 'Already owned' };
    if (!canUnlockAccessory(accessoryId)) return { success: false, error: `Need ${acc.unlockPointsRequired} total points first` };
    if (spendablePoints < acc.purchaseCost) return { success: false, error: `Need ${acc.purchaseCost} spendable points` };
    spendPoints(participantId, acc.purchaseCost);
    addInventoryItem(participantId, 'accessory', accessoryId);
    setInventory(getInventory(participantId));
    setWallet(getWallet(participantId));
    return { success: true };
  };

  const purchaseColor = (colorId: string): { success: boolean; error?: string } => {
    const color = AVATAR_COLOR_THEMES.find(c => c.id === colorId);
    if (!color) return { success: false, error: 'Color theme not found' };
    if (ownsColor(colorId)) return { success: false, error: 'Already owned' };
    if (!canUnlockColor(colorId)) return { success: false, error: `Need ${color.unlockPointsRequired} total points first` };
    if (spendablePoints < color.purchaseCost) return { success: false, error: `Need ${color.purchaseCost} spendable points` };
    spendPoints(participantId, color.purchaseCost);
    addInventoryItem(participantId, 'color', colorId);
    setInventory(getInventory(participantId));
    setWallet(getWallet(participantId));
    return { success: true };
  };

  const unlockFreeItem = (type: 'animal' | 'accessory' | 'color', id: string) => {
    addInventoryItem(participantId, type, id);
    setInventory(getInventory(participantId));
  };

  return (
    <AvatarContext.Provider value={{
      inventory, settings, wallet, totalEarnedPoints, spendablePoints, loading,
      ownsAnimal, ownsAccessory, ownsColor,
      canUnlockAnimal, canUnlockAccessory, canUnlockColor,
      equipAnimal, toggleAccessory, equipColor,
      purchaseAnimal, purchaseAccessory, purchaseColor, unlockFreeItem,
    }}>
      {children}
    </AvatarContext.Provider>
  );
}

export function useAvatar() {
  const ctx = useContext(AvatarContext);
  if (!ctx) throw new Error('useAvatar must be used within AvatarProvider');
  return ctx;
}

// Safe hook that returns null instead of throwing — for use outside AvatarProvider
export function useAvatarSafe() {
  return useContext(AvatarContext);
}
