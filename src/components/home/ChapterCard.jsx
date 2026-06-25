import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Play, Lock } from 'lucide-react';
import { getComments, addComment, subscribe } from '../../data/commentStore';

export default function ChapterCard({ chapter, videoData = {}, onPlayVideo }) {
  const [expanded, setExpanded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const SUB = 'wisdom-library';

  const [localComments, setLocalComments] = useState([]);

  useEffect(() => {
    getComments().then(all => setLocalComments(all.filter(c => c.subModule === SUB)));
    const unsub = subscribe(() => {
      getComments().then(all => setLocalComments(all.filter(c => c.subModule === SUB)));
    });
    return unsub;
  }, []);

  const chapterVideo = videoData[chapter.number];

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    await addComment({ tag: 'wellness', module: 'home', subModule: 'wisdom-library', text: commentText.trim() });
    setCommentText('');
  };

  return (
    <div
      className={`overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer ${
        expanded
          ? 'border-[#d4a843] shadow-lg'
          : 'border-[#e0d5c0] hover:border-[#d4a843] hover:-translate-y-0.5 hover:shadow-md'
      }`}
      style={{ background: '#ffffff' }}
    >
      {/* Card Header */}
      <div className="flex items-start gap-3.5 px-5 pb-3.5 pt-[18px]" onClick={() => setExpanded(!expanded)}>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#f0e8d8] font-serif text-sm font-bold text-[#b8860b]">
          {chapter.number}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-baseline gap-2.5">
            <span className="font-serif text-[17px] font-semibold text-[#2c2416]">
              {chapter.titleZh}
            </span>
            <span className="text-sm italic text-[#5a4a3a] opacity-60">
              {chapter.titleEn}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[#5a4a3a] opacity-70 font-serif">
            {chapter.preview}
          </p>
        </div>
      </div>

      {/* Card Meta */}
      <div className="flex items-center gap-4 px-5 pb-3 text-xs text-[#5a4a3a] opacity-60">
        <span className="flex items-center gap-1">
          <Heart size={12} /> {chapter.likes}
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle size={12} /> {localComments.length}
        </span>
        {chapterVideo && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlayVideo(chapterVideo, chapter);
            }}
            className="ml-auto flex cursor-pointer items-center gap-1 text-xs text-[#b8860b] opacity-70 transition-opacity hover:opacity-100 hover:bg-[#b8860b]/10 rounded-md px-1.5 py-0.5 bg-transparent border-none font-sans"
          >
            <Play size={14} /> Watch
          </button>
        )}
        {chapter.memberOnly && (
          <span className="flex items-center gap-1 text-[#b8860b]">
            <Lock size={12} /> Members Only
          </span>
        )}
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="animate-slide-down border-t border-[#e0d5c0] px-5 py-5">
          {/* Translation */}
          <div className="mb-4">
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[#b8860b]">
              Modern Translation
            </h4>
            <p className="font-serif text-sm leading-relaxed text-[#2c2416]">
              {chapter.translation}
            </p>
          </div>

          {/* Explanation */}
          <div className="mb-4">
            <h4 className="mb-2 text-xs uppercase tracking-wider text-[#5a4a3a] opacity-60">
              Deep Dive
            </h4>
            <p className="text-sm leading-relaxed text-[#5a4a3a]">
              {chapter.explanation}
            </p>
          </div>

          {/* Comments */}
          <div className="mt-4">
            <div className="mb-3 flex items-center gap-2 border-b border-[#e0d5c0] pb-2">
              <h4 className="text-sm font-semibold text-[#2c2416]">Discussion</h4>
              <span className="text-xs text-[#5a4a3a] opacity-50">
                ({localComments.length} comments)
              </span>
            </div>

            {localComments.map((c) => (
              <div className="flex gap-2.5 border-b border-[#f0e8d8] py-2.5 last:border-b-0" key={c.id}>
                <div
                  className="flex size-7 shrink-0 items-center justify-center rounded-full text-xs"
                  style={{ background: c.color || '#f0e8d8', color: '#fff' }}
                >
                  {c.avatar}
                </div>
                <div className="flex-1">
                  <span className="text-xs font-semibold text-[#2c2416]">{c.author}</span>
                  <span className="ml-2 text-[11px] text-[#5a4a3a] opacity-40">{c.time}</span>
                  <p className="mt-0.5 text-sm leading-relaxed text-[#5a4a3a]">{c.text}</p>
                </div>
              </div>
            ))}

            <form className="mt-3 flex gap-2 border-t border-[#f0e8d8] pt-3" onSubmit={handleSubmitComment}>
              <input
                type="text"
                placeholder="Share your insight..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 rounded-full border border-[#e0d5c0] bg-[#faf6ef] px-3.5 py-2 text-sm outline-none transition-colors focus:border-[#d4a843] focus:bg-white font-sans"
              />
              <button
                type="submit"
                className="cursor-pointer whitespace-nowrap rounded-full bg-[#2c2416] px-4 py-2 text-sm text-[#faf6ef] transition-colors hover:bg-[#b8860b] font-sans border-none"
              >
                Post
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
