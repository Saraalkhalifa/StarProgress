-- Migration 014: Performance indexes for submissions queries
--
-- Problem: The submissions table has single-column indexes on participant_id,
-- status, and submitted_at separately, but the most common query pattern is
-- "participant's records ordered by date" which benefits from a composite index.
-- The admin Progress Records page also scans by (activity_id) and (status).
--
-- All indexes use IF NOT EXISTS — safe to run multiple times, no data changes.

-- Composite index for participant progress pages (participant + date)
-- Covers: WHERE participant_id = ? ORDER BY submitted_at DESC
create index if not exists idx_subs_participant_at
  on public.submissions(participant_id, submitted_at desc);

-- Composite index for admin filtering by participant + status
-- Covers: WHERE participant_id = ? AND status = ?
create index if not exists idx_subs_participant_status
  on public.submissions(participant_id, status);

-- Index for activity-based filtering
create index if not exists idx_subs_activity_id
  on public.submissions(activity_id);

-- ============================================================
-- Instructions: run in Supabase Dashboard → SQL Editor → New Query
-- Safe to run multiple times (IF NOT EXISTS)
-- No data is modified or deleted
-- ============================================================
