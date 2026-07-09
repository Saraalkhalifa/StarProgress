-- ============================================================
-- Migration 007 — Auto-create public.users profile on signup
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- Safe to run multiple times (OR REPLACE / drop+recreate trigger)
-- ============================================================

-- Function: runs as SECURITY DEFINER (bypasses RLS) after every
-- new auth.users INSERT (i.e., every supabase.auth.signUp() call).
-- Reads metadata supplied by the frontend and inserts a matching
-- row into public.users with account_status = 'pending'.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_age integer;
  v_dob date;
begin
  -- Safely cast age string to integer (frontend sends it as a string)
  begin
    v_age := (new.raw_user_meta_data->>'age')::integer;
  exception when others then
    v_age := null;
  end;

  -- Safely cast date_of_birth string to date (column type is date, not text)
  begin
    v_dob := (nullif(trim(new.raw_user_meta_data->>'date_of_birth'), ''))::date;
  exception when others then
    v_dob := null;
  end;

  begin
    insert into public.users (
      id,
      name,
      email,
      username,
      role,
      account_status,
      avatar_color,
      phone_number,
      age,
      date_of_birth,
      created_at
    ) values (
      new.id,
      coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), split_part(new.email, '@', 1)),
      new.email,
      nullif(trim(new.raw_user_meta_data->>'username'), ''),
      coalesce(nullif(new.raw_user_meta_data->>'role', ''), 'participant'),
      'pending',
      coalesce(nullif(new.raw_user_meta_data->>'avatar_color', ''), 'bg-blue-500'),
      nullif(trim(new.raw_user_meta_data->>'phone_number'), ''),
      v_age,
      v_dob,
      now()
    )
    on conflict (id) do nothing;
  exception when others then
    -- Never let profile-creation errors block the auth signup.
    -- The user lands in auth.users and can be backfilled later.
    raise warning 'handle_new_user: could not create profile for %: %', new.id, sqlerrm;
  end;

  return new;
end;
$$;

-- Trigger: fires AFTER every INSERT into auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

-- ============================================================
-- Verification queries (run manually to confirm success)
-- ============================================================
-- Check function exists:
--   select proname from pg_proc where proname = 'handle_new_user';
-- Check trigger exists:
--   select trigger_name from information_schema.triggers
--   where trigger_name = 'on_auth_user_created';
-- ============================================================
