import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useMemberPractices } from './useMemberPractices';
import VideoPlayerModal from './VideoPlayerModal';

export default function MemberPracticesView({ filterStage, onBack }) {
  const { practices, isLoading, getYoutubeInfo } =
    useMemberPractices(filterStage);
  const [activePractice, setActivePractice] = useState(null);

  useEffect(() => {
    if (!isLoading && practices.length > 0) {
      setActivePractice(practices[0]);
    }
  }, [isLoading, practices]);

  if (isLoading) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-[#d4a843]" />
      </div>
    );
  }

  if (!activePractice) {
    return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black text-white">
        <p className="text-white/50">No practices available for this stage.</p>
        <button
          onClick={onBack}
          className="mt-4 text-[#d4a843] underline underline-offset-4"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <VideoPlayerModal
      practice={activePractice}
      embedUrl={getYoutubeInfo(activePractice.video_url).embedUrl}
      stage={filterStage}
      onClose={onBack}
    />
  );
}
