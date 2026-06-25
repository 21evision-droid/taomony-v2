-- Taomony Eating video library
CREATE TABLE IF NOT EXISTS public.taoweight_videos (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  tab_type text NOT NULL CHECK (tab_type IN ('why', 'how')),
  title text NOT NULL,
  youtube_video_id text NOT NULL,
  description text DEFAULT '',
  duration_seconds integer DEFAULT 0,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Data API grants (required from Oct 30, 2026)
GRANT SELECT ON public.taoweight_videos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.taoweight_videos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.taoweight_videos TO service_role;

-- RLS
ALTER TABLE public.taoweight_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_public_read_taoweight" ON public.taoweight_videos
  FOR SELECT USING (true);

-- Seed demo data
INSERT INTO public.taoweight_videos (tab_type, title, youtube_video_id, description, duration_seconds, sort_order)
VALUES
  ('why', 'Why Taomony Eating',        '9YRXKVhPQ1g', 'Discover how Taoist wisdom transforms your relationship with food — eating as meditation, not consumption.', 300, 1),
  ('why', 'Food & Qi Wisdom',          '9YRXKVhPQ1g', 'Learn how ancient dietary principles align with modern nutritional science.', 420, 2),
  ('how', 'How to Start',              'PPvHMqibySc', 'A practical step-by-step guide to beginning your Taomony eating journey.', 360, 1),
  ('how', 'Daily Practice',            'PPvHMqibySc', 'Simple techniques for mindful eating that fit into your everyday routine.', 480, 2);
