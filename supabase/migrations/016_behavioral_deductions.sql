-- ============================================================
-- Migration 016 — Behavioral Deduction System
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- Safe to run multiple times (IF NOT EXISTS / OR REPLACE)
-- ============================================================

-- ── 1. behavior_categories ───────────────────────────────────────────────────
create table if not exists public.behavior_categories (
  id                  text primary key,
  name                text not null,
  name_ar             text not null default '',
  rec_min             integer not null default 5  check (rec_min >= 1),
  rec_max             integer not null default 25 check (rec_max >= rec_min),
  max_allowed         integer not null default 50 check (max_allowed >= rec_max),
  requires_evidence   boolean not null default false,
  requires_admin_review boolean not null default false,
  is_active           boolean not null default true,
  sort_order          integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Seed default categories (safe: ON CONFLICT DO NOTHING)
insert into public.behavior_categories
  (id, name, name_ar, rec_min, rec_max, max_allowed, requires_evidence, requires_admin_review, is_active, sort_order)
values
  ('cat_disrespect', 'Disrespectful behavior',               'سلوك غير محترم',                5,  25,  50,  false, false, true, 1),
  ('cat_cursing',    'Cursing or offensive language',        'ألفاظ بذيئة أو مسيئة',         20, 40,  75,  false, false, true, 2),
  ('cat_insulting',  'Insulting another person',             'إهانة شخص آخر',                20, 40,  75,  false, false, true, 3),
  ('cat_bullying',   'Bullying or harassment',               'التنمر أو المضايقة',            40, 100, 100, true,  true,  true, 4),
  ('cat_lying',      'Lying or dishonesty',                  'الكذب أو عدم الصدق',           15, 30,  60,  false, false, true, 5),
  ('cat_cheating',   'Cheating in the competition',          'الغش في المسابقة',             50, 100, 100, true,  true,  true, 6),
  ('cat_falsifying', 'Falsifying activity evidence',         'تزوير دليل النشاط',            30, 75,  100, true,  true,  true, 7),
  ('cat_unsafe',     'Unsafe or harmful behavior',           'سلوك غير آمن أو ضار',          50, 100, 100, false, true,  true, 8),
  ('cat_property',   'Damaging property',                    'إتلاف الممتلكات',              20, 50,  100, true,  false, true, 9),
  ('cat_rules',      'Breaking family or competition rules', 'مخالفة قواعد الأسرة أو المسابقة', 5, 15, 30, false, false, true, 10),
  ('cat_repeated',   'Repeated misconduct',                  'سوء السلوك المتكرر',           15, 25,  50,  false, false, true, 11),
  ('cat_other',      'Other',                                'أخرى',                          5,  50,  100, false, false, true, 12)
on conflict (id) do nothing;

-- ── 2. behavioral_deductions ─────────────────────────────────────────────────
create table if not exists public.behavioral_deductions (
  id                      uuid primary key default gen_random_uuid(),
  idempotency_key         text unique,
  participant_id          uuid not null references public.users(id) on delete cascade,
  participant_name_snap   text not null default '',
  category_id             text not null references public.behavior_categories(id),
  category_label_snap     text not null default '',
  points_deducted         integer not null check (points_deducted >= 1),
  reason                  text not null,
  internal_note           text,
  evidence_note           text,
  incident_date           date not null,
  incident_time           text,
  issuer_id               uuid references public.users(id),
  issuer_role             text not null check (issuer_role in ('admin','main_admin','parent')),
  issuer_name_snap        text not null default '',
  status                  text not null default 'pending_review'
    check (status in ('pending_review','active','reversed','rejected')),
  approval_status         text not null default 'pending'
    check (approval_status in ('pending','approved','rejected')),
  acknowledgment_status   text not null default 'not_viewed'
    check (acknowledgment_status in ('not_viewed','viewed','acknowledged')),
  reversed_at             timestamptz,
  reversed_by             uuid references public.users(id),
  reversal_reason         text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists idx_behavioral_deductions_participant on public.behavioral_deductions(participant_id);
create index if not exists idx_behavioral_deductions_status on public.behavioral_deductions(status);
create index if not exists idx_behavioral_deductions_issuer on public.behavioral_deductions(issuer_id);
create index if not exists idx_behavioral_deductions_created on public.behavioral_deductions(created_at desc);

-- ── 3. deduction_audit_log ───────────────────────────────────────────────────
create table if not exists public.deduction_audit_log (
  id              uuid primary key default gen_random_uuid(),
  deduction_id    uuid references public.behavioral_deductions(id) on delete set null,
  action          text not null,
  actor_id        uuid references public.users(id),
  actor_role      text,
  participant_id  uuid references public.users(id),
  previous_values jsonb,
  new_values      jsonb,
  note            text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_deduction_audit_deduction on public.deduction_audit_log(deduction_id);
create index if not exists idx_deduction_audit_participant on public.deduction_audit_log(participant_id);

-- ── 4. updated_at triggers ───────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_behavior_categories_updated_at'
  ) then
    create trigger trg_behavior_categories_updated_at
      before update on public.behavior_categories
      for each row execute procedure public.set_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_behavioral_deductions_updated_at'
  ) then
    create trigger trg_behavioral_deductions_updated_at
      before update on public.behavioral_deductions
      for each row execute procedure public.set_updated_at();
  end if;
end $$;

-- ── 5. Row Level Security ─────────────────────────────────────────────────────

alter table public.behavior_categories     enable row level security;
alter table public.behavioral_deductions   enable row level security;
alter table public.deduction_audit_log     enable row level security;

-- behavior_categories: everyone can read active categories; only admin/main_admin can write
drop policy if exists "behavior_categories_read" on public.behavior_categories;
create policy "behavior_categories_read" on public.behavior_categories
  for select using (is_active = true or (
    exists (select 1 from public.users where id = auth.uid() and role in ('admin','main_admin'))
  ));

drop policy if exists "behavior_categories_write" on public.behavior_categories;
create policy "behavior_categories_write" on public.behavior_categories
  for all using (
    exists (select 1 from public.users where id = auth.uid() and role in ('admin','main_admin'))
  );

-- behavioral_deductions: main_admin sees all; admin sees all; parent sees only linked children; participant sees own
drop policy if exists "deductions_main_admin_all" on public.behavioral_deductions;
create policy "deductions_main_admin_all" on public.behavioral_deductions
  for all using (
    exists (select 1 from public.users where id = auth.uid() and role = 'main_admin')
  );

drop policy if exists "deductions_admin_all" on public.behavioral_deductions;
create policy "deductions_admin_all" on public.behavioral_deductions
  for select using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

drop policy if exists "deductions_admin_write" on public.behavioral_deductions;
create policy "deductions_admin_write" on public.behavioral_deductions
  for insert with check (
    exists (select 1 from public.users where id = auth.uid() and role in ('admin','main_admin'))
  );

drop policy if exists "deductions_admin_update" on public.behavioral_deductions;
create policy "deductions_admin_update" on public.behavioral_deductions
  for update using (
    exists (select 1 from public.users where id = auth.uid() and role in ('admin','main_admin'))
  );

drop policy if exists "deductions_parent_linked" on public.behavioral_deductions;
create policy "deductions_parent_linked" on public.behavioral_deductions
  for all using (
    exists (
      select 1 from public.parent_child_links pcl
      where pcl.parent_id = auth.uid()
        and pcl.participant_id = behavioral_deductions.participant_id
        and pcl.status = 'approved'
    )
  );

drop policy if exists "deductions_participant_own" on public.behavioral_deductions;
create policy "deductions_participant_own" on public.behavioral_deductions
  for select using (participant_id = auth.uid());

drop policy if exists "deductions_participant_ack" on public.behavioral_deductions;
create policy "deductions_participant_ack" on public.behavioral_deductions
  for update using (
    participant_id = auth.uid()
  ) with check (
    -- participants can only update acknowledgment_status, nothing else
    participant_id = auth.uid()
  );

-- deduction_audit_log: main_admin sees all; admin sees all; no participant access
drop policy if exists "audit_log_admin_read" on public.deduction_audit_log;
create policy "audit_log_admin_read" on public.deduction_audit_log
  for select using (
    exists (select 1 from public.users where id = auth.uid() and role in ('admin','main_admin'))
  );

drop policy if exists "audit_log_admin_write" on public.deduction_audit_log;
create policy "audit_log_admin_write" on public.deduction_audit_log
  for insert with check (
    exists (select 1 from public.users where id = auth.uid() and role in ('admin','main_admin','parent'))
  );

-- ── Rollback SQL (keep commented out unless needed) ───────────────────────────
-- drop table if exists public.deduction_audit_log;
-- drop table if exists public.behavioral_deductions;
-- drop table if exists public.behavior_categories;
