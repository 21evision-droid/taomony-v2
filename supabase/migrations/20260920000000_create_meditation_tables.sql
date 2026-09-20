-- ─────────────────────────────────────────────────────────────
-- Migration: Meditation module (video-centric architecture)
-- Sub-tasks + combinations, append-only attempts, harvest.
-- See docs/superpowers/specs/2026-09-19-meditation-video-architecture-design.md §9
-- Phase 2 schema — not yet wired to the UI (Phase 1 uses localStorage mocks).
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.meditation_dimensions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  title       text NOT NULL,
  description text,
  order_index integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.meditation_subtasks (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dimension_id     uuid NOT NULL REFERENCES public.meditation_dimensions(id) ON DELETE CASCADE,
  title            text NOT NULL,
  description      text,
  video_url        text,
  duration_seconds integer NOT NULL,
  repeat_count     integer NOT NULL,
  window_days      integer NOT NULL,
  order_index      integer NOT NULL DEFAULT 0,
  is_active        boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.meditation_combinations (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title                text NOT NULL,
  description          text,
  video_url            text,
  duration_seconds     integer NOT NULL,
  repeat_count         integer NOT NULL,
  window_days          integer NOT NULL,
  order_index          integer NOT NULL DEFAULT 0,
  is_active            boolean NOT NULL DEFAULT true,
  tao_echo_passage     text,
  tao_echo_chapter     integer,
  tao_echo_implication text
);

CREATE TABLE IF NOT EXISTS public.meditation_subtask_attempts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subtask_id     uuid NOT NULL REFERENCES public.meditation_subtasks(id) ON DELETE CASCADE,
  attempt_number integer NOT NULL,
  completed_reps integer NOT NULL DEFAULT 0,
  status         text NOT NULL CHECK (status IN ('in_progress', 'completed', 'expired')),
  started_at     timestamptz NOT NULL DEFAULT now(),
  closed_at      timestamptz
);

CREATE TABLE IF NOT EXISTS public.meditation_combination_attempts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  combination_id uuid NOT NULL REFERENCES public.meditation_combinations(id) ON DELETE CASCADE,
  attempt_number integer NOT NULL,
  completed_reps integer NOT NULL DEFAULT 0,
  status         text NOT NULL CHECK (status IN ('in_progress', 'completed', 'expired')),
  started_at     timestamptz NOT NULL DEFAULT now(),
  closed_at      timestamptz
);

CREATE TABLE IF NOT EXISTS public.meditation_harvest_config (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  combination_id uuid NOT NULL REFERENCES public.meditation_combinations(id) ON DELETE CASCADE,
  question_key   text NOT NULL,
  question_text  text NOT NULL,
  options        jsonb NOT NULL DEFAULT '[]'::jsonb,
  interpretation text,
  recommendation text
);

CREATE TABLE IF NOT EXISTS public.meditation_harvest_submissions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  combination_id   uuid NOT NULL REFERENCES public.meditation_combinations(id) ON DELETE CASCADE,
  attempt_id       uuid REFERENCES public.meditation_combination_attempts(id) ON DELETE SET NULL,
  answers          jsonb NOT NULL DEFAULT '[]'::jsonb,
  resonance_shared boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_meditation_subtasks_dimension
  ON meditation_subtasks (dimension_id, order_index);
CREATE INDEX IF NOT EXISTS idx_meditation_subtask_attempts_user
  ON meditation_subtask_attempts (user_id, subtask_id);
CREATE INDEX IF NOT EXISTS idx_meditation_combination_attempts_user
  ON meditation_combination_attempts (user_id, combination_id);
CREATE INDEX IF NOT EXISTS idx_meditation_harvest_submissions_user
  ON meditation_harvest_submissions (user_id, combination_id);

-- ── Row Level Security ─────────────────────────────────────

ALTER TABLE public.meditation_dimensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meditation_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meditation_combinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meditation_subtask_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meditation_combination_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meditation_harvest_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meditation_harvest_submissions ENABLE ROW LEVEL SECURITY;

-- Content tables: anyone can read
DROP POLICY IF EXISTS "Anyone can read meditation dimensions" ON public.meditation_dimensions;
CREATE POLICY "Anyone can read meditation dimensions" ON public.meditation_dimensions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can read meditation subtasks" ON public.meditation_subtasks;
CREATE POLICY "Anyone can read meditation subtasks" ON public.meditation_subtasks
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can read meditation combinations" ON public.meditation_combinations;
CREATE POLICY "Anyone can read meditation combinations" ON public.meditation_combinations
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can read meditation harvest config" ON public.meditation_harvest_config;
CREATE POLICY "Anyone can read meditation harvest config" ON public.meditation_harvest_config
  FOR SELECT USING (true);

-- Attempt tables: users manage their own rows
DROP POLICY IF EXISTS "Users can read own subtask attempts" ON public.meditation_subtask_attempts;
CREATE POLICY "Users can read own subtask attempts" ON public.meditation_subtask_attempts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subtask attempts" ON public.meditation_subtask_attempts;
CREATE POLICY "Users can insert own subtask attempts" ON public.meditation_subtask_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own subtask attempts" ON public.meditation_subtask_attempts;
CREATE POLICY "Users can update own subtask attempts" ON public.meditation_subtask_attempts
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own combination attempts" ON public.meditation_combination_attempts;
CREATE POLICY "Users can read own combination attempts" ON public.meditation_combination_attempts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own combination attempts" ON public.meditation_combination_attempts;
CREATE POLICY "Users can insert own combination attempts" ON public.meditation_combination_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own combination attempts" ON public.meditation_combination_attempts;
CREATE POLICY "Users can update own combination attempts" ON public.meditation_combination_attempts
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own harvest submissions" ON public.meditation_harvest_submissions;
CREATE POLICY "Users can read own harvest submissions" ON public.meditation_harvest_submissions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own harvest submissions" ON public.meditation_harvest_submissions;
CREATE POLICY "Users can insert own harvest submissions" ON public.meditation_harvest_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
