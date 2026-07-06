import type { AvatarInventoryItem, AvatarSettings, PointsWallet } from '../types/avatar';
import { generateId } from './utils';

// ── localStorage keys ──────────────────────────────────────────────────────────
const AV_INVENTORY = 'sp_av_inventory';
const AV_SETTINGS  = 'sp_av_settings';
const AV_WALLETS   = 'sp_av_wallets';

function lsGet<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]') as T[]; }
  catch { return []; }
}
function lsSet<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// ── Inventory ──────────────────────────────────────────────────────────────────

export function getInventory(participantId: string): AvatarInventoryItem[] {
  return lsGet<AvatarInventoryItem>(AV_INVENTORY).filter(i => i.participantId === participantId);
}

export function hasItem(participantId: string, itemType: AvatarInventoryItem['itemType'], itemId: string): boolean {
  return lsGet<AvatarInventoryItem>(AV_INVENTORY).some(
    i => i.participantId === participantId && i.itemType === itemType && i.itemId === itemId
  );
}

export function addInventoryItem(participantId: string, itemType: AvatarInventoryItem['itemType'], itemId: string): void {
  if (hasItem(participantId, itemType, itemId)) return;
  const all = lsGet<AvatarInventoryItem>(AV_INVENTORY);
  all.push({ id: generateId(), participantId, itemType, itemId, acquiredAt: new Date().toISOString() });
  lsSet(AV_INVENTORY, all);
}

export function bulkAddInventoryItems(participantId: string, items: Array<{ type: AvatarInventoryItem['itemType']; id: string }>): void {
  const all = lsGet<AvatarInventoryItem>(AV_INVENTORY);
  const now = new Date().toISOString();
  for (const item of items) {
    if (!all.some(i => i.participantId === participantId && i.itemType === item.type && i.itemId === item.id)) {
      all.push({ id: generateId(), participantId, itemType: item.type, itemId: item.id, acquiredAt: now });
    }
  }
  lsSet(AV_INVENTORY, all);
}

// ── Avatar settings ────────────────────────────────────────────────────────────

export function getAvatarSettings(participantId: string): AvatarSettings | null {
  return lsGet<AvatarSettings>(AV_SETTINGS).find(s => s.participantId === participantId) ?? null;
}

export function saveAvatarSettings(settings: AvatarSettings): void {
  const all = lsGet<AvatarSettings>(AV_SETTINGS).filter(s => s.participantId !== settings.participantId);
  all.push({ ...settings, updatedAt: new Date().toISOString() });
  lsSet(AV_SETTINGS, all);
}

// ── Points wallet ──────────────────────────────────────────────────────────────

export function getWallet(participantId: string): PointsWallet {
  return (
    lsGet<PointsWallet>(AV_WALLETS).find(w => w.participantId === participantId) ??
    { participantId, totalSpentPoints: 0, updatedAt: new Date().toISOString() }
  );
}

export function spendPoints(participantId: string, amount: number): void {
  const all = lsGet<PointsWallet>(AV_WALLETS).filter(w => w.participantId !== participantId);
  const current = getWallet(participantId);
  all.push({ ...current, totalSpentPoints: current.totalSpentPoints + amount, updatedAt: new Date().toISOString() });
  lsSet(AV_WALLETS, all);
}

export function resetAvatarData(participantId: string): void {
  lsSet(AV_INVENTORY, lsGet<AvatarInventoryItem>(AV_INVENTORY).filter(i => i.participantId !== participantId));
  lsSet(AV_SETTINGS, lsGet<AvatarSettings>(AV_SETTINGS).filter(s => s.participantId !== participantId));
  lsSet(AV_WALLETS, lsGet<PointsWallet>(AV_WALLETS).filter(w => w.participantId !== participantId));
}
