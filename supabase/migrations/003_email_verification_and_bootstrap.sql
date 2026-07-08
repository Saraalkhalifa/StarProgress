-- ============================================================
-- Migration 003 — Email verification tracking + bootstrap admin
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- Safe to run multiple times
-- ============================================================

-- ── 1. Add email_verified_at column to public.users ──────────────────────────
alter table public.users
  add column if not exists email_verified_at timestamptz;

-- ── 2. Function: sync email_confirmed_at → public.users.email_verified_at ────
create or replace function public.handle_email_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only act when email_confirmed_at changes from null to a value
  if new.email_confirmed_at is not null and
     (old.email_confirmed_at is null or old.email_confirmed_at is distinct from new.email_confirmed_at)
  then
    update public.users
    set email_verified_at = new.email_confirmed_at
    where id = new.id;
  end if;
  return new;
end;
$$;

-- ── 3. Trigger on auth.users UPDATE ──────────────────────────────────────────
drop trigger if exists on_email_verified on auth.users;
create trigger on_email_verified
  after update on auth.users
  for each row
  when (new.email_confirmed_at is distinct from old.email_confirmed_at
        and new.email_confirmed_at is not null)
  execute procedure public.handle_email_verification();

-- ── 4. Backfill: mark already-verified users ──────────────────────────────────
update public.users u
set    email_verified_at = a.email_confirmed_at
from   auth.users a
where  u.id = a.id
  and  a.email_confirmed_at is not null
  and  u.email_verified_at is null;

-- ── 5. Install bootstrap_main_admin() RPC ─────────────────────────────────────
-- Called by the app on every startup (SECURITY DEFINER, safe to expose to anon).
-- No-op when a main_admin already exists; creates a fallback demo admin otherwise.

create or replace function public.bootstrap_main_admin()
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_id    uuid;
  v_email text := 'admin@starprogress.demo';
  v_exist uuid;
begin
  select id into v_exist from public.users where role = 'main_admin' limit 1;
  if v_exist is not null then return 'exists'; end if;

  select id into v_id from auth.users where email = v_email limit 1;

  if v_id is null then
    v_id := gen_random_uuid();

    begin
      insert into auth.users (
        id, instance_id, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data,
        is_super_admin, role, aud,
        confirmation_token, recovery_token,
        email_change_token_new, email_change, is_sso_user
      ) values (
        v_id, '00000000-0000-0000-0000-000000000000'::uuid, v_email,
        crypt('MainAdmin@2026', gen_salt('bf')),
        now(), now(), now(),
        '{"provider":"email","providers":["email"]}',
        '{"username":"Mainadmin","name":"Sara","role":"main_admin"}',
        false, 'authenticated', 'authenticated',
        '', '', '', '', false
      );
    exception when undefined_column then
      insert into auth.users (
        id, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data,
        is_super_admin, role, aud
      ) values (
        v_id, v_email, crypt('MainAdmin@2026', gen_salt('bf')),
        now(), now(), now(),
        '{"provider":"email","providers":["email"]}',
        '{"username":"Mainadmin","name":"Sara","role":"main_admin"}',
        false, 'authenticated', 'authenticated'
      );
    end;

    begin
      insert into auth.identities (
        provider_id, user_id, identity_data, provider,
        last_sign_in_at, created_at, updated_at
      ) values (
        v_id::text, v_id,
        jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true),
        'email', now(), now(), now()
      ) on conflict do nothing;
    exception when undefined_column then
      begin
        insert into auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
        values (v_id, v_id, jsonb_build_object('sub', v_id::text, 'email', v_email), 'email', now(), now(), now())
        on conflict do nothing;
      exception when others then null;
      end;
    end;
  end if;

  insert into public.users (id, name, email, username, role, account_status, avatar_color, created_at, email_verified_at)
  values (v_id, 'Sara', v_email, 'Mainadmin', 'main_admin', 'active', 'bg-blue-500', now(), now())
  on conflict (id) do update
    set role              = 'main_admin',
        account_status    = 'active',
        username          = 'Mainadmin',
        name              = 'Sara',
        email_verified_at = coalesce(excluded.email_verified_at, public.users.email_verified_at);

  return 'created';
end;
$$;

grant execute on function public.bootstrap_main_admin() to anon, authenticated;

-- ── 6. Enable Realtime for users table (for admin dashboard auto-refresh) ────
-- This adds the users table to the supabase_realtime publication so the frontend
-- can subscribe to INSERT/UPDATE events without polling.
alter publication supabase_realtime add table public.users;

-- ── 7. Index for email_verified_at ───────────────────────────────────────────
create index if not exists idx_users_email_verified on public.users(email_verified_at);

-- ============================================================
-- Verification
-- ============================================================
-- select column_name from information_schema.columns
--   where table_name = 'users' and column_name = 'email_verified_at';
-- select count(*) from public.users where email_verified_at is not null;
-- select proname from pg_proc where proname = 'bootstrap_main_admin';
-- select * from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'users';
