import { X } from 'lucide-react';

export default function TaoWeightVideoPlayer({ video, onClose }) {
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
            ▶ {video.title}
          </span>
          <button
            onClick={onClose}
            className="flex size-8 cursor-pointer items-center justify-center rounded-full bg-white/20 text-lg font-bold text-white transition-colors hover:bg-white/40 border-none leading-none"
          >
            <X size={16} />
          </button>
        </div>

        {/* Video Frame */}
        <div className="relative w-full bg-black pb-[56.25%]">
          <iframe
            src={`https://www.youtube.com/embed/${video.youtube_video_id}?autoplay=1&mute=1&rel=0&playsinline=1`}
            title={video.title}
            className="absolute inset-0 size-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
