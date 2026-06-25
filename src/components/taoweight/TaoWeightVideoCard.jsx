import { Play } from 'lucide-react';

function formatDuration(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return sec > 0 ? `${min}m ${sec}s` : `${min} min`;
}

export default function TaoWeightVideoCard({ video, onClick }) {
  return (
    <div
      className="cursor-pointer overflow-hidden rounded-2xl border border-[#e0d5c0] bg-white transition-all hover:translate-y-[-2px] hover:border-[#d4a843] hover:shadow-md"
      onClick={() => onClick(video)}
    >
      {/* Thumbnail */}
      <div className="relative w-full bg-[#2c2416] pb-[56.25%]">
        <div className="absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#b8860b]/90 text-2xl text-white transition-all hover:bg-[#b8860b] hover:scale-110">
          <Play size={24} fill="white" />
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="mb-1 font-cn text-[17px] font-semibold text-[#2c2416]">
          {video.title}
        </h3>
        <p className="text-[13px] leading-relaxed text-[#5a4a3a] opacity-70">
          {video.description}
        </p>
        <div className="mt-2 flex gap-3 text-xs text-[#5a4a3a] opacity-50">
          <span>{formatDuration(video.duration_seconds)}</span>
        </div>
      </div>
    </div>
  );
}
