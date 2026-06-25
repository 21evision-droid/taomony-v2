-- ─────────────────────────────────────────────────────────────
-- Migration: Add Harmony Resonance category + channels
-- ─────────────────────────────────────────────────────────────

INSERT INTO categories (id, name, slug, sort_order) VALUES
  ('a0000000-0000-4000-8000-000000000006', 'Harmony Resonance', 'harmony-resonance', 6)
ON CONFLICT (id) DO NOTHING;

INSERT INTO channels (id, category_id, name, slug, sort_order) VALUES
  ('b0000000-0000-4000-8000-000000000018', 'a0000000-0000-4000-8000-000000000006', 'Member Resonances',  'member-resonances',  1),
  ('b0000000-0000-4000-8000-000000000019', 'a0000000-0000-4000-8000-000000000006', 'Resonance Circle',   'resonance-circle',   2)
ON CONFLICT (id) DO NOTHING;
