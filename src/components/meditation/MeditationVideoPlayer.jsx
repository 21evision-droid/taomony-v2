// MeditationVideoPlayer — modal player for preview and practice (design §5.1).
// Dual-entry: preview (free watching, no counting) vs practice (full playback
// = 1 repetition). The mode label is always shown.
//
// Videos are silent action demonstrations. Until real videos are supplied
// (design §13), a duration-based timer stands in for silent playback: reaching
// the end fires onComplete in practice mode. When a real videoUrl is present,
// a native <video> is used and onComplete fires on the 'ended' event.
//
// Props:
//   title           — unit title
//   videoUrl        — string | null (real videos supplied later)
//   durationSeconds — practice duration (video duration = practice duration)
//   mode            — 'preview' | 'practice'
//   repDisplay      — string shown only in practice mode (e.g. 'Rep 1/3')
//   onComplete      — () => void, practice only, fired once at end of playback
//   onClose         — () => void

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

export default function MeditationVideoPlayer({
  title,
  videoUrl,
  durationSeconds,
  mode,
  repDisplay,
  onComplete,
  onClose,
}) {
  const [elapsed, setElapsed] = useState(0);
  const firedRef = useRef(false);

  const isPractice = mode === 'practice';

  // Duration-based stand-in for the silent demonstration video.
  useEffect(() => {
    if (videoUrl || !durationSeconds || durationSeconds <= 0) return;
    const timer = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => clearInterval(timer);
  }, [videoUrl, durationSeconds]);

  // Fire completion exactly once when playback reaches the end in practice mode.
  useEffect(() => {
    if (
      isPractice &&
      !videoUrl &&
      durationSeconds > 0 &&
      elapsed >= durationSeconds &&
      !firedRef.current
    ) {
      firedRef.current = true;
      onComplete?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, isPractice]);

  const handleEnded = () => {
    if (isPractice && !firedRef.current) {
      firedRef.current = true;
      onComplete?.();
    }
  };

  const progress = durationSeconds
    ? Math.min(100, Math.round((elapsed / durationSeconds) * 100))
    : 0;
  const remaining = Math.max(0, durationSeconds - elapsed);

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
        {/* Header — mode label always visible (§5.1) */}
        <div className="flex items-center justify-between px-4 py-3.5">
          <span className="text-sm font-semibold text-[#faf6ef]">
            {isPractice ? `Practicing · ${repDisplay}` : 'Preview'}
          </span>
          <button
            onClick={onClose}
            className="flex size-8 cursor-pointer items-center justify-center rounded-full bg-white/20 text-lg font-bold text-white transition-colors hover:bg-white/40 border-none leading-none"
          >
            <X size={16} />
          </button>
        </div>

        {/* Video frame */}
        <div className="relative w-full bg-black pb-[56.25%]">
          {videoUrl ? (
            <video
              src={videoUrl}
              autoPlay
              controls
              onEnded={handleEnded}
              className="absolute inset-0 size-full"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
              <p className="text-[#faf6ef] text-sm">{title}</p>
              <p className="text-[#cbbf9e] text-xs">
                Silent demonstration video — coming soon
              </p>
              <div className="w-full max-w-[260px] h-1.5 rounded-full bg-white/15 overflow-hidden">
                <div
                  className="h-full bg-[#faf6ef] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[#cbbf9e] text-xs">{remaining}s</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
