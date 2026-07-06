-- ============================================================
-- Star Progress — Supabase Production Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLE: users  (profiles — linked 1:1 with auth.users)
-- id must equal auth.users.id (enforced by trigger below)
-- NOTE: Must be created before get_my_role() which references it
-- ============================================================
create table if not exists public.users (
  id             uuid        primary key references auth.users(id) on delete cascade,
  name           text        not null,
  email          text        not null unique,
  username       text        unique,
  role           text        not null default 'participant'
                             check (role in ('participant', 'admin', 'main_admin')),
  account_status text        not null default 'pending'
                             check (account_status in ('pending', 'active', 'denied', 'suspended')),
  created_at     timestamptz not null default now(),
  avatar_color   text        not null default 'bg-blue-500',
  phone_number   text,
  age            integer     check (age is null or (age >= 10 and age <= 100)),
  date_of_birth  date,
  signup_message text,
  denial_reason  text,
  approved_by    uuid,
  approved_at    timestamptz
);

-- ============================================================
-- HELPER: get the current user's role without causing recursion
-- (defined after users table so the SQL body can be validated)
-- ============================================================
create or replace function public.get_my_role()
returns text
language sql
security definer stable
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

-- ── Trigger: auto-create profile row when auth user signs up ─────────────────
-- This runs with service-role privileges so it works even before email confirm.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (
    id, name, email, username, role, account_status, created_at,
    avatar_color, phone_number, age, date_of_birth, signup_message
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    nullif(new.raw_user_meta_data->>'username', ''),
    coalesce(nullif(new.raw_user_meta_data->>'role', ''), 'participant'),
    'pending',
    now(),
    coalesce(nullif(new.raw_user_meta_data->>'avatar_color', ''), 'bg-blue-500'),
    nullif(new.raw_user_meta_data->>'phone_number', ''),
    case when new.raw_user_meta_data->>'age' is not null and new.raw_user_meta_data->>'age' != ''
         then (new.raw_user_meta_data->>'age')::integer
         else null end,
    case when new.raw_user_meta_data->>'date_of_birth' is not null and new.raw_user_meta_data->>'date_of_birth' != ''
         then (new.raw_user_meta_data->>'date_of_birth')::date
         else null end,
    nullif(new.raw_user_meta_data->>'signup_message', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

-- ============================================================
-- TABLE: activities
-- ============================================================
create table if not exists public.activities (
  id             uuid        primary key default uuid_generate_v4(),
  name           text        not null,
  name_ar        text,
  description    text,
  description_ar text,
  points         integer     not null default 10 check (points > 0),
  icon           text        not null default '📌',
  is_active      boolean     not null default true,
  created_at     timestamptz not null default now()
);

-- ============================================================
-- TABLE: submissions
-- ============================================================
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
  reviewed_by                uuid        references public.users(id),
  activity_date              text,
  source_type                text        default 'activity_submission'
                                         check (source_type in ('activity_submission', 'streak_bonus'))
);

-- ============================================================
-- TABLE: badges
-- ============================================================
create table if not exists public.badges (
  id               uuid    primary key default uuid_generate_v4(),
  name             text    not null,
  name_ar          text,
  required_points  integer not null check (required_points >= 0),
  icon             text    not null default '⭐',
  color            text    not null default 'text-yellow-600',
  bg_color         text    not null default 'bg-yellow-100'
);

-- ============================================================
-- TABLE: notifications  (per-user — user_id is required)
-- ============================================================
create table if not exists public.notifications (
  id                    uuid        primary key default uuid_generate_v4(),
  user_id               uuid        not null references public.users(id) on delete cascade,
  type                  text        not null,
  message               text        not null,
  related_submission_id uuid        references public.submissions(id) on delete set null,
  is_read               boolean     not null default false,
  created_at            timestamptz not null default now()
);

-- ============================================================
-- TABLE: participant_avatar_inventory
-- ============================================================
create table if not exists public.participant_avatar_inventory (
  id             uuid        primary key default uuid_generate_v4(),
  participant_id uuid        not null references public.users(id) on delete cascade,
  item_type      text        not null check (item_type in ('animal', 'accessory', 'color')),
  item_id        text        not null,
  acquired_at    timestamptz not null default now(),
  unique (participant_id, item_type, item_id)
);

-- ============================================================
-- TABLE: participant_avatar_settings
-- ============================================================
create table if not exists public.participant_avatar_settings (
  participant_id         uuid        primary key references public.users(id) on delete cascade,
  equipped_animal_id     text        not null default 'cat',
  equipped_accessory_ids text[]      not null default '{}',
  equipped_color_id      text,
  updated_at             timestamptz not null default now()
);

-- ============================================================
-- TABLE: participant_avatar_wallets
-- ============================================================
create table if not exists public.participant_avatar_wallets (
  participant_id     uuid        primary key references public.users(id) on delete cascade,
  total_spent_points integer     not null default 0,
  updated_at         timestamptz not null default now()
);

-- ============================================================
-- TABLE: streak_settings  (global admin settings)
-- ============================================================
create table if not exists public.streak_settings (
  id                       integer primary key default 1 check (id = 1),
  enabled                  boolean not null default true,
  streak_length_for_bonus  integer not null default 7,
  bonus_points             integer not null default 30,
  updated_at               timestamptz not null default now()
);
insert into public.streak_settings (id, enabled, streak_length_for_bonus, bonus_points)
values (1, true, 7, 30)
on conflict (id) do nothing;

-- ============================================================
-- TABLE: daily_winners
-- ============================================================
create table if not exists public.daily_winners (
  date          text        primary key,
  winner_id     uuid        not null references public.users(id) on delete cascade,
  points        integer     not null,
  determined_at timestamptz not null default now()
);

-- ============================================================
-- TABLE: top_streaks
-- ============================================================
create table if not exists public.top_streaks (
  participant_id   uuid        primary key references public.users(id) on delete cascade,
  current_streak   integer     not null default 0,
  best_streak      integer     not null default 0,
  last_win_date    text        not null default '',
  streak_start_date text       not null default '',
  updated_at       timestamptz not null default now()
);

-- ============================================================
-- TABLE: streak_bonuses
-- ============================================================
create table if not exists public.streak_bonuses (
  id                uuid        primary key default uuid_generate_v4(),
  participant_id    uuid        not null references public.users(id) on delete cascade,
  streak_milestone  integer     not null,
  streak_start_date text        not null,
  bonus_points      integer     not null,
  submission_id     uuid        references public.submissions(id) on delete set null,
  awarded_at        timestamptz not null default now(),
  unique (participant_id, streak_milestone, streak_start_date)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.users                      enable row level security;
alter table public.activities                 enable row level security;
alter table public.submissions                enable row level security;
alter table public.badges                     enable row level security;
alter table public.notifications              enable row level security;
alter table public.participant_avatar_inventory   enable row level security;
alter table public.participant_avatar_settings    enable row level security;
alter table public.participant_avatar_wallets     enable row level security;
alter table public.streak_settings           enable row level security;
alter table public.daily_winners             enable row level security;
alter table public.top_streaks              enable row level security;
alter table public.streak_bonuses           enable row level security;

-- ── Drop existing policies before recreating ────────────────────────────────
do $$ declare
  r record;
begin
  for r in (select tablename, policyname from pg_policies where schemaname = 'public') loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- ── USERS policies ───────────────────────────────────────────────────────────
-- Any authenticated user can read all users (UI enforces field visibility)
create policy "authenticated_read_users" on public.users
  for select to authenticated
  using (true);

-- Users can update only their own non-sensitive fields
create policy "own_update_limited_fields" on public.users
  for update to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select role from public.users where id = auth.uid())  -- cannot self-escalate role
  );

