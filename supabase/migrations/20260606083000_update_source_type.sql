-- ─────────────────────────────────────────────────────────────
-- Migration: Update source_type enum values
-- text → fragment, add short_article, long_article
-- ─────────────────────────────────────────────────────────────

-- 1. Drop old constraint (auto-named by PG)
ALTER TABLE raw_fragments DROP CONSTRAINT IF EXISTS raw_fragments_source_type_check;

-- 2. Migrate existing 'text' rows to 'fragment'
UPDATE raw_fragments SET source_type = 'fragment' WHERE source_type = 'text';

-- 3. Set new default
ALTER TABLE raw_fragments ALTER COLUMN source_type SET DEFAULT 'fragment';

-- 4. Add new constraint with expanded values
ALTER TABLE raw_fragments ADD CONSTRAINT raw_fragments_source_type_check
  CHECK (source_type IN ('fragment', 'short_article', 'long_article', 'image', 'youtube_link'));
