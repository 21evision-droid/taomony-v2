-- =============================================================================
-- Phase 4 — Observability Tables
--
-- 1. workflow_events     — Tracks every Dify workflow invocation (A and B)
--                         Includes nonce for replay protection
-- 2. master_agent_logs   — Tracks distillation runs (Workflow B)
--
-- These tables store structured logs that can be queried via Supabase Logs
-- or directly in the SQL editor. No dashboard required.
-- =============================================================================

-- ── 1. workflow_events ──
-- Tracks every Dify workflow invocation across both workflows.
-- Used for observability, replay protection, and debugging.

CREATE TABLE IF NOT EXISTS workflow_events (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  request_id    UUID NOT NULL,
  workflow_id   TEXT NOT NULL CHECK (workflow_id IN ('workflow-a', 'workflow-b')),
  status        TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  fragment_id   UUID REFERENCES raw_fragments(id) ON DELETE SET NULL,
  distilled_post_id UUID REFERENCES distilled_posts(id) ON DELETE SET NULL,
  fragment_count INTEGER,
  error_message TEXT,
  nonce         UUID,                                      -- Replay protection
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for querying by workflow + status
CREATE INDEX IF NOT EXISTS idx_workflow_events_workflow_status
  ON workflow_events (workflow_id, status, created_at DESC);

-- Index for nonce deduplication (replay protection)
CREATE INDEX IF NOT EXISTS idx_workflow_events_nonce
  ON workflow_events (nonce)
  WHERE nonce IS NOT NULL;

-- Index for per-fragment lookup
CREATE INDEX IF NOT EXISTS idx_workflow_events_fragment
  ON workflow_events (fragment_id, created_at DESC);

-- Enable RLS but allow service_role only (internal table)
ALTER TABLE workflow_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage workflow_events"
  ON workflow_events
  USING (auth.role() = 'service_role');

-- ── 2. master_agent_logs ──
-- Tracks each distillation run, one row per execution.
-- More structured than workflow_events for distillation-specific metrics.

CREATE TABLE IF NOT EXISTS master_agent_logs (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  distilled_post_id UUID REFERENCES distilled_posts(id) ON DELETE SET NULL,
  fragment_count    INTEGER NOT NULL,
  contributor_count INTEGER NOT NULL DEFAULT 0,
  status            TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  workflow_run_id   TEXT,                                   -- Dify workflow run ID
  error_message     TEXT,
  started_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for chronological queries
CREATE INDEX IF NOT EXISTS idx_master_agent_logs_created
  ON master_agent_logs (created_at DESC);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_master_agent_logs_status
  ON master_agent_logs (status, created_at DESC);

-- Enable RLS but allow service_role only (internal table)
ALTER TABLE master_agent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage master_agent_logs"
  ON master_agent_logs
  USING (auth.role() = 'service_role');
