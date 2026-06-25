import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function fetchChapterMedia() {
  const { data, error } = await supabase
    .from('chapter_media')
    .select('*')
    .order('chapter_number', { ascending: true });

  if (error) {
    console.error('Failed to fetch chapter media:', error.message);
    return {};
  }

  // Convert array to map keyed by chapter_number
  const map = {};
  data.forEach((row) => {
    map[row.chapter_number] = {
      videoId: row.video_id,
      titleEn: row.title_en,
    };
  });
  return map;
}
