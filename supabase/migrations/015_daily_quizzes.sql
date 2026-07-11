-- ============================================================
-- Migration 015 — Daily Quizzes feature
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- Safe to run multiple times (IF NOT EXISTS / DROP POLICY IF EXISTS)
-- ============================================================

-- ── 1. TABLE: quizzes ────────────────────────────────────────────────────────
create table if not exists public.quizzes (
  id                           uuid        primary key default uuid_generate_v4(),
  title                        text        not null,
  description                  text,
  subject                      text        not null check (subject in ('math', 'science', 'english')),
  difficulty                   text        not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  status                       text        not null default 'draft' check (status in ('draft', 'active', 'closed', 'archived', 'hidden')),
  available_date               date,
  end_date                     date,
  allow_retries                boolean     not null default true,
  max_attempts                 integer     not null default 3,
  points_mode                  text        not null default 'best_attempt' check (points_mode in ('best_attempt', 'first_attempt', 'every_attempt')),
  show_answers_after_submit    boolean     not null default false,
  show_explanations_after_submit boolean   not null default false,
  full_score_bonus_points      integer     not null default 0,
  minimum_score_for_points     integer     not null default 0,
  time_limit_minutes           integer,
  randomize_questions          boolean     not null default false,
  randomize_options            boolean     not null default false,
  created_by                   uuid        not null references public.users(id),
  created_at                   timestamptz not null default now(),
  updated_at                   timestamptz not null default now()
);

alter table public.quizzes enable row level security;

-- Permissive: app enforces access control in application code
-- (JWT sessions are not reliable for anon-key Supabase setups)
drop policy if exists "participants_read_active_quizzes" on public.quizzes;
drop policy if exists "main_admin_write_quizzes" on public.quizzes;
drop policy if exists "public_rw_quizzes" on public.quizzes;
create policy "public_rw_quizzes" on public.quizzes
  for all using (true) with check (true);

-- ── 2. TABLE: quiz_questions ─────────────────────────────────────────────────
create table if not exists public.quiz_questions (
  id                    uuid        primary key default uuid_generate_v4(),
  quiz_id               uuid        not null references public.quizzes(id) on delete cascade,
  question_text         text        not null,
  question_type         text        not null check (question_type in ('multiple_choice', 'true_false', 'fill_blank', 'short_answer')),
  points                integer     not null default 1,
  correct_answer        text,
  explanation           text,
  hint                  text,
  image_url             text,
  order_index           integer     not null default 0,
  active                boolean     not null default true,
  requires_manual_review boolean    not null default false,
  allow_partial_credit  boolean     not null default false,
  case_sensitive        boolean     not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.quiz_questions enable row level security;

drop policy if exists "read_quiz_questions" on public.quiz_questions;
drop policy if exists "main_admin_write_quiz_questions" on public.quiz_questions;
drop policy if exists "public_rw_quiz_questions" on public.quiz_questions;
create policy "public_rw_quiz_questions" on public.quiz_questions
  for all using (true) with check (true);

-- ── 3. TABLE: quiz_options ───────────────────────────────────────────────────
create table if not exists public.quiz_options (
  id           uuid    primary key default uuid_generate_v4(),
  question_id  uuid    not null references public.quiz_questions(id) on delete cascade,
  option_text  text    not null,
  is_correct   boolean not null default false,
  order_index  integer not null default 0
);

alter table public.quiz_options enable row level security;

drop policy if exists "read_quiz_options" on public.quiz_options;
drop policy if exists "main_admin_write_quiz_options" on public.quiz_options;
drop policy if exists "public_rw_quiz_options" on public.quiz_options;
create policy "public_rw_quiz_options" on public.quiz_options
  for all using (true) with check (true);

-- ── 4. TABLE: quiz_attempts ──────────────────────────────────────────────────
create table if not exists public.quiz_attempts (
  id                   uuid        primary key default uuid_generate_v4(),
  quiz_id              uuid        not null references public.quizzes(id) on delete cascade,
  participant_id       uuid        not null references public.users(id) on delete cascade,
  attempt_number       integer     not null default 1,
  status               text        not null default 'in_progress' check (status in ('in_progress', 'submitted', 'graded')),
  started_at           timestamptz not null default now(),
  submitted_at         timestamptz,
  score                integer     not null default 0,
  correct_count        integer     not null default 0,
  wrong_count          integer     not null default 0,
  pending_review_count integer     not null default 0,
  points_earned        integer     not null default 0,
  is_best_attempt      boolean     not null default false,
  points_awarded       boolean     not null default false,
  time_spent_seconds   integer
);

alter table public.quiz_attempts enable row level security;

drop policy if exists "participants_read_own_attempts" on public.quiz_attempts;
drop policy if exists "participants_insert_attempts" on public.quiz_attempts;
drop policy if exists "participants_update_own_attempts" on public.quiz_attempts;
drop policy if exists "public_rw_quiz_attempts" on public.quiz_attempts;
create policy "public_rw_quiz_attempts" on public.quiz_attempts
  for all using (true) with check (true);

-- ── 5. TABLE: quiz_answers ───────────────────────────────────────────────────
create table if not exists public.quiz_answers (
  id                  uuid    primary key default uuid_generate_v4(),
  attempt_id          uuid    not null references public.quiz_attempts(id) on delete cascade,
  question_id         uuid    not null references public.quiz_questions(id) on delete cascade,
  selected_option_id  uuid    references public.quiz_options(id),
  answer_text         text,
  is_correct          boolean,
  points_earned       integer not null default 0,
  needs_manual_review boolean not null default false,
  admin_feedback      text
);

alter table public.quiz_answers enable row level security;

drop policy if exists "participants_read_own_answers" on public.quiz_answers;
drop policy if exists "participants_insert_answers" on public.quiz_answers;
drop policy if exists "participants_update_own_answers" on public.quiz_answers;
drop policy if exists "public_rw_quiz_answers" on public.quiz_answers;
create policy "public_rw_quiz_answers" on public.quiz_answers
  for all using (true) with check (true);

-- ── 6. NOTE on submissions FK ────────────────────────────────────────────────
-- When quiz points are awarded via addAcceptedSubmission (sourceType='quiz_reward'),
-- the activityId field holds the quiz ID. In Supabase mode this violates the FK
-- on submissions.activity_id. To support quiz rewards, relax that FK:
alter table public.submissions
  drop constraint if exists submissions_activity_id_fkey;
