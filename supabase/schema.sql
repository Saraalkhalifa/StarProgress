-- Star Progress — run this entire file in Supabase SQL Editor once

-- ── Tables ───────────────────────────────────────────────────────────────────

create table if not exists users (
  id              text primary key,
  name            text not null,
  email           text,
  username        text unique,
  password_hash   text not null,
  role            text not null check (role in ('participant', 'admin', 'main_admin')),
  account_status  text not null default 'pending'
                    check (account_status in ('pending', 'active', 'denied')),
  created_at      timestamptz not null default now(),
  avatar_color    text not null default 'bg-blue-500'
);

create table if not exists activities (
  id          text primary key,
  name        text not null,
  name_ar     text,
  description text,
  points      int  not null default 0,
  icon        text,
  is_active   bool not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists submissions (
  id                          text primary key,
  participant_id              text not null references users(id) on delete cascade,
  activity_id                 text references activities(id) on delete set null,
  note                        text,
  points_value_at_submission  int  not null default 0,
  status                      text not null default 'pending'
                                check (status in ('pending', 'accepted', 'denied')),
  admin_comment               text,
  submitted_at                timestamptz not null default now(),
  reviewed_at                 timestamptz,
  reviewed_by                 text references users(id) on delete set null
);

create table if not exists badges (
  id              text primary key,
  name            text not null,
  required_points int  not null default 0,
  icon            text,
  color           text,
  bg_color        text
);

create table if not exists notifications (
  id                      text primary key,
  type                    text not null,
  message                 text not null,
  related_submission_id   text,
  is_read                 bool not null default false,
  created_at              timestamptz not null default now()
);

-- ── Row Level Security ────────────────────────────────────────────────────────
-- The app uses its own auth layer (username + hashed password).
-- These open policies allow the anon key to read/write all tables.
-- Access control is enforced by the React app, not by Supabase JWT.

alter table users         enable row level security;
alter table activities    enable row level security;
alter table submissions   enable row level security;
alter table badges        enable row level security;
alter table notifications enable row level security;

create policy "app access" on users         for all to anon using (true) with check (true);
create policy "app access" on activities    for all to anon using (true) with check (true);
create policy "app access" on submissions   for all to anon using (true) with check (true);
create policy "app access" on badges        for all to anon using (true) with check (true);
create policy "app access" on notifications for all to anon using (true) with check (true);
