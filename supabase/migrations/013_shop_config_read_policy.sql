-- Migration 013: Add read policy for avatar_shop_config
--
-- Migration 012 tightened writes to admin-only but did not add a SELECT
-- policy for regular users. Without it, RLS blocks participants from reading
-- the table, so their client falls back to localStorage (always empty on a
-- fresh device) and never sees admin-set prices or visibility flags.

create policy "Authenticated users can read shop config"
  on public.avatar_shop_config for select
  using (auth.role() = 'authenticated');
