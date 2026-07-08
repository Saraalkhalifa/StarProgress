import type { AvatarShopItemOverride } from '../types/avatar';

const SHOP_CONFIG_KEY = 'sp_av_shop_config';

function lsGetAll(): AvatarShopItemOverride[] {
  try { return JSON.parse(localStorage.getItem(SHOP_CONFIG_KEY) ?? '[]'); }
  catch { return []; }
}

export function loadShopOverrides(): AvatarShopItemOverride[] {
  return lsGetAll();
}

export function getShopOverride(
  itemType: AvatarShopItemOverride['itemType'],
  itemId: string,
): AvatarShopItemOverride | null {
  return lsGetAll().find(o => o.itemType === itemType && o.itemId === itemId) ?? null;
}

export function saveShopOverride(override: AvatarShopItemOverride): AvatarShopItemOverride[] {
  const rest = lsGetAll().filter(
    o => !(o.itemType === override.itemType && o.itemId === override.itemId),
  );
  const updated: AvatarShopItemOverride[] = [
    ...rest,
    { ...override, updatedAt: new Date().toISOString() },
  ];
  localStorage.setItem(SHOP_CONFIG_KEY, JSON.stringify(updated));
  return updated;
}

export function clearShopOverride(
  itemType: AvatarShopItemOverride['itemType'],
  itemId: string,
): AvatarShopItemOverride[] {
  const updated = lsGetAll().filter(
    o => !(o.itemType === itemType && o.itemId === itemId),
  );
  localStorage.setItem(SHOP_CONFIG_KEY, JSON.stringify(updated));
  return updated;
}

/** Returns true if a seasonal item is still within its active window. */
export function isSeasonalActive(override: AvatarShopItemOverride): boolean {
  if (!override.isSeasonal) return false;
  if (!override.seasonalEndDate) return true;
  return new Date(override.seasonalEndDate + 'T23:59:59') >= new Date();
}