-- Admins can update any user's account_status (approve/deny/suspend)
create policy "admin_update_users" on public.users
  for update to authenticated
  using (get_my_role() in ('admin', 'main_admin'));

-- Only main_admin can update roles
-- (enforced in app logic; add DB enforcement via trigger if needed)

-- ── ACTIVITIES policies ──────────────────────────────────────────────────────
create policy "public_read_activities" on public.activities
  for select using (true);

create policy "admin_write_activities" on public.activities
  for all to authenticated
  using (get_my_role() in ('admin', 'main_admin'))
  with check (get_my_role() in ('admin', 'main_admin'));

-- ── SUBMISSIONS policies ─────────────────────────────────────────────────────
-- Participants can read their own; admins can read all
create policy "read_submissions" on public.submissions
  for select to authenticated
  using (
    participant_id = auth.uid()
    or get_my_role() in ('admin', 'main_admin')
  );

-- Participants can create their own submissions
create policy "participant_insert_submissions" on public.submissions
  for insert to authenticated
  with check (participant_id = auth.uid());

-- Admins can update submission status (approve/deny)
create policy "admin_update_submissions" on public.submissions
  for update to authenticated
  using (get_my_role() in ('admin', 'main_admin'))
  with check (get_my_role() in ('admin', 'main_admin'));

-- Admins can delete submissions
create policy "admin_delete_submissions" on public.submissions
  for delete to authenticated
  using (get_my_role() in ('admin', 'main_admin'));

