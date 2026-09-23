-- ─────────────────────────────────────────────────────────────
-- Migration: Create reflections table
-- Resonance v2 — aggregated reflections from all four modules
-- (Learning / Meditate / Sleep / Eating), classified by source.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.reflections (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source        text NOT NULL CHECK (source IN ('learning', 'meditate', 'sleep', 'eating')),
  source_detail text,
  content       text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reflections_source_created
  ON reflections (source, created_at DESC);

ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read reflections" ON public.reflections;
CREATE POLICY "Anyone can read reflections" ON public.reflections
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own reflections" ON public.reflections;
CREATE POLICY "Users can insert own reflections" ON public.reflections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable Realtime (postgres_changes) for the reflections table.
ALTER PUBLICATION supabase_realtime ADD TABLE public.reflections;
