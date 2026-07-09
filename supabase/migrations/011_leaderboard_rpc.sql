-- Migration 011: Safe leaderboard RPC
--
-- Root cause: The submissions RLS policy restricts participants to only read
-- their own rows (participant_id = auth.uid()). The frontend computes leaderboard
-- points client-side from the local submissions array, which contains 0 rows
-- for other participants — so every other participant shows 0 pts.
--
-- Fix: SECURITY DEFINER function that bypasses RLS and returns only the three
-- safe fields needed for leaderboard calculation. No notes, emails, or private
-- data are exposed. Only accepted submissions for active non-deleted participants
-- are returned.

create or replace function public.get_leaderboard_data()
returns table (
  participant_id uuid,
  points_value   int,
  submitted_at   timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select
    s.participant_id,
    s.points_value_at_submission as points_value,
    s.submitted_at
  from public.submissions s
  join public.users u on u.id = s.participant_id
  where s.status = 'accepted'
    and u.role = 'participant'
    and u.account_status = 'active'
    and u.is_deleted = false;
$$;

grant execute on function public.get_leaderboard_data() to authenticated;
