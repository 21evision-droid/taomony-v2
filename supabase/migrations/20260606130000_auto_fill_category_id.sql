-- Auto-fill raw_fragments.category_id from channels.category_id on INSERT.
-- Safety net: catches any insertion path (Edge Function, seed scripts, etc.)
-- so that category_id is never NULL.

CREATE OR REPLACE FUNCTION public.fill_category_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.category_id IS NULL THEN
    SELECT category_id INTO NEW.category_id
    FROM channels
    WHERE id = NEW.channel_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fill_category_id ON raw_fragments;
CREATE TRIGGER trg_fill_category_id
  BEFORE INSERT ON raw_fragments
  FOR EACH ROW
  EXECUTE FUNCTION public.fill_category_id();
