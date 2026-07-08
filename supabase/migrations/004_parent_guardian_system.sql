-- ============================================================
-- Migration 004 — Parent / Guardian Access System
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- Safe to run multiple times (IF NOT EXISTS / OR REPLACE)
-- ============================================================

-- ── 1. parent_child_links ────────────────────────────────────────────────────
create table if not exists public.parent_child_links (
  id               uuid primary key default gen_random_uuid(),
  parent_id        uuid not null references public.users(id) on delete cascade,
  participant_id   uuid not null references public.users(id) on delete cascade,
  relationship_type text not null default 'guardian'
    check (relationship_type in ('father','mother','guardian','older_sibling','relative','other')),
  status           text not null default 'pending'
    check (status in ('pending','approved','denied','revoked')),
  permissions      jsonb not null default '{
    "viewPoints": true,
    "viewLevel": true,
    "viewBadges": true,
    "viewAnimals": true,
    "viewApprovedActivities": true,
    "viewPendingActivities": false,
    "viewDeniedActivities": false,
    "viewProofImages": false,
    "viewRewardRequests": true,
    "approveRewardRequests": true,
    "denyRewardRequests": true,
    "addParentNote": true,
    "viewRewardHistory": true,
    "createCustomRewards": false,
    "receiveEmailMilestone": true,
    "receiveEmailLevel": true,
    "receiveEmailBadge": true,
    "receiveEmailAnimal": false,
    "receiveEmailReward": true,
    "receiveEmailPenalty": false
  }'::jsonb,
  requested_by     text not null default 'parent'
    check (requested_by in ('parent','admin','main_admin')),
  approved_by      uuid references public.users(id),
  approved_at      timestamptz,
  revoked_by       uuid references public.users(id),
  revoked_at       timestamptz,
  admin_note       text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique(parent_id, participant_id)
);

-- ── 2. parent_access_requests ────────────────────────────────────────────────
create table if not exists public.parent_access_requests (
  id                       uuid primary key default gen_random_uuid(),
  parent_id                uuid not null references public.users(id) on delete cascade,
  requested_child_username text,
  requested_child_code     text,
  matched_participant_id   uuid references public.users(id),
  relationship_type        text not null default 'guardian'
    check (relationship_type in ('father','mother','guardian','older_sibling','relative','other')),
  request_message          text,
  status                   text not null default 'pending'
    check (status in ('pending','approved','denied','more_info_needed','cancelled','revoked')),
  reviewed_by              uuid references public.users(id),
  review_note              text,
  created_at               timestamptz not null default now(),
  reviewed_at              timestamptz
);

-- ── 3. child_connection_codes ────────────────────────────────────────────────
create table if not exists public.child_connection_codes (
  id             uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.users(id) on delete cascade,
  code           text not null unique,
  status         text not null default 'active'
    check (status in ('active','used','expired','revoked')),
  expires_at     timestamptz,
  created_at     timestamptz not null default now(),
  created_by     uuid references public.users(id),
  unique(participant_id)
);

-- ── 4. RLS ───────────────────────────────────────────────────────────────────
alter table public.parent_child_links    enable row level security;
alter table public.parent_access_requests enable row level security;
alter table public.child_connection_codes enable row level security;

-- parent_child_links
drop policy if exists "parent_child_links_select" on public.parent_child_links;
create policy "parent_child_links_select" on public.parent_child_links
  for select using (
    auth.uid() = parent_id or
    auth.uid() = participant_id or
    exists (select 1 from public.users where id = auth.uid() and role in ('admin','main_admin'))
  );

drop policy if exists "parent_child_links_insert" on public.parent_child_links;
create policy "parent_child_links_insert" on public.parent_child_links
  for insert with check (
    exists (select 1 from public.users where id = auth.uid() and role in ('admin','main_admin'))
  );

drop policy if exists "parent_child_links_update" on public.parent_child_links;
create policy "parent_child_links_update" on public.parent_child_links
  for update using (
    exists (select 1 from public.users where id = auth.uid() and role in ('admin','main_admin'))
  );

