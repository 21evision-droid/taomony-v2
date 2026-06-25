-- Composite index for Master Agent distillation query.
--
-- Optimizes the core query:
--   SELECT id, user_id, content, category_id, created_at
--   FROM raw_fragments
--   WHERE status = 'completed'
--     AND is_distilled = false
--   ORDER BY created_at ASC
--   LIMIT 50
--
-- The index covers WHERE (status, is_distilled) + ORDER BY (created_at)
-- in a single B-tree scan. PostgreSQL can satisfy the entire query
-- from the index without touching the heap (index-only scan).

CREATE INDEX IF NOT EXISTS idx_raw_fragments_distillation_pickup
  ON raw_fragments (status, is_distilled, created_at ASC);
