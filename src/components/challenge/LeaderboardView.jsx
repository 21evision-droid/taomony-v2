import { useState } from 'react';
import { MOCK_RANKINGS } from '../../data/taoWeightData';
import CommentsSection from './CommentsSection';

function getRankDisplay(r) {
  if (r === 1) return '🥇';
  if (r === 2) return '🥈';
  if (r === 3) return '🥉';
  return r;
}

export default function LeaderboardView() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [showAll, setShowAll] = useState(false);

  const month = MOCK_RANKINGS[activeIdx];
  const top3 = month.list.slice(0, 3);
  const rest = month.list.slice(3);

  return (
    <div>
      {/* Month selector pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 scrollbar-hide">
        {MOCK_RANKINGS.map((m, i) => (
          <button
            key={m.key}
            onClick={() => { setActiveIdx(i); setShowAll(false); }}
            className={
              'shrink-0 px-4 py-1.5 rounded-full border text-[13px] cursor-pointer transition-all duration-200 ' +
              (i === activeIdx
                ? 'bg-[#d97706] text-white border-[#d97706]'
                : 'bg-transparent text-[#5a4a3a] border-[#e0d5c0] hover:border-[#d97706] hover:text-[#d97706]')
            }
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Top 3 */}
      <div>
        {top3.map(item => (
          <div key={item.rank} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl mb-0.5">
            <div className="w-7 shrink-0 text-center text-sm font-bold text-[#5a4a3a]">
              {getRankDisplay(item.rank)}
            </div>
            <div className="w-9 h-9 rounded-full bg-[#f0e8d8] flex items-center justify-center text-sm shrink-0">
              {item.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-[#2c2416]">{item.name}</div>
              <div className="text-xs text-[#5a4a3a] opacity-60">Rank #{item.rank}</div>
            </div>
            <div className="text-sm font-bold text-[#d97706] shrink-0">
              {item.points.toLocaleString()} pts
            </div>
          </div>
        ))}
      </div>

      {/* Rank 4-10 (expandable) */}
      {showAll && (
        <div>
          {rest.map(item => (
            <div key={item.rank} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl mb-0.5">
              <div className="w-7 shrink-0 text-center text-sm font-bold text-[#5a4a3a]">
                {item.rank}
              </div>
              <div className="w-9 h-9 rounded-full bg-[#f0e8d8] flex items-center justify-center text-sm shrink-0">
                {item.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[#2c2416]">{item.name}</div>
                <div className="text-xs text-[#5a4a3a] opacity-60">Rank #{item.rank}</div>
              </div>
              <div className="text-sm font-bold text-[#d97706] shrink-0">
                {item.points.toLocaleString()} pts
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Show / hide toggle */}
      <button
        className="block w-full py-2.5 my-1 border border-dashed border-[#e0d5c0] rounded-full text-[13px] text-[#5a4a3a] cursor-pointer text-center hover:border-[#d97706] hover:text-[#d97706] transition-all duration-200"
        onClick={() => setShowAll(!showAll)}
      >
        {showAll ? '▲ Show Less' : `▼ Show All (${month.list.length})`}
      </button>

      {/* Self-rank row */}
      {month.myRank && (
        <div className="my-2 mb-4 px-4 py-2.5 bg-[#fefce8] rounded-xl flex items-center gap-3">
          <div className="w-7 shrink-0 text-center text-sm font-bold text-[#5a4a3a]">
            {month.myRank.rank}
          </div>
          <div className="w-9 h-9 rounded-full bg-[#fef9c3] flex items-center justify-center text-sm shrink-0">
            {month.myRank.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-[#2c2416]">
              {month.myRank.name}{' '}
              <span className="text-[11px] text-[#d97706] font-normal">← That's you</span>
            </div>
            <div className="text-xs text-[#5a4a3a] opacity-60">Rank #{month.myRank.rank}</div>
          </div>
          <div className="text-sm font-bold text-[#d97706] shrink-0">
            {month.myRank.points.toLocaleString()} pts
          </div>
        </div>
      )}

      {/* Comments section */}
      <CommentsSection />
    </div>
  );
}
