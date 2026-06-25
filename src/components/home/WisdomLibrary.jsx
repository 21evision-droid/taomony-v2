import { useState } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { CHAPTERS, POPULAR_CHAPTERS } from '../../data/homeData';
import ChapterCard from './ChapterCard';

export default function WisdomLibrary({ videoData, onPlayVideo }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [sortMode, setSortMode] = useState('popular'); // 'popular' | 'chapters'

  const sourceList = sortMode === 'popular' ? POPULAR_CHAPTERS : CHAPTERS;

  const filtered = sourceList.filter(
    (ch) =>
      ch.titleZh.includes(searchTerm) ||
      ch.titleEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `chapter ${ch.number}`.includes(searchTerm.toLowerCase()) ||
      `第${ch.number}章`.includes(searchTerm),
  );

  const hasSearch = searchTerm.trim() !== '';
  const displayed = hasSearch || showAll ? filtered : filtered.slice(0, 3);
  const totalHidden = filtered.length - 3;

  return (
    <section className="py-8">
      <div className="px-4" style={{ maxWidth: 480, margin: '0 auto' }}>
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-xl text-lg"
              style={{ background: 'linear-gradient(135deg, #2c2416 0%, #5a4a3a 100%)', color: '#d4a843' }}
            >
              道
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold tracking-wider text-[#2c2416]">
                Wisdom Library
              </h2>
              <span className="text-[11px] italic text-[#5a4a3a] opacity-65">
                Tao Te Ching — Humanity&apos;s timeless classic of wisdom and the way
              </span>
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 rounded-full border border-[#e0d5c0] bg-white px-4 py-1.5 transition-colors focus-within:border-[#b8860b] focus-within:shadow-[0_0_0_3px_rgba(184,134,11,0.1)]">
            <Search size={14} className="text-[#5a4a3a] opacity-40" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[140px] border-none bg-transparent text-sm text-[#2c2416] outline-none placeholder:text-[#5a4a3a] placeholder:opacity-40 font-sans"
            />
          </div>
        </div>

        {/* Sort Toggle */}
        <div className="mb-4 flex w-full gap-0 rounded-lg bg-[#f0e8d8] p-0.5">
          <button
            className={`flex-1 cursor-pointer rounded-md px-3 py-2 text-sm font-medium transition-all font-sans border-none ${
              sortMode === 'popular'
                ? 'bg-white text-[#2c2416] font-semibold shadow-sm'
                : 'bg-transparent text-[#5a4a3a]'
            }`}
            onClick={() => setSortMode('popular')}
          >
            🔥 Popular
          </button>
          <button
            className={`flex-1 cursor-pointer rounded-md px-3 py-2 text-sm font-medium transition-all font-sans border-none ${
              sortMode === 'chapters'
                ? 'bg-white text-[#2c2416] font-semibold shadow-sm'
                : 'bg-transparent text-[#5a4a3a]'
            }`}
            onClick={() => setSortMode('chapters')}
          >
            📖 Chapters
          </button>
        </div>

        {/* Content */}
        {filtered.length === 0 ? (
          <div className="px-5 py-16 text-center text-[#5a4a3a] opacity-50">
            <p>No matching chapters found — try a different keyword</p>
          </div>
        ) : (
          <>
            {showAll && !hasSearch && (
              <button
                onClick={() => setShowAll(false)}
                className="mb-3 mt-0 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#e0d5c0] bg-transparent px-3 py-3 text-sm text-[#5a4a3a] transition-colors hover:border-[#d4a843] hover:text-[#b8860b] hover:bg-[#b8860b]/5 font-sans"
              >
                <ChevronUp size={16} /> Collapse back — show default (3 chapters)
              </button>
            )}

            <div className="flex flex-col gap-3">
              {displayed.map((ch) => (
                <ChapterCard key={ch.id} chapter={ch} videoData={videoData} onPlayVideo={onPlayVideo} />
              ))}
            </div>

            {!hasSearch && totalHidden > 0 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#e0d5c0] bg-transparent px-3 py-3 text-sm text-[#5a4a3a] transition-colors hover:border-[#d4a843] hover:text-[#b8860b] hover:bg-[#b8860b]/5 font-sans"
              >
                {showAll ? (
                  <>
                    <ChevronUp size={16} /> Collapse — show default (3 chapters)
                  </>
                ) : (
                  <>
                    <ChevronDown size={16} /> Show all {sourceList.length} chapters ({totalHidden} more)
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
