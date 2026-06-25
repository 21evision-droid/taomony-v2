import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { TAO_WEIGHT_DEMO_VIDEOS, TAB_OPTIONS } from '../data/taoWeightData';
import TaoWeightHero from '../components/taoweight/TaoWeightHero';
import TaoWeightVideoCard from '../components/taoweight/TaoWeightVideoCard';
import TaoWeightVideoPlayer from '../components/taoweight/TaoWeightVideoPlayer';
import ChallengeTabs from '../components/challenge/ChallengeTabs';
import TrackerView from '../components/challenge/TrackerView';
import LeaderboardView from '../components/challenge/LeaderboardView';
import AnnouncementsView from '../components/challenge/AnnouncementsView';

export default function TaoWeight() {
  const [activeTab, setActiveTab] = useState('why');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [challengeTab, setChallengeTab] = useState('tracker');

  useEffect(() => {
    let cancelled = false;

    async function fetchVideos() {
      try {
        const { data, error } = await supabase
          .from('taoweight_videos')
          .select('*')
          .order('sort_order', { ascending: true });

        if (!error && data?.length > 0) {
          if (!cancelled) {
            setVideos(data);
            setLoading(false);
          }
          return;
        }
      } catch {
        // Supabase fetch failed — fall through to demo data
      }

      if (!cancelled) {
        setVideos(TAO_WEIGHT_DEMO_VIDEOS);
        setLoading(false);
      }
    }

    fetchVideos();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredVideos = videos
    .filter((v) => v.tab_type === activeTab)
    .slice(0, 1);

  return (
    <div className="pb-6 pt-2">
      {/* Hero */}
      <TaoWeightHero />

      <div className="px-4" style={{ maxWidth: 480, margin: '0 auto' }}>
        {/* Tab Bar */}
        <div className="flex">
          {TAB_OPTIONS.map((tab, idx) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 cursor-pointer border-b-2 px-3 py-3 text-center font-cn text-sm tracking-wider transition-colors ${
                idx === 0 ? 'border-r border-dashed border-[#e0d5c0]' : ''
              } ${
                activeTab === tab.id
                  ? 'border-b-[#b8860b] font-semibold text-[#2c2416] opacity-100'
                  : 'border-b-transparent text-[#5a4a3a] opacity-50'
              }`}
            >
              <span className="mr-1">{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        {/* Video List */}
        {loading ? (
          <div className="py-16 text-center text-sm text-[#5a4a3a] opacity-50">
            <div className="mx-auto mb-3 size-8 animate-spin rounded-full border-3 border-[#e0d5c0] border-t-[#b8860b]" />
            <p>Loading videos...</p>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="py-16 text-center text-sm text-[#5a4a3a] opacity-50">
            <div className="mb-3 text-5xl opacity-30">🎬</div>
            <p>No videos available yet for this section.</p>
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-4">
            {filteredVideos.map((video) => (
              <TaoWeightVideoCard
                key={video.id}
                video={video}
                onClick={setCurrentVideo}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Challenge Section ── */}
      <div className="mt-10 px-4" style={{ maxWidth: 480, margin: '0 auto' }}>
        <div className="mb-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-stone-200" />
          <span className="text-xs font-medium tracking-widest text-stone-400">CHALLENGE</span>
          <div className="h-px flex-1 bg-stone-200" />
        </div>

        <ChallengeTabs activeTab={challengeTab} onChange={setChallengeTab} />

        <div className="mt-6">
          {challengeTab === 'tracker' && <TrackerView />}
          {challengeTab === 'leaderboard' && <LeaderboardView />}
          {challengeTab === 'announcements' && <AnnouncementsView onNavigate={setChallengeTab} />}
        </div>
      </div>

      {/* Video Player Modal */}
      {currentVideo && (
        <TaoWeightVideoPlayer
          video={currentVideo}
          onClose={() => setCurrentVideo(null)}
        />
      )}
    </div>
  );
}