-- ── BADGES policies ──────────────────────────────────────────────────────────
create policy "public_read_badges" on public.badges
  for select using (true);

create policy "admin_write_badges" on public.badges
  for all to authenticated
  using (get_my_role() in ('admin', 'main_admin'))
  with check (get_my_role() in ('admin', 'main_admin'));

-- ── NOTIFICATIONS policies ───────────────────────────────────────────────────
-- Users can only read their own notifications
create policy "own_read_notifications" on public.notifications
  for select to authenticated
  using (user_id = auth.uid());

-- Users and admins can insert notifications
-- Users: insert for themselves (streak bonuses)
-- Admins: insert for any user (approval/denial messages)
create policy "insert_notifications" on public.notifications
  for insert to authenticated
  with check (
    user_id = auth.uid()
    or get_my_role() in ('admin', 'main_admin')
  );

-- Users can mark their own notifications as read
create policy "own_update_notifications" on public.notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── AVATAR policies ──────────────────────────────────────────────────────────
create policy "own_avatar_inventory" on public.participant_avatar_inventory
  for all to authenticated
  using (participant_id = auth.uid())
  with check (participant_id = auth.uid());

create policy "own_avatar_settings" on public.participant_avatar_settings
  for all to authenticated
  using (participant_id = auth.uid())
  with check (participant_id = auth.uid());

create policy "own_avatar_wallet" on public.participant_avatar_wallets
  for all to authenticated
  using (participant_id = auth.uid())
  with check (participant_id = auth.uid());

-- ── STREAK policies ──────────────────────────────────────────────────────────
-- Streak settings: all authenticated can read; admins can update
create policy "read_streak_settings" on public.streak_settings
  for select to authenticated using (true);

create policy "admin_write_streak_settings" on public.streak_settings
  for all to authenticated
  using (get_my_role() in ('admin', 'main_admin'))
  with check (get_my_role() in ('admin', 'main_admin'));

-- Daily winners: all authenticated can read
create policy "read_daily_winners" on public.daily_winners
  for select to authenticated using (true);

create policy "admin_write_daily_winners" on public.daily_winners
  for all to authenticated
  using (get_my_role() in ('admin', 'main_admin'))
  with check (get_my_role() in ('admin', 'main_admin'));

-- Top streaks: all authenticated can read
create policy "read_top_streaks" on public.top_streaks
  for select to authenticated using (true);

create policy "write_top_streaks" on public.top_streaks
  for all to authenticated
  using (
    participant_id = auth.uid()
    or get_my_role() in ('admin', 'main_admin')
  )
  with check (
    participant_id = auth.uid()
    or get_my_role() in ('admin', 'main_admin')
  );

-- Streak bonuses: own read; admins all
create policy "read_streak_bonuses" on public.streak_bonuses
  for select to authenticated
  using (
    participant_id = auth.uid()
    or get_my_role() in ('admin', 'main_admin')
  );

create policy "write_streak_bonuses" on public.streak_bonuses
  for all to authenticated
  using (
    participant_id = auth.uid()
    or get_my_role() in ('admin', 'main_admin')
  )
  with check (
    participant_id = auth.uid()
    or get_my_role() in ('admin', 'main_admin')
  );

-- ============================================================
-- PUBLIC LEADERBOARD VIEW (safe fields only)
-- ============================================================
create or replace view public.leaderboard_participants as
select
  u.id,
  u.name,
  u.avatar_color,
  coalesce(sum(case when s.status = 'accepted' then s.points_value_at_submission else 0 end), 0) as total_accepted_points
from public.users u
left join public.submissions s on s.participant_id = u.id and s.status = 'accepted'
where u.role = 'participant' and u.account_status = 'active'
group by u.id, u.name, u.avatar_color;

grant select on public.leaderboard_participants to authenticated;

-- ============================================================
-- PERFORMANCE INDEXES
-- ============================================================
create index if not exists idx_users_email         on public.users(email);
create index if not exists idx_users_username      on public.users(username);
create index if not exists idx_users_role          on public.users(role);
create index if not exists idx_users_status        on public.users(account_status);
create index if not exists idx_subs_participant    on public.submissions(participant_id);
create index if not exists idx_subs_status         on public.submissions(status);
create index if not exists idx_subs_at             on public.submissions(submitted_at desc);
create index if not exists idx_subs_activity_date  on public.submissions(activity_date);
create index if not exists idx_notif_user          on public.notifications(user_id);
create index if not exists idx_notif_read          on public.notifications(is_read);
create index if not exists idx_streak_participant  on public.top_streaks(participant_id);

