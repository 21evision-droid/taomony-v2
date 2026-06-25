import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, X, ChevronRight } from 'lucide-react';
import { getYouTubeId } from '../../lib/youtubeUtils';
import iconFoundation from '../../assets/icon-foundation.png';
import iconTransformation from '../../assets/icon-transformation.png';
import iconUnity from '../../assets/icon-unity.png';

const STAGES_CONFIG = [
  {
    key: 'foundation',
    title: 'Foundation',
    subtitle: 'Tao-based meditation essentials',
    src: iconFoundation,
  },
  {
    key: 'transformation',
    title: 'Transformation',
    subtitle: 'Deep practice · energy & breath',
    src: iconTransformation,
  },
  {
    key: 'unity',
    title: 'Unity',
    subtitle: 'Oneness with the Tao',
    src: iconUnity,
  },
];

export default function CourseLibrary() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCourse, setActiveCourse] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchCourses() {
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('is_active', true)
          .order('stage', { ascending: true })
          .order('sort_order', { ascending: true });

        if (!cancelled) {
          if (error) throw error;
          setCourses(data || []);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch courses:', err);
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchCourses();
    return () => {
      cancelled = true;
    };
  }, []);

  const groupedCourses = courses.reduce((acc, course) => {
    const stage = course.stage || 'foundation';
    if (!acc[stage]) acc[stage] = [];
    acc[stage].push(course);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-[#d97706]" />
      </div>
    );
  }

  return (
    <div className="relative mt-6">
      {/* Section label — aligned with card icon circles */}
      <div className="mb-3 px-1">
        <span className="text-[15px] font-bold text-[#2c2416] font-serif">
          Course Library
        </span>
      </div>

      {/* Stage cards — no physical dividers, icons provide separation */}
      <div className="space-y-1">
        {STAGES_CONFIG.map((stage) => {
          const stageCourses = groupedCourses[stage.key] || [];
          const firstCourse = stageCourses[0];
          const hasContent = stageCourses.length > 0;

          return (
            <div
              key={stage.key}
              className="flex items-center gap-4 px-1 py-4"
            >
              {/* Stage icon image */}
              <div className="flex items-center justify-center w-[52px] h-[34px] shrink-0 overflow-hidden rounded-lg">
                <img
                  src={stage.src}
                  alt={stage.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Middle text */}
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-bold text-[#2c2416] font-serif leading-tight">
                  {stage.title}
                </h3>
                <p className="text-[12px] text-[#5a4a3a] opacity-60 mt-0.5 leading-tight">
                  {stage.subtitle}
                </p>
              </div>

              {/* Right arrow — click to play directly */}
              <button
                onClick={() => {
                  if (firstCourse) setActiveCourse(firstCourse);
                }}
                disabled={!hasContent}
                className="flex items-center justify-center size-8 rounded-full bg-[#f0e8d8] text-stone-500 hover:bg-[#d4a843] hover:text-white transition-all shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Video player overlay (unchanged) */}
      {activeCourse && (
        <div className="fixed inset-0 z-50 flex items-start justify-center">
          <div className="relative w-full max-w-[480px] h-screen bg-black flex flex-col overflow-y-auto">
            {/* Header bar */}
            <div className="sticky top-0 z-50 flex items-center justify-between p-4 text-white border-b border-white/10 bg-black/80 backdrop-blur-md">
              <div className="flex-1 pr-4">
                <span className="text-xs text-white/50 uppercase tracking-widest font-bold">
                  {activeCourse.stage?.charAt(0).toUpperCase() + activeCourse.stage?.slice(1) || 'Course'}
                </span>
                <h3 className="text-lg font-serif font-bold mt-1 line-clamp-1">
                  {activeCourse.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveCourse(null)}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {/* Video */}
            <div className="w-full max-w-4xl mx-auto px-4 pb-12 mt-6">
              <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                {activeCourse.video_url ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${getYouTubeId(activeCourse.video_url)}?autoplay=1`}
                    className="w-full h-full border-0"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-white/50">
                    No video available
                  </div>
                )}
              </div>

              {/* Comments section placeholder */}
              <div className="mt-6 text-white/40 text-sm text-center">
                Comments coming soon
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
