-- ─────────────────────────────────────────────────────────────
-- Migration: Create tables for localStorage → Supabase migration
-- Tables: comments, submissions, journey_posts
-- ─────────────────────────────────────────────────────────────

-- 1. COMMENTS TABLE
CREATE TABLE IF NOT EXISTS comments (
  id BIGINT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  author TEXT NOT NULL DEFAULT 'Anonymous',
  avatar TEXT NOT NULL DEFAULT '🧑',
  time TEXT NOT NULL DEFAULT 'just now',
  tag TEXT NOT NULL DEFAULT 'weight-loss',
  module TEXT NOT NULL DEFAULT 'challenge',
  sub_module TEXT NOT NULL DEFAULT 'challenge-discussion',
  text TEXT NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  liked BOOLEAN NOT NULL DEFAULT false,
  replies JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_sub_module ON comments(sub_module);
CREATE INDEX IF NOT EXISTS idx_comments_module ON comments(module);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to make this idempotent
DROP POLICY IF EXISTS "Anyone can read comments" ON comments;
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;

CREATE POLICY "Anyone can read comments" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert comments" ON comments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);


-- 2. SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS submissions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  date TEXT NOT NULL,
  score NUMERIC NOT NULL DEFAULT 0,
  habits JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_submissions_user_date ON submissions(user_id, date);

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own submissions" ON submissions;
DROP POLICY IF EXISTS "Users can insert own submissions" ON submissions;

CREATE POLICY "Users can read own submissions" ON submissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own submissions" ON submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 3. JOURNEY_POSTS TABLE
CREATE TABLE IF NOT EXISTS journey_posts (
  id BIGINT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  author TEXT NOT NULL,
  avatar TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Practitioner',
  keyword TEXT,
  excerpt TEXT NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  time TEXT NOT NULL DEFAULT 'Just now',
  color TEXT NOT NULL DEFAULT '#b8860b',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_journey_posts_keyword ON journey_posts(keyword);
CREATE INDEX IF NOT EXISTS idx_journey_posts_created_at ON journey_posts(created_at DESC);

ALTER TABLE journey_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read journey posts" ON journey_posts;
DROP POLICY IF EXISTS "Authenticated users can insert journey posts" ON journey_posts;
DROP POLICY IF EXISTS "Users can update own journey posts" ON journey_posts;

CREATE POLICY "Anyone can read journey posts" ON journey_posts
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert journey posts" ON journey_posts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own journey posts" ON journey_posts
  FOR UPDATE USING (auth.uid() = user_id);