-- ============================================================
-- INITIAL SEED DATA — activities and badges
-- (Users are created via Supabase Auth signup)
-- ============================================================
insert into public.activities (id, name, name_ar, description, points, icon, is_active)
values
  ('00000000-0000-0000-0001-000000000001', 'Reading a Book',          'قراءة كتاب',         'Read any educational or literary book',              5,  '📚', true),
  ('00000000-0000-0000-0001-000000000002', 'Writing',                 'الكتابة',             'Write essays, stories, or journals',                 8,  '✏️', true),
  ('00000000-0000-0000-0001-000000000003', 'Practicing قدرات',        'تدريب قدرات',         'Practice قدرات exam questions',                      15, '🧠', true),
  ('00000000-0000-0000-0001-000000000004', 'Practicing تحصيلي',       'تدريب تحصيلي',        'Practice تحصيلي exam questions',                     10, '📝', true),
  ('00000000-0000-0000-0001-000000000005', 'Practicing IELTS',        'تدريب آيلتس',         'Practice IELTS reading, writing, or speaking',       10, '🌐', true),
  ('00000000-0000-0000-0001-000000000006', 'Drawing',                 'الرسم',               'Draw or sketch any artwork',                         7,  '🎨', true),
  ('00000000-0000-0000-0001-000000000007', 'Exercise & Sports',       'الرياضة',             'Physical exercise or sports activity',               10, '🏃', true),
  ('00000000-0000-0000-0001-000000000008', 'Volunteering',            'التطوع',              'Community service or volunteering work',              15, '🤝', true),
  ('00000000-0000-0000-0001-000000000009', 'Learning a New Skill',    'تعلم مهارة جديدة',   'Learn any new practical skill',                      15, '💡', true),
  ('00000000-0000-0000-0001-000000000010', 'Meditation & Mindfulness','التأمل والتركيز',     'Mindfulness or meditation session',                  8,  '🧘', true)
on conflict (id) do nothing;

insert into public.badges (id, name, name_ar, required_points, icon, color, bg_color)
values
  ('00000000-0000-0000-0002-000000000001', 'Beginner',    'مبتدئ',    50,   '🌱', 'text-green-600',  'bg-green-100'),
  ('00000000-0000-0000-0002-000000000002', 'Rising Star', 'نجم صاعد', 150,  '⭐', 'text-yellow-600', 'bg-yellow-100'),
  ('00000000-0000-0000-0002-000000000003', 'Champion',    'بطل',      600,  '🏆', 'text-orange-600', 'bg-orange-100'),
  ('00000000-0000-0000-0002-000000000004', 'Legend',      'أسطورة',   1500, '👑', 'text-purple-600', 'bg-purple-100')
on conflict (id) do nothing;

-- ============================================================
-- TRIGGER: notify main_admin when a new pending user signs up
-- Runs SECURITY DEFINER so it can bypass RLS and insert a
-- notification targeted at the main_admin without the new user
-- needing insert permission for other users' notifications.
-- ============================================================
create or replace function public.notify_admin_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_id uuid;
begin
  -- Find the first main_admin
  select id into admin_id
  from public.users
  where role = 'main_admin'
  limit 1;

  if admin_id is not null then
    insert into public.notifications (user_id, type, message, is_read, created_at)
    values (
      admin_id,
      'new_signup',
      'New ' || NEW.role || ' account request from ' || NEW.name ||
        case when NEW.username is not null then ' (@' || NEW.username || ')' else '' end || '.',
      false,
      now()
    );
  end if;

  return NEW;
end;
$$;

drop trigger if exists on_new_pending_signup on public.users;
create trigger on_new_pending_signup
  after insert on public.users
  for each row
  when (NEW.account_status = 'pending')
  execute procedure public.notify_admin_on_signup();

-- ============================================================
-- SECURITY NOTES
-- ============================================================
-- 1. NEVER put SUPABASE_SERVICE_ROLE_KEY in frontend code.
-- 2. Only VITE_SUPABASE_ANON_KEY is safe for the frontend.
-- 3. Passwords are managed entirely by Supabase Auth — no password_hash column.
-- 4. Column-level privacy: email/phone/DOB are in the users table but never
--    exposed via the UI to other participants. For stricter isolation, add
--    column-level grants or use the leaderboard_participants view.
-- 5. Main Admin account: sign up via /signup/admin, then manually run:
--    update public.users set role = 'main_admin', account_status = 'active'
--    where email = 'your-admin@email.com';
-- 6. All activity and badge seed data is included in this file.
