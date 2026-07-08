-- 005_streak_overhaul.sql
-- Safe additive migration. Does NOT delete existing streak, points, badge, or participant data.

-- ── Streak rules: configurable streak types managed by main admin ─────────────
create table if not exists public.streak_rules (
  id                    uuid        primary key default uuid_generate_v4(),
  name                  text        not null,
  description           text        not null default '',
  type                  text        not null default 'daily_action'
                                    check (type in ('daily_action', 'specific_activities', 'top_hero')),
  activity_ids          uuid[]      not null default '{}',
  require_approved      boolean     not null default true,
  grace_days_enabled    boolean     not null default false,
  grace_days_allowed    integer     not null default 1
                                    check (grace_days_allowed >= 0 and grace_days_allowed <= 7),
  cheat_penalty_breaks  boolean     not null default true,
  duplicate_days_allowed boolean    not null default false,
  is_active             boolean     not null default true,
  created_by            uuid        references public.users(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ── Streak milestones: milestone rewards per rule ────────────────────────────
create table if not exists public.streak_milestones (
  id              uuid        primary key default uuid_generate_v4(),
  rule_id         uuid        not null references public.streak_rules(id) on delete cascade,
  days_required   integer     not null check (days_required >= 1),
  bonus_points    integer     not null check (bonus_points >= 0),
  badge_id        uuid        references public.badges(id) on delete set null,
  unique (rule_id, days_required)
);

-- ── Streak audit logs ────────────────────────────────────────────────────────
create table if not exists public.streak_audit_logs (
  id              uuid        primary key default uuid_generate_v4(),
  participant_id  uuid        references public.users(id) on delete cascade,
  rule_id         uuid        references public.streak_rules(id) on delete cascade,
  action          text        not null
                              check (action in ('manual_adjust', 'manual_reset', 'reward_reversed', 'grace_used', 'penalty_applied')),
  old_value       integer     not null default 0,
  new_value       integer     not null default 0,
  reason          text        not null,
  performed_by    uuid        references public.users(id) on delete set null,
  performed_by_name text,
  created_at      timestamptz not null default now()
);

-- ── Enable RLS ───────────────────────────────────────────────────────────────
alter table public.streak_rules enable row level security;
alter table public.streak_milestones enable row level security;
alter table public.streak_audit_logs enable row level security;

-- streak_rules: all authenticated users can read; admins can write
drop policy if exists "read_streak_rules" on public.streak_rules;
create policy "read_streak_rules" on public.streak_rules
  for select to authenticated using (true);

drop policy if exists "admin_write_streak_rules" on public.streak_rules;
create policy "admin_write_streak_rules" on public.streak_rules
  for all to authenticated
  using (get_my_role() in ('admin', 'main_admin'))
  with check (get_my_role() in ('admin', 'main_admin'));

-- streak_milestones: same as rules
drop policy if exists "read_streak_milestones" on public.streak_milestones;
create policy "read_streak_milestones" on public.streak_milestones
  for select to authenticated using (true);

drop policy if exists "admin_write_streak_milestones" on public.streak_milestones;
create policy "admin_write_streak_milestones" on public.streak_milestones
  for all to authenticated
  using (get_my_role() in ('admin', 'main_admin'))
  with check (get_my_role() in ('admin', 'main_admin'));

-- streak_audit_logs: admins can read and insert
drop policy if exists "admin_read_audit_logs" on public.streak_audit_logs;
create policy "admin_read_audit_logs" on public.streak_audit_logs
  for select to authenticated using (get_my_role() in ('admin', 'main_admin'));

drop policy if exists "admin_insert_audit_logs" on public.streak_audit_logs;
create policy "admin_insert_audit_logs" on public.streak_audit_logs
  for insert to authenticated with check (get_my_role() in ('admin', 'main_admin'));

-- ── Default rule: Daily Action Streak ────────────────────────────────────────
insert into public.streak_rules (
  id, name, description, type, activity_ids,
  require_approved, grace_days_enabled, grace_days_allowed,
  cheat_penalty_breaks, duplicate_days_allowed, is_active
) values (
  '00000000-0000-0000-0010-000000000001',
  'Daily Action Streak',
  'Complete at least one approved Hero Action each day to build your streak.',
  'daily_action',
  '{}',
  true, false, 1, true, false, true
) on conflict (id) do nothing;

insert into public.streak_milestones (rule_id, days_required, bonus_points) values
  ('00000000-0000-0000-0010-000000000001', 3,  5),
  ('00000000-0000-0000-0010-000000000001', 5,  10),
  ('00000000-0000-0000-0010-000000000001', 7,  20),
  ('00000000-0000-0000-0010-000000000001', 14, 30),
  ('00000000-0000-0000-0010-000000000001', 30, 60)
on conflict (rule_id, days_required) do nothing;
