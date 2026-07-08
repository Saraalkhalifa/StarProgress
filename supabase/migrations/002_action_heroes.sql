-- ============================================================
-- Migration 002 — Action Heroes features
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- Safe to run multiple times (IF NOT EXISTS / DO blocks)
-- ============================================================

-- ── 1. submissions: add 'flagged' and 'needs_info' to status ─────────────────
alter table public.submissions
  drop constraint if exists submissions_status_check;

alter table public.submissions
  add constraint submissions_status_check
    check (status in ('pending', 'accepted', 'denied', 'flagged', 'needs_info'));

-- ── 2. submissions: add is_flagged and flag_note columns ─────────────────────
alter table public.submissions
  add column if not exists is_flagged boolean not null default false,
  add column if not exists flag_note  text;

-- ── 3. users: add 'parent' to role ───────────────────────────────────────────
alter table public.users
  drop constraint if exists users_role_check;

alter table public.users
  add constraint users_role_check
    check (role in ('participant', 'admin', 'main_admin', 'parent'));

-- ── 4. users: add parent-child link columns ──────────────────────────────────
alter table public.users
  add column if not exists parent_email   text,
  add column if not exists parent_user_id uuid references public.users(id) on delete set null;

-- ── 5. TABLE: announcements ──────────────────────────────────────────────────
create table if not exists public.announcements (
  id         uuid        primary key default uuid_generate_v4(),
  title      text        not null,
  message    text        not null,
  author_id  uuid        not null references public.users(id) on delete cascade,
  is_active  boolean     not null default true,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

alter table public.announcements enable row level security;

drop policy if exists "read_announcements" on public.announcements;
create policy "read_announcements" on public.announcements
  for select to authenticated using (true);

drop policy if exists "anon_read_announcements" on public.announcements;
create policy "anon_read_announcements" on public.announcements
  for select to anon using (is_active = true);

drop policy if exists "admin_write_announcements" on public.announcements;
create policy "admin_write_announcements" on public.announcements
  for all to authenticated
  using (get_my_role() in ('admin', 'main_admin'))
  with check (get_my_role() in ('admin', 'main_admin'));

-- ── 6. TABLE: reward_types ───────────────────────────────────────────────────
create table if not exists public.reward_types (
  id           uuid        primary key default uuid_generate_v4(),
  name         text        not null,
  description  text,
  point_cost   integer     not null check (point_cost > 0),
  cost_type    text        not null default 'fixed' check (cost_type in ('fixed', 'per_hour')),
  max_duration integer,
  is_active    boolean     not null default true,
  created_at   timestamptz not null default now()
);

alter table public.reward_types enable row level security;

drop policy if exists "read_reward_types" on public.reward_types;
create policy "read_reward_types" on public.reward_types
  for select to authenticated using (true);

drop policy if exists "admin_write_reward_types" on public.reward_types;
create policy "admin_write_reward_types" on public.reward_types
  for all to authenticated
  using (get_my_role() in ('admin', 'main_admin'))
  with check (get_my_role() in ('admin', 'main_admin'));

-- ── 7. TABLE: reward_requests ────────────────────────────────────────────────
create table if not exists public.reward_requests (
  id                     uuid        primary key default uuid_generate_v4(),
  participant_id         uuid        not null references public.users(id) on delete cascade,
  parent_id              uuid        references public.users(id) on delete set null,
  parent_email           text,
  reward_type_id         uuid        not null references public.reward_types(id) on delete cascade,
  requested_duration     integer,
  total_points_required  integer     not null,
  child_message          text,
  status                 text        not null default 'pending'
                                     check (status in ('pending', 'approved', 'denied', 'cancelled')),
  parent_note            text,
  requested_at           timestamptz not null default now(),
  decided_at             timestamptz
);

alter table public.reward_requests enable row level security;

drop policy if exists "read_reward_requests" on public.reward_requests;
create policy "read_reward_requests" on public.reward_requests
  for select to authenticated
  using (
    participant_id = auth.uid()
    or parent_id = auth.uid()
    or get_my_role() in ('admin', 'main_admin')
  );

drop policy if exists "participant_insert_reward_requests" on public.reward_requests;
create policy "participant_insert_reward_requests" on public.reward_requests
  for insert to authenticated
  with check (participant_id = auth.uid());

drop policy if exists "parent_update_reward_requests" on public.reward_requests;
create policy "parent_update_reward_requests" on public.reward_requests
  for update to authenticated
  using (parent_id = auth.uid() or get_my_role() in ('admin', 'main_admin'))
  with check (parent_id = auth.uid() or get_my_role() in ('admin', 'main_admin'));

-- ── 8. Indexes ───────────────────────────────────────────────────────────────
create index if not exists idx_subs_is_flagged     on public.submissions(is_flagged);
create index if not exists idx_announcements_active on public.announcements(is_active);
create index if not exists idx_reward_req_participant on public.reward_requests(participant_id);
create index if not exists idx_reward_req_parent    on public.reward_requests(parent_email);
create index if not exists idx_users_parent_email   on public.users(parent_email);

-- ============================================================
-- Verification queries (run manually to confirm)
-- ============================================================
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'submissions' AND column_name IN ('is_flagged', 'flag_note');
-- SELECT conname, consrc FROM pg_constraint WHERE conname = 'submissions_status_check';
-- SELECT conname, consrc FROM pg_constraint WHERE conname = 'users_role_check';
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('announcements','reward_types','reward_requests');
