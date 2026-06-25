-- ─────────────────────────────────────────────────────────────
-- Migration: Phase 3A — Database Foundation
-- Tables: distilled_posts, master_agent_runs
-- Modifications: raw_fragments +is_distilled
-- ─────────────────────────────────────────────────────────────

-- ═════════════════════════════════════════════════════════════
-- 1. DISTILLED_POSTS TABLE
-- ═════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS distilled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  source_fragment_ids UUID[] NOT NULL,
  contributor_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE distilled_posts ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_distilled_posts_status
  ON distilled_posts(status);
CREATE INDEX IF NOT EXISTS idx_distilled_posts_published_at
  ON distilled_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_distilled_posts_created_at
  ON distilled_posts(created_at DESC);

-- RLS: authenticated users can read published posts
-- INSERT/UPDATE/DELETE handled by Edge Function via service_role (bypasses RLS)
DROP POLICY IF EXISTS "Authenticated users can read published distilled_posts"
  ON distilled_posts;
CREATE POLICY "Authenticated users can read published distilled_posts"
  ON distilled_posts
  FOR SELECT
  USING (auth.role() = 'authenticated' AND status = 'published');

-- ═════════════════════════════════════════════════════════════
-- 2. MASTER_AGENT_RUNS TABLE
-- ═════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS master_agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'completed', 'failed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  fragment_count INTEGER,
  distilled_post_id UUID REFERENCES distilled_posts(id),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE master_agent_runs ENABLE ROW LEVEL SECURITY;

-- RLS: authenticated users can view run history (read-only)
-- INSERT/UPDATE handled by Edge Function via service_role
DROP POLICY IF EXISTS "Authenticated users can read master_agent_runs"
  ON master_agent_runs;
CREATE POLICY "Authenticated users can read master_agent_runs"
  ON master_agent_runs
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- ═════════════════════════════════════════════════════════════
-- 3. RAW_FRAGMENTS — add is_distilled flag
-- ═════════════════════════════════════════════════════════════

ALTER TABLE raw_fragments
  ADD COLUMN IF NOT EXISTS is_distilled BOOLEAN NOT NULL DEFAULT false;

-- Partial index: quickly find fragments that haven't been distilled yet
DROP INDEX IF EXISTS idx_raw_fragments_is_distilled;
CREATE INDEX idx_raw_fragments_is_distilled
  ON raw_fragments(is_distilled)
  WHERE is_distilled = false;
