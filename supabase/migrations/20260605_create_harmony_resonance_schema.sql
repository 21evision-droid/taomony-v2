-- ─────────────────────────────────────────────────────────────
-- Migration: Create Harmony Resonance schema
-- Tables: categories, channels, raw_fragments
-- Phase 0 — Taxonomy Lock
-- Phase 1A — raw_fragments
-- ─────────────────────────────────────────────────────────────

-- 1. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read categories" ON categories;
CREATE POLICY "Anyone can read categories" ON categories
  FOR SELECT USING (true);

-- 2. CHANNELS TABLE
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_channels_category_id ON channels(category_id);

ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read channels" ON channels;
CREATE POLICY "Anyone can read channels" ON channels
  FOR SELECT USING (true);

-- 3. RAW_FRAGMENTS TABLE
CREATE EXTENSION IF NOT EXISTS vector SCHEMA extensions;

CREATE TABLE IF NOT EXISTS raw_fragments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  channel_id UUID NOT NULL REFERENCES channels(id),
  source_type TEXT NOT NULL DEFAULT 'fragment' CHECK (source_type IN ('fragment', 'short_article', 'long_article', 'image', 'youtube_link')),
  media_url TEXT DEFAULT NULL,
  category_id UUID REFERENCES categories(id),
  fragment_type TEXT DEFAULT NULL CHECK (fragment_type IN ('fragment', 'extended_fragment', 'reflection')),
  embedding extensions.vector(1536) DEFAULT NULL,
  tags JSONB DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_raw_fragments_channel_id ON raw_fragments(channel_id);
CREATE INDEX IF NOT EXISTS idx_raw_fragments_user_id ON raw_fragments(user_id);
CREATE INDEX IF NOT EXISTS idx_raw_fragments_status ON raw_fragments(status);
CREATE INDEX IF NOT EXISTS idx_raw_fragments_created_at ON raw_fragments(created_at DESC);

ALTER TABLE raw_fragments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read completed fragments" ON raw_fragments;
DROP POLICY IF EXISTS "Users can insert own fragments" ON raw_fragments;
DROP POLICY IF EXISTS "Users can update own fragments" ON raw_fragments;

CREATE POLICY "Anyone can read completed fragments" ON raw_fragments
  FOR SELECT USING (status = 'completed');

CREATE POLICY "Users can insert own fragments" ON raw_fragments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fragments" ON raw_fragments
  FOR UPDATE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- Seed Data — Taxonomy Lock (Phase 0)
-- ─────────────────────────────────────────────────────────────

INSERT INTO categories (id, name, slug, sort_order) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'Learning',       'learning',        1),
  ('a0000000-0000-4000-8000-000000000002', 'Meditate',       'meditate',        2),
  ('a0000000-0000-4000-8000-000000000003', 'Taomony Eating', 'taomony-eating',  3),
  ('a0000000-0000-4000-8000-000000000004', 'Cultivation',    'cultivation',     4),
  ('a0000000-0000-4000-8000-000000000005', 'Governance',     'governance',      5),
  ('a0000000-0000-4000-8000-000000000006', 'Harmony Resonance', 'harmony-resonance', 6)
ON CONFLICT (id) DO NOTHING;

INSERT INTO channels (id, category_id, name, slug, sort_order) VALUES
  -- Learning
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Tao Te Ching',    'tao-te-ching',    1),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Philosophy',      'philosophy',      2),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'Psychology',      'psychology',      3),
  ('b0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'Nutrition',       'nutrition',       4),
  -- Meditate
  ('b0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000002', 'Daily Meditation','daily-meditation',1),
  ('b0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000002', 'Breathing',       'breathing',       2),
  ('b0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000002', 'Inner Alchemy',   'inner-alchemy',   3),
  -- Taomony Eating
  ('b0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000003', 'Daily Weight',    'daily-weight',    1),
  ('b0000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000003', 'Meal Journal',    'meal-journal',    2),
  ('b0000000-0000-4000-8000-000000000010', 'a0000000-0000-4000-8000-000000000003', 'Challenges',      'challenges',      3),
  -- Cultivation
  ('b0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000004', 'Gratitude',       'gratitude',       1),
  ('b0000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000004', 'Generosity',      'generosity',      2),
  ('b0000000-0000-4000-8000-000000000013', 'a0000000-0000-4000-8000-000000000004', 'Accountability',  'accountability',  3),
  ('b0000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000004', 'Kindness',        'kindness',        4),
  -- Governance
  ('b0000000-0000-4000-8000-000000000015', 'a0000000-0000-4000-8000-000000000005', 'Community Policy','community-policy',1),
  ('b0000000-0000-4000-8000-000000000016', 'a0000000-0000-4000-8000-000000000005', 'Events',          'events',          2),
  ('b0000000-0000-4000-8000-000000000017', 'a0000000-0000-4000-8000-000000000005', 'Challenge',       'challenge',       3),
  -- Harmony Resonance
  ('b0000000-0000-4000-8000-000000000018', 'a0000000-0000-4000-8000-000000000006', 'Member Resonances','member-resonances',1),
  ('b0000000-0000-4000-8000-000000000019', 'a0000000-0000-4000-8000-000000000006', 'Resonance Circle', 'resonance-circle', 2)
ON CONFLICT (id) DO NOTHING;
