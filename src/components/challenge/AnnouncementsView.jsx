import { useState } from 'react';
import { MOCK_ANNOUNCEMENTS } from '../../data/taoWeightData';

export default function AnnouncementsView({ onNavigate }) {
  const [items, setItems] = useState(MOCK_ANNOUNCEMENTS);
  const [showAll, setShowAll] = useState(false);

  const handleLike = (id) => {
    setItems(prev => prev.map(a =>
      a.id === id ? { ...a, liked: !a.liked, likes: a.liked ? a.likes - 1 : a.likes + 1 } : a
    ));
  };

  const pinned = items.find(a => a.pinned);
  const feed = items.filter(a => !a.pinned);
  const visible = showAll ? feed : feed.slice(0, 5);
  const hiddenCount = Math.max(0, feed.length - 5);

  return (
    <div>
      {/* Pinned announcement */}
      {pinned && (
        <div className="border border-[#f59e0b] bg-gradient-to-br from-[#fffbeb] to-[#fef3c7] rounded-xl p-[18px] mb-6 shadow-[0_2px_8px_rgba(245,158,11,0.1)]">
          <div className="text-[11px] text-[#f59e0b] font-bold uppercase tracking-[0.5px] mb-2.5">
            📌 Pinned
          </div>
          <div className="text-[28px] mb-2">{pinned.icon}</div>
          <div className="text-[17px] font-bold text-[#2c2416] mb-1.5 leading-tight">
            {pinned.title}
          </div>
          <div className="text-[13px] text-[#5a4a3a] leading-relaxed mb-3">
            {pinned.summary}
          </div>
          <div className="flex items-center gap-4 text-xs text-[#5a4a3a] flex-wrap">
            <span>🗓️ {pinned.date}</span>
            <button
              onClick={() => handleLike(pinned.id)}
              className="bg-transparent border-none text-xs cursor-pointer flex items-center gap-1 text-[#5a4a3a] hover:text-[#d97706] transition-colors"
            >
              {pinned.liked ? '👍' : '👍'} {pinned.likes}
            </button>
            {pinned.action?.tab && (
              <button
                className="ml-auto bg-[#d97706] text-white px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap hover:bg-[#b85c00] transition-colors"
                onClick={() => onNavigate?.(pinned.action.tab)}
              >
                {pinned.action.label} →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Feed title */}
      {feed.length > 0 && (
        <div className="text-[13px] font-semibold text-[#5a4a3a] opacity-50 mb-1 tracking-[0.3px]">
          📢 Latest Updates
        </div>
      )}

      {/* Empty state */}
      {feed.length === 0 && !pinned && (
        <div className="text-center py-10 text-[13px] text-[#5a4a3a] opacity-40">
          No announcements yet.
        </div>
      )}

      {/* Feed cards */}
      {visible.map(a => (
        <div key={a.id} className="flex gap-3.5 py-[18px] border-b border-[#f0e8d8] last:border-b-0">
          <div className="w-[42px] h-[42px] rounded-xl bg-[#f5efe6] flex items-center justify-center text-xl shrink-0">
            {a.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-semibold text-[#2c2416] mb-1">{a.title}</div>
            <div className="text-[13px] text-[#5a4a3a] leading-relaxed mb-2">{a.summary}</div>
            <div className="flex items-center gap-3.5 text-xs text-[#5a4a3a]">
              <span>🗓️ {a.date}</span>
              <button
                onClick={() => handleLike(a.id)}
                className="bg-transparent border-none text-xs cursor-pointer flex items-center gap-1 text-[#5a4a3a] hover:text-[#d97706] transition-colors"
              >
                {a.liked ? '👍' : '👍'} {a.likes}
              </button>
              {a.action?.tab && (
                <button
                  className="ml-auto bg-[#d97706] text-white px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap hover:bg-[#b85c00] transition-colors"
                  onClick={() => onNavigate?.(a.action.tab)}
                >
                  {a.action.label} →
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Show all / less button */}
      {hiddenCount > 0 && (
        <button
          className="block w-full py-2.5 my-2 border border-dashed border-[#e0d5c0] rounded-full text-[13px] text-[#5a4a3a] cursor-pointer text-center hover:border-[#d97706] hover:text-[#d97706] transition-all duration-200"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? 'Show less' : `Show all (${hiddenCount} more)`}
        </button>
      )}
    </div>
  );
}
