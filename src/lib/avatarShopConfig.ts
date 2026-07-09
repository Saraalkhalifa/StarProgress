import { supabase, isSupabaseConfigured } from './supabase';
import type { AvatarShopItemOverride } from '../types/avatar';

const SHOP_CONFIG_KEY = 'sp_av_shop_config';

// ── localStorage helpers (cache / offline fallback) ────────────────────────────

function lsGetAll(): AvatarShopItemOverride[] {
  try { return JSON.parse(localStorage.getItem(SHOP_CONFIG_KEY) ?? '[]'); }
  catch { return []; }
}
function lsSetAll(data: AvatarShopItemOverride[]): void {
  localStorage.setItem(SHOP_CONFIG_KEY, JSON.stringify(data));
}

// ── Supabase row ↔ AvatarShopItemOverride mapping ─────────────────────────────

function fromRow(row: Record<string, unknown>): AvatarShopItemOverride {
  return {
    itemId:   row.item_id   as string,
    itemType: row.item_type as AvatarShopItemOverride['itemType'],
    isFeatured:   !!(row.is_featured),
    isSeasonal:   !!(row.is_seasonal),
    isHidden:     !!(row.is_hidden),
    customPrice:        row.price_points  != null ? Number(row.price_points)  : undefined,
    customUnlockPoints: row.unlock_points != null ? Number(row.unlock_points) : undefined,
    seasonalEndDate:    (row.seasonal_end_date as string | null) ?? undefined,
    updatedAt: (row.updated_at as string) ?? new Date().toISOString(),
  };
}

// ── Public API ─────────────────────────────────────────────────────────────────

/** Synchronous read from localStorage cache (used for initial state). */
export function loadShopOverrides(): AvatarShopItemOverride[] {
  return lsGetAll();
}

/** Async read from Supabase, falls back to localStorage cache on error. */
export async function loadShopOverridesFromSupabase(): Promise<AvatarShopItemOverride[]> {
  if (!isSupabaseConfigured || !supabase) return lsGetAll();
  const { data, error } = await supabase.from('avatar_shop_config').select('*');
  if (error || !data) return lsGetAll();
  const overrides = (data as Record<string, unknown>[]).map(fromRow);
  lsSetAll(overrides); // keep cache in sync
  return overrides;
}

/**
 * Save one override: updates localStorage immediately (synchronous return),
 * then fires a background Supabase upsert.
 */
export function saveShopOverride(override: AvatarShopItemOverride): AvatarShopItemOverride[] {
  const withTs = { ...override, updatedAt: new Date().toISOString() };
  const rest = lsGetAll().filter(
    o => !(o.itemType === override.itemType && o.itemId === override.itemId),
  );
  const updated = [...rest, withTs];
  lsSetAll(updated);

  // Background Supabase sync
  if (isSupabaseConfigured && supabase) {
    void supabase.from('avatar_shop_config').upsert(
      {
        item_id:            override.itemId,
        item_type:          override.itemType,
        is_featured:        override.isFeatured,
        is_seasonal:        override.isSeasonal,
        is_hidden:          override.isHidden,
        price_points:       override.customPrice  ?? null,
        unlock_points:      override.customUnlockPoints ?? null,
        seasonal_end_date:  override.seasonalEndDate ?? null,
        updated_at:         withTs.updatedAt,
      },
      { onConflict: 'item_id,item_type' },
    );
  }

  return updated;
}

export function clearShopOverride(
  itemType: AvatarShopItemOverride['itemType'],
  itemId: string,
): AvatarShopItemOverride[] {
  const updated = lsGetAll().filter(
    o => !(o.itemType === itemType && o.itemId === itemId),
  );
  lsSetAll(updated);
  return updated;
}

/** Returns true if a seasonal item is still within its active window. */
export function isSeasonalActive(override: AvatarShopItemOverride): boolean {
  if (!override.isSeasonal) return false;
  if (!override.seasonalEndDate) return true;
  return new Date(override.seasonalEndDate + 'T23:59:59') >= new Date();
}
