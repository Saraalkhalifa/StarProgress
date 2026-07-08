-- Avatar shop admin config table
-- Stores per-item overrides (featured, seasonal, hidden) set by admins.
-- Participant ownership stays in localStorage (no breaking change).

create table if not exists public.avatar_shop_config (
  item_id   text not null,
  item_type text not null check (item_type in ('animal', 'accessory', 'color')),
  is_featured     boolean  not null default false,
  is_seasonal     boolean  not null default false,
  is_hidden       boolean  not null default false,
  seasonal_end_date date,
  updated_by  text,
  updated_at  timestamptz not null default now(),
  primary key (item_id, item_type)
);

alter table public.avatar_shop_config enable row level security;

-- Admins can read/write; everyone else reads only (needed so shop can check hidden/featured)
create policy "Anyone can read shop config"
  on public.avatar_shop_config for select using (true);

create policy "Authenticated users can upsert shop config"
  on public.avatar_shop_config for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
