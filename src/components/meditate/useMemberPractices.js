import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { getYouTubeId } from '../../lib/youtubeUtils';

export function useMemberPractices(filterStage = null) {
  const [practices, setPractices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchPractices() {
      try {
        setIsLoading(true);
        let query = supabase
          .from('member_practices')
          .select('*')
          .eq('status', 'approved')
          .order('created_at', { ascending: false });

        if (filterStage) {
          query = query.eq('stage', filterStage);
        }

        const { data, error } = await query;
        if (!cancelled) {
          if (error) throw error;
          setPractices(data || []);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error fetching practices:', err);
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchPractices();
    return () => {
      cancelled = true;
    };
  }, [filterStage]);

  const getYoutubeInfo = (url) => {
    if (!url) return { embedUrl: '', thumbnail: '' };
    const id = getYouTubeId(url);
    if (!id) return { embedUrl: url, thumbnail: '' };
    return {
      embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`,
      thumbnail: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
    };
  };

  return { practices, isLoading, getYoutubeInfo };
}
