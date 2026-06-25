import { useRef, useState } from 'react';
import { X, Volume2, VolumeX } from 'lucide-react';

export default function VideoPlayer({ video, chapter, onClose }) {
  const [muted, setMuted] = useState(true);
  const iframeRef = useRef(null);

  const toggleMute = () => {
    if (iframeRef.current) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: muted ? 'unMute' : 'mute', args: [] }),
          '*',
        );
      } catch (_) { /* cross-origin fallback */ }
      setMuted(!muted);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6"
      style={{ animation: 'fadeIn 0.2s ease' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] overflow-hidden rounded-2xl bg-[#2c2416] shadow-2xl"
        style={{ animation: 'scaleIn 0.3s ease' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5">
          <span className="text-sm font-semibold text-[#faf6ef]">
            ▶ Ch.{chapter.number} — {chapter.titleEn}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="flex size-8 items-center justify-center rounded-full bg-white/15 text-sm text-white transition-colors hover:bg-white/35 cursor-pointer border-none"
              title={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <button
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-full bg-white/20 text-lg font-bold text-white transition-colors hover:bg-white/40 cursor-pointer border-none leading-none"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Video Frame */}
        <div className="relative w-full pb-[56.25%] bg-black">
          <iframe
            ref={iframeRef}
            src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1&mute=1&rel=0&playsinline=1`}
            title={chapter.titleEn}
            className="absolute inset-0 size-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
