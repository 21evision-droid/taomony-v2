-- Ensure Data API grants on all existing tables
-- Starting October 30, 2026, new tables need explicit GRANTs for Data API access.
-- Existing tables retain their grants; this file re-affirms them.

GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO service_role;

GRANT SELECT ON public.chapter_media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chapter_media TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chapter_media TO service_role;

GRANT SELECT ON public.courses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO service_role;
