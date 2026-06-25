-- Fix distilled_posts RLS: allow anon key to read published posts
-- The frontend uses the anon key (publishable client) to query distilled_posts.
-- Previous policy required auth.role() = 'authenticated' which blocked anon reads.

DROP POLICY IF EXISTS "Authenticated users can read published distilled_posts"
  ON distilled_posts;

CREATE POLICY "Anyone can read published distilled_posts"
  ON distilled_posts
  FOR SELECT
  USING (status = 'published');
