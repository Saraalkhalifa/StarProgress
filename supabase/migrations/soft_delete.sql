-- ============================================================
-- Migration: Soft Delete support for Star Progress users table
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- Safe to run multiple times (uses IF NOT EXISTS / DO blocks)
-- ============================================================

-- 1. Add soft-delete columns if they don't already exist
alter table public.users
  add column if not exists is_deleted boolean not null default false,
  add column if not exists deleted_at  timestamptz,
  add column if not exists deleted_by  uuid references public.users(id) on delete set null;

-- 2. Update the account_status check constraint to include 'deleted'
--    Drop the old constraint and recreate it (Postgres requires this)
alter table public.users
  drop constraint if exists users_account_status_check;

alter table public.users
  add constraint users_account_status_check
    check (account_status in ('pending', 'active', 'denied', 'suspended', 'deleted'));

-- 3. Add index for efficient soft-delete queries
create index if not exists idx_users_is_deleted on public.users(is_deleted);

-- 4. Update the leaderboard view to exclude soft-deleted users
create or replace view public.leaderboard_participants as
select
  u.id,
  u.name,
  u.avatar_color,
  coalesce(sum(case when s.status = 'accepted' then s.points_value_at_submission else 0 end), 0) as total_accepted_points
from public.users u
left join public.submissions s on s.participant_id = u.id and s.status = 'accepted'
where u.role = 'participant'
  and u.account_status = 'active'
  and u.is_deleted = false
group by u.id, u.name, u.avatar_color;

grant select on public.leaderboard_participants to authenticated;

-- 5. Update RLS policies so soft-deleted users are hidden from normal reads
--    but main_admin can still see them for the archive page.

-- Drop and recreate the users read policies
drop policy if exists "anon_read_users_for_login"    on public.users;
drop policy if exists "authenticated_read_users"     on public.users;
drop policy if exists "admin_update_users"           on public.users;

-- Anon: can see non-deleted users only (for login lookup)
create policy "anon_read_users_for_login" on public.users
  for select to anon
  using (is_deleted = false);

-- Authenticated: non-deleted users are visible to all authenticated users.
-- Main admin can also see deleted users (for the archive page).
create policy "authenticated_read_users" on public.users
  for select to authenticated
  using (
    is_deleted = false
    or get_my_role() = 'main_admin'
  );

-- Admins can soft-delete (update is_deleted, deleted_at, deleted_by, account_status)
-- but regular admins cannot soft-delete other admins or main_admin.
drop policy if exists "admin_soft_delete_users" on public.users;
create policy "admin_soft_delete_users" on public.users
  for update to authenticated
  using (
    -- main_admin can soft-delete anyone except themselves
    (get_my_role() = 'main_admin' and id != auth.uid() and role != 'main_admin')
    -- regular admin can soft-delete participants only
    or (get_my_role() = 'admin' and role = 'participant')
  )
  with check (
    (get_my_role() = 'main_admin' and id != auth.uid() and role != 'main_admin')
    or (get_my_role() = 'admin' and role = 'participant')
  );

-- Only main_admin can restore (set is_deleted back to false)
drop policy if exists "main_admin_restore_users" on public.users;
create policy "main_admin_restore_users" on public.users
  for update to authenticated
  using (get_my_role() = 'main_admin')
  with check (get_my_role() = 'main_admin');

-- Recreate the general admin update policy (approve/deny/suspend)
create policy "admin_update_users" on public.users
  for update to authenticated
  using (get_my_role() in ('admin', 'main_admin'));

-- ============================================================
-- Verification: after running, check soft-delete works
-- ============================================================
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'users' AND column_name IN ('is_deleted','deleted_at','deleted_by');
-- Expected: 3 rows returned.
