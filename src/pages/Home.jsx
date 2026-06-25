import { useState, useEffect } from 'react';
import { fetchChapterMedia } from '../lib/supabase';
import TaomonyGuidance from '../components/home/TaomonyGuidance';
import WisdomLibrary from '../components/home/WisdomLibrary';
import PractitionerJourney from '../components/home/PractitionerJourney';
import WelcomeOverlay from '../components/home/WelcomeOverlay';
import VideoPlayer from '../components/home/VideoPlayer';

function Home() {
  const [showWelcome, setShowWelcome] = useState(
    () => !localStorage.getItem('taomony_welcomed'),
  );
  const [currentVideo, setCurrentVideo] = useState(null);
  const [videoData, setVideoData] = useState({});

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch video data from Supabase
  useEffect(() => {
    fetchChapterMedia().then(setVideoData);
  }, []);

  const dismissWelcome = () => {
    localStorage.setItem('taomony_welcomed', 'true');
    setShowWelcome(false);
  };

  return (
    <div style={{ background: '#f5efe6' }}>
      <TaomonyGuidance />

      <WisdomLibrary
        videoData={videoData}
        onPlayVideo={(video, chapter) => setCurrentVideo({ video, chapter })}
      />

      <div className="mx-auto px-4" style={{ maxWidth: 480 }}>
        <div className="h-px bg-[#e0d5c0] opacity-50" />
      </div>

      <PractitionerJourney />

      {mounted && showWelcome && (
        <WelcomeOverlay onDismiss={dismissWelcome} />
      )}

      {currentVideo && (
        <VideoPlayer
          video={currentVideo.video}
          chapter={currentVideo.chapter}
          onClose={() => setCurrentVideo(null)}
        />
      )}
    </div>
  );
}

export default Home;
