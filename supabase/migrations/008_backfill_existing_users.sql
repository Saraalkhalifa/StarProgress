-- ============================================================
-- Migration 008 — Backfill public.users for existing auth.users
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- Safe to run multiple times (ON CONFLICT DO NOTHING)
-- Purpose: Creates public.users profiles for any auth.users
--          that signed up before migration 007 installed the trigger.
-- ============================================================

insert into public.users (
  id, name, email, username, role,
  account_status, avatar_color, phone_number, age, date_of_birth, created_at
)
select
  a.id,
  coalesce(nullif(trim(a.raw_user_meta_data->>'name'), ''), split_part(a.email, '@', 1)) as name,
  a.email,
  nullif(trim(a.raw_user_meta_data->>'username'), '') as username,
  coalesce(nullif(a.raw_user_meta_data->>'role', ''), 'participant') as role,
  'pending' as account_status,
  coalesce(nullif(a.raw_user_meta_data->>'avatar_color', ''), 'bg-blue-500') as avatar_color,
  nullif(trim(a.raw_user_meta_data->>'phone_number'), '') as phone_number,
  case when (a.raw_user_meta_data->>'age') ~ '^[0-9]+$'
       then (a.raw_user_meta_data->>'age')::integer else null end as age,
  (nullif(trim(a.raw_user_meta_data->>'date_of_birth'), ''))::date as date_of_birth,
  a.created_at
from auth.users a
left join public.users u on u.id = a.id
where u.id is null
on conflict (id) do nothing;
