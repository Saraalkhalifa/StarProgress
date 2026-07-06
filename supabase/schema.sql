-- ============================================================
-- Star Progress — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

create extension if not exists "uuid-ossp";

-- ── users (profiles) ─────────────────────────────────────────────────────────
-- NOTE: password_hash is used in demo mode only.
-- For production with Supabase Auth, authentication is handled by
-- Supabase's auth.users table — remove password_hash from production.

create table if not exists public.users (
  id                uuid        primary key default uuid_generate_v4(),
  name              text        not null,
  email             text        not null unique,
  username          text        unique,
  password_hash     text        not null default '',
  role              text        not null default 'participant'
                                check (role in ('participant', 'admin', 'main_admin')),
  account_status    text        not null default 'pending'
                                check (account_status in ('pending', 'active', 'denied', 'suspended')),
  created_at        timestamptz not null default now(),
  avatar_color      text        default 'bg-blue-500',
  phone_number      text,
  age               integer     check (age is null or (age >= 10 and age <= 100)),
  date_of_birth     date,
  signup_message    text,
  denial_reason     text,
  approved_by       uuid,
  approved_at       timestamptz
);

-- ── activities ───────────────────────────────────────────────────────────────
create table if not exists public.activities (
  id             uuid        primary key default uuid_generate_v4(),
  name           text        not null,
  name_ar        text,
  description    text,
  description_ar text,
  points         integer     not null default 10 check (points > 0),
  icon           text        default '📌',
  is_active      boolean     not null default true,
  created_at     timestamptz not null default now()
);

-- ── submissions ──────────────────────────────────────────────────────────────
create table if not exists public.submissions (
  id                         uuid        primary key default uuid_generate_v4(),
  participant_id             uuid        not null references public.users(id) on delete cascade,
  activity_id                uuid        not null references public.activities(id) on delete cascade,
  note                       text        not null default '',
  points_value_at_submission integer     not null default 0,
  status                     text        not null default 'pending'
                                         check (status in ('pending', 'accepted', 'denied')),
  admin_comment              text,
  submitted_at               timestamptz not null default now(),
  reviewed_at                timestamptz,
  reviewed_by                uuid        references public.users(id)
);

-- ── badges ───────────────────────────────────────────────────────────────────
create table if not exists public.badges (
  id               uuid    primary key default uuid_generate_v4(),
  name             text    not null,
  name_ar          text,
  required_points  integer not null check (required_points >= 0),
  icon             text    default '⭐',
  color            text    default 'text-yellow-600',
  bg_color         text    default 'bg-yellow-100'
);

-- ── notifications ─────────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id                    uuid        primary key default uuid_generate_v4(),
  type                  text        not null,
  message               text        not null,
  related_submission_id uuid        references public.submissions(id) on delete set null,
  is_read               boolean     not null default false,
  created_at            timestamptz not null default now()
);

-- ── Row Level Security ───────────────────────────────────────────────────────
-- Open anon policies for demo/custom-auth mode.
-- For production Supabase Auth, replace with auth.uid() scoped policies.

alter table public.users          enable row level security;
alter table public.activities     enable row level security;
alter table public.submissions    enable row level security;
alter table public.badges         enable row level security;
alter table public.notifications  enable row level security;

create policy "anon_all_users"         on public.users         for all to anon using (true) with check (true);
create policy "anon_all_activities"    on public.activities    for all to anon using (true) with check (true);
create policy "anon_all_submissions"   on public.submissions   for all to anon using (true) with check (true);
create policy "anon_all_badges"        on public.badges        for all to anon using (true) with check (true);
create policy "anon_all_notifications" on public.notifications for all to anon using (true) with check (true);

-- ── Performance indexes ──────────────────────────────────────────────────────
create index if not exists idx_users_email         on public.users(email);
create index if not exists idx_users_username      on public.users(username);
create index if not exists idx_users_role          on public.users(role);
create index if not exists idx_users_status        on public.users(account_status);
create index if not exists idx_subs_participant    on public.submissions(participant_id);
create index if not exists idx_subs_status         on public.submissions(status);
create index if not exists idx_subs_at             on public.submissions(submitted_at desc);
create index if not exists idx_notif_read          on public.notifications(is_read);

-- ── SECURITY NOTES ───────────────────────────────────────────────────────────
-- 1. Only VITE_SUPABASE_ANON_KEY goes in frontend .env — safe to expose.
-- 2. NEVER put SUPABASE_SERVICE_ROLE_KEY in frontend code.
-- 3. password_hash stores demo hashes only — use Supabase Auth for production.
-- 4. Open RLS policies above are intentional for demo mode.
--    For production, use: using (auth.uid() = id) etc.
