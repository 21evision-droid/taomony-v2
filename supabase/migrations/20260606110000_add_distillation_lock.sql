-- ─────────────────────────────────────────────────────────────
-- Migration: Add distillation advisory lock wrapper
-- Enables Edge Function to acquire lock via supabase-js .rpc()
-- ─────────────────────────────────────────────────────────────

-- Wrapper for pg_advisory_xact_lock(42) — prevents concurrent
-- Master Agent runs when called from the run-master-agent Edge Function.
-- Lock ID 42 is reserved for distillation (well-known constant).
--
-- Usage from Edge Function:
--   await ctx.supabaseAdmin.rpc('acquire_distillation_lock')
--
-- pg_advisory_xact_lock is auto-released at transaction end (or
-- when the Edge Function's supabaseAdmin client closes its connection).
CREATE OR REPLACE FUNCTION public.acquire_distillation_lock()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Acquire transaction-level advisory lock.
  -- Blocks until the lock becomes available (or the caller times out).
  -- Auto-released when the Postgres transaction ends.
  PERFORM pg_advisory_xact_lock(42);
END;
$$;
