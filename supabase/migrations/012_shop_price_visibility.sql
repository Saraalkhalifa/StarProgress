-- Migration 012: Admin-editable animal shop prices and visibility
--
-- Extends avatar_shop_config with price/unlock overrides so admins can
-- change prices from the UI without touching code.
-- Tightens the write RLS from "any authenticated user" to "admin only".

-- Add price/unlock override columns (null = use hardcoded default)
alter table public.avatar_shop_config
  add column if not exists price_points  integer check (price_points  >= 0),
  add column if not exists unlock_points integer check (unlock_points >= 0);

-- Drop the old too-permissive write policy
drop policy if exists "Authenticated users can upsert shop config" on public.avatar_shop_config;

-- New admin-only write policy (SELECT policy added in migration 013)
create policy "Admins can manage shop config"
  on public.avatar_shop_config for all
  using    (get_my_role() in ('admin', 'main_admin'))
  with check (get_my_role() in ('admin', 'main_admin'));
