import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { getComments, subscribe } from '../../data/commentStore';

const ACCORDION_SECTIONS = [
  { id: 'wisdom-library',       label: 'Wisdom Library',         icon: '📖', color: '#10b981', bg: 'bg-emerald-50/50' },
  { id: 'practitioner-journey', label: 'Practitioner Journey',   icon: '💭', color: '#b8860b', bg: 'bg-yellow-50/50' },
  { id: 'meditation-guide',     label: 'Meditate',               icon: '🧘', color: '#8b5cf6', bg: 'bg-purple-50/50' },
  { id: 'sleep-stories',        label: 'Sleep',                  icon: '🌙', color: '#6366f1', bg: 'bg-indigo-50/50' },
];

function CommentCard({ comment }) {
  return (
    <div className="border-b border-[#e0d5c0]/50 py-2.5 last:border-b-0 last:pb-0">
      <div className="flex items-start gap-2">
        <div className="size-6 shrink-0 flex items-center justify-center rounded-full bg-[#f0e8d8] text-[10px] mt-0.5">
          {comment.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-[#2c2416]">{comment.author}</span>
            <span className="text-[10px] text-[#5a4a3a] opacity-40">{comment.time}</span>
          </div>
          <p className="mt-0.5 text-sm leading-relaxed text-[#5a4a3a]">{comment.text}</p>
          <div className="flex items-center gap-3 mt-1 text-[10px] text-[#5a4a3a] opacity-50">
            <span>{comment.likes > 0 ? `${comment.likes} likes` : '0 likes'}</span>
            {comment.replies?.length > 0 && <span>{comment.replies.length} replies</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CommentActivity() {
  const [activeTab, setActiveTab] = useState('all');
  const [openSection, setOpenSection] = useState(null);
  const [allComments, setAllComments] = useState([]);

  useEffect(() => {
    getComments().then(setAllComments);
    const unsub = subscribe(() => getComments().then(setAllComments));
    return unsub;
  }, []);
  const challengeComments = allComments.filter((c) => c.subModule === 'challenge-discussion');

  // When "Challenge" tab: show only challenge comments
  if (activeTab === 'challenge') {
    return (
      <div className="mt-8 mb-6">
        <Divider label="COMMENT ACTIVITY" />
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="mt-4 flex flex-col gap-3">
          {challengeComments.length === 0 ? (
            <EmptyState />
          ) : (
            challengeComments.map((c) => (
              <div key={c.id} className="rounded-xl border border-dashed border-[#e0d5c0] p-4">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="size-[30px] shrink-0 flex items-center justify-center rounded-full bg-[#f0e8d8] text-sm">
                    {c.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#2c2416]">{c.author}</span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100" style={{ color: '#d97706' }}>
                        Challenge
                      </span>
                    </div>
                    <span className="text-[11px] text-[#5a4a3a] opacity-50">{c.time}</span>
                  </div>
                </div>
                <p className="text-sm text-[#5a4a3a] leading-relaxed mb-2">{c.text}</p>
                <div className="flex items-center gap-3 text-xs text-[#5a4a3a] opacity-50">
                  <span>{c.likes > 0 ? `${c.likes} likes` : '0 likes'}</span>
                  {c.replies.length > 0 && <span>{c.replies.length} replies</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // "All" tab: challenge cards + accordion sections
  const toggleSection = (id) => {
    setOpenSection(openSection === id ? null : id);
  };

  return (
    <div className="mt-8 mb-6">
      <Divider label="COMMENT ACTIVITY" />
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="mt-4 flex flex-col gap-4">
        {/* Challenge section — always visible in "All" */}
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#5a4a3a] opacity-60 flex items-center gap-1.5">
            <span className="inline-block w-1 h-3.5 rounded-full bg-amber-400" />
            Challenge Discussion
          </h3>
          {challengeComments.length === 0 ? (
            <p className="text-xs text-[#5a4a3a] opacity-40 pl-3">No discussions yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {challengeComments.map((c) => (
                <CommentCard key={c.id} comment={c} />
              ))}
            </div>
          )}
        </div>

        {/* Accordion sections for other modules */}
        <div className="border-t border-[#e0d5c0] pt-4">
          {ACCORDION_SECTIONS.map((section) => {
            const sectionComments = allComments.filter((c) => c.subModule === section.id);
            const isOpen = openSection === section.id;

            return (
              <div key={section.id} className="mb-2">
                {/* Accordion header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-all cursor-pointer font-sans text-left ${
                    isOpen
                      ? 'border-[#d4a843] bg-white shadow-sm'
                      : 'border-[#e0d5c0] bg-white hover:border-[#d4a843] hover:shadow-sm'
                  }`}
                >
                  <span className="text-base">{section.icon}</span>
                  <span className="flex-1 text-sm font-medium text-[#2c2416]">{section.label}</span>
                  <span className="text-[11px] text-[#5a4a3a] opacity-50 bg-[#f0e8d8] px-2 py-0.5 rounded-full">
                    {sectionComments.length}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-[#5a4a3a] opacity-40 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Accordion content */}
                {isOpen && (
                  <div className="mt-1.5 mx-3.5 px-3.5 py-3 rounded-xl border border-[#e0d5c0]/60 bg-[#faf6ef]/50">
                    {sectionComments.length === 0 ? (
                      <p className="text-xs text-[#5a4a3a] opacity-40 py-2 text-center">
                        No comments in {section.label} yet.
                      </p>
                    ) : (
                      sectionComments.map((c) => (
                        <CommentCard key={c.id} comment={c} />
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──

function Divider({ label }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="h-px flex-1 bg-stone-200" />
      <span className="text-xs font-medium tracking-widest text-stone-400">{label}</span>
      <div className="h-px flex-1 bg-stone-200" />
    </div>
  );
}

function TabBar({ activeTab, onTabChange }) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onTabChange('all')}
        className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold cursor-pointer transition-all duration-200 font-sans border-none ${
          activeTab === 'all'
            ? 'bg-[#d97706] text-white shadow-[0_2px_6px_rgba(217,119,6,0.2)]'
            : 'bg-[#f0e8d8] text-[#5a4a3a] hover:bg-[#e0d5c0]'
        }`}
      >
        All
      </button>
      <button
        onClick={() => onTabChange('challenge')}
        className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold cursor-pointer transition-all duration-200 font-sans border-none ${
          activeTab === 'challenge'
            ? 'bg-[#d97706] text-white shadow-[0_2px_6px_rgba(217,119,6,0.2)]'
            : 'bg-[#f0e8d8] text-[#5a4a3a] hover:bg-[#e0d5c0]'
        }`}
      >
        Challenge
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-8 text-center text-sm text-[#5a4a3a] opacity-50">
      <div className="mb-2 text-3xl opacity-30">💬</div>
      <p>No comments yet in this module.</p>
    </div>
  );
}