-- parent_access_requests
drop policy if exists "par_select" on public.parent_access_requests;
create policy "par_select" on public.parent_access_requests
  for select using (
    auth.uid() = parent_id or
    exists (select 1 from public.users where id = auth.uid() and role in ('admin','main_admin'))
  );

drop policy if exists "par_insert" on public.parent_access_requests;
create policy "par_insert" on public.parent_access_requests
  for insert with check (auth.uid() = parent_id);

drop policy if exists "par_update" on public.parent_access_requests;
create policy "par_update" on public.parent_access_requests
  for update using (
    auth.uid() = parent_id or
    exists (select 1 from public.users where id = auth.uid() and role in ('admin','main_admin'))
  );

-- child_connection_codes
drop policy if exists "codes_select_own" on public.child_connection_codes;
create policy "codes_select_own" on public.child_connection_codes
  for select using (
    auth.uid() = participant_id or
    auth.uid() = created_by or
    exists (select 1 from public.users where id = auth.uid() and role in ('admin','main_admin'))
  );

drop policy if exists "codes_insert" on public.child_connection_codes;
create policy "codes_insert" on public.child_connection_codes
  for insert with check (
    auth.uid() = participant_id or
    exists (select 1 from public.users where id = auth.uid() and role in ('admin','main_admin'))
  );

drop policy if exists "codes_update" on public.child_connection_codes;
create policy "codes_update" on public.child_connection_codes
  for update using (
    auth.uid() = participant_id or
    exists (select 1 from public.users where id = auth.uid() and role in ('admin','main_admin'))
  );

-- ── 5. Indexes ───────────────────────────────────────────────────────────────
create index if not exists idx_pcl_parent_id      on public.parent_child_links(parent_id);
create index if not exists idx_pcl_participant_id on public.parent_child_links(participant_id);
create index if not exists idx_pcl_status         on public.parent_child_links(status);
create index if not exists idx_par_parent_id      on public.parent_access_requests(parent_id);
create index if not exists idx_par_status         on public.parent_access_requests(status);
create index if not exists idx_ccc_participant_id on public.child_connection_codes(participant_id);
create index if not exists idx_ccc_code           on public.child_connection_codes(code);

-- ── 6. generate_connection_code() RPC ────────────────────────────────────────
create or replace function public.generate_connection_code(p_participant_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code        text;
  v_caller_role text;
begin
  select role into v_caller_role from public.users where id = auth.uid();
  if auth.uid() != p_participant_id and v_caller_role not in ('admin','main_admin') then
    raise exception 'Not authorized to generate a connection code for this participant';
  end if;

  v_code := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8));

  insert into public.child_connection_codes
    (participant_id, code, status, expires_at, created_by)
  values
    (p_participant_id, v_code, 'active', now() + interval '30 days', auth.uid())
  on conflict (participant_id) do update
    set code       = v_code,
        status     = 'active',
        expires_at = now() + interval '30 days',
        created_by = auth.uid(),
        created_at = now();

  return v_code;
end;
$$;

grant execute on function public.generate_connection_code(uuid) to authenticated;

-- ── 7. lookup_connection_code() RPC — used by parent during access request ────
create or replace function public.lookup_connection_code(p_code text)
returns table(participant_id uuid, participant_username text, participant_name text)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select c.participant_id, u.username, u.name
    from   public.child_connection_codes c
    join   public.users u on u.id = c.participant_id
    where  upper(c.code) = upper(p_code)
      and  c.status = 'active'
      and  (c.expires_at is null or c.expires_at > now());
end;
$$;

grant execute on function public.lookup_connection_code(text) to authenticated;

-- ── 8. Realtime for new tables ───────────────────────────────────────────────
alter publication supabase_realtime add table public.parent_child_links;
alter publication supabase_realtime add table public.parent_access_requests;
