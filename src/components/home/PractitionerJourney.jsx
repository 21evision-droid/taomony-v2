import { useState, useMemo, useEffect } from 'react';
import { Heart, MessageCircle, Plus, LogIn, Check, ArrowUpDown, Hash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { JOURNEY_POSTS, KEY_QUOTES } from '../../data/homeData';
import { addComment } from '../../data/commentStore';

export default function PractitionerJourney() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState({ keywordId: null, content: '' });

  // Load posts from Supabase on mount; seed from JOURNEY_POSTS if empty
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('journey_posts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Failed to load journey posts:', error.message);
        return;
      }
      if (data && data.length > 0) {
        setPosts(data);
      } else {
        // Seed from mock data
        const rows = JOURNEY_POSTS.map((p) => ({
          id: p.id,
          author: p.author,
          avatar: p.avatar,
          role: p.role || 'Practitioner',
          keyword: p.keyword || null,
          excerpt: p.excerpt,
          likes: p.likes || 0,
          comments: p.comments || 0,
          time: p.time || 'Just now',
          color: p.color || '#b8860b',
        }));
        const { error: insErr } = await supabase.from('journey_posts').insert(rows);
        if (insErr) console.error('Seeding journey posts failed:', insErr.message);
        else setPosts(rows);
      }
    })();
  }, []);

  // Filter state
  const [filterMode, setFilterMode] = useState('keyword'); // 'keyword' | 'time'
  const [selectedKeyword, setSelectedKeyword] = useState(null);
  const [timeSort, setTimeSort] = useState('newest'); // 'newest' | 'oldest'

  const selectedQuote = KEY_QUOTES.find((q) => q.id === form.keywordId);

  // Helper: resolve keyword for a post
  const getKeyword = (post) => {
    const id = post.keyword || post.keywordId;
    return KEY_QUOTES.find((q) => q.id === id);
  };

  // Filtered and sorted posts
  const displayedPosts = useMemo(() => {
    let result = [...posts];

    if (filterMode === 'keyword' && selectedKeyword) {
      result = result.filter((p) => {
        const id = p.keyword || p.keywordId;
        return id === selectedKeyword;
      });
    }

    if (filterMode === 'time') {
      const order = { newest: -1, oldest: 1 };
      result.sort((a, b) => {
        // Simple time comparison based on the mock time strings
        const timeOrder = { 'Just now': 0, '2 days ago': 2, '5 days ago': 5, '1 week ago': 7, '2 weeks ago': 14 };
        return (timeOrder[a.time] || 0) < (timeOrder[b.time] || 0) ? order[timeSort] : -order[timeSort];
      });
    }

    return result;
  }, [posts, filterMode, selectedKeyword, timeSort]);

  const handleOpenModal = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setShowModal(true);
  };

  const handlePublish = async () => {
    if (!form.keywordId || !form.content.trim()) return;
    const newPost = {
      id: Date.now(),
      author: profile?.display_name || user?.email || 'Anonymous',
      avatar: (profile?.display_name || user?.email || 'A').charAt(0).toUpperCase(),
      role: 'Practitioner',
      keyword: form.keywordId,
      excerpt: form.content,
      likes: 0,
      comments: 0,
      time: 'Just now',
      color: '#b8860b',
    };
    const { error } = await supabase.from('journey_posts').insert(newPost);
    if (error) {
      console.error('Failed to save journey post:', error.message);
      return;
    }
    setPosts([newPost, ...posts]);
    // Also save to commentStore so it appears in Profile's CommentActivity
    addComment({ tag: 'wellness', module: 'home', subModule: 'practitioner-journey', text: form.content.trim() });
    setForm({ keywordId: null, content: '' });
    setShowModal(false);
  };

  // Count posts per keyword
  const keywordCounts = useMemo(() => {
    const counts = {};
    posts.forEach((p) => {
      const id = p.keyword || p.keywordId;
      counts[id] = (counts[id] || 0) + 1;
    });
    return counts;
  }, [posts]);

  return (
    <section className="pb-10 pt-6">
      <div className="px-4" style={{ maxWidth: 480, margin: '0 auto' }}>
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex size-9 items-center justify-center rounded-xl text-lg text-white"
              style={{ background: 'linear-gradient(135deg, #b8860b 0%, #d4a843 100%)' }}
            >
              心
            </div>
            <h2 className="font-serif text-lg font-semibold tracking-wider text-[#2c2416]">
              Practitioner Journey
            </h2>
          </div>
          <button
            onClick={handleOpenModal}
            className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full bg-[#2c2416] px-4 py-2 text-sm text-[#faf6ef] transition-colors hover:bg-[#b8860b] font-sans border-none"
          >
            {user ? (
              <><Plus size={16} className="font-light" /> Share Insight</>
            ) : (
              <><LogIn size={14} /> Sign In to Share</>
            )}
          </button>
        </div>

        {/* Filter Bar */}
        <div className="mb-4">
          {/* Mode Toggle */}
          <div className="mb-2.5 flex w-full gap-0 rounded-lg bg-[#f0e8d8] p-0.5">
            <button
              onClick={() => { setFilterMode('keyword'); setSelectedKeyword(null); }}
              className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all font-sans border-none ${
                filterMode === 'keyword'
                  ? 'bg-white text-[#2c2416] font-semibold shadow-sm'
                  : 'bg-transparent text-[#5a4a3a]'
              }`}
            >
              <Hash size={14} /> By Keyword
            </button>
            <button
              onClick={() => setFilterMode('time')}
              className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all font-sans border-none ${
                filterMode === 'time'
                  ? 'bg-white text-[#2c2416] font-semibold shadow-sm'
                  : 'bg-transparent text-[#5a4a3a]'
              }`}
            >
              <ArrowUpDown size={14} /> By Time
            </button>
          </div>

          {/* Keyword Filter Chips */}
          {filterMode === 'keyword' && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setSelectedKeyword(null)}
                className={`cursor-pointer shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-all font-sans whitespace-nowrap ${
                  !selectedKeyword
                    ? 'border-[#b8860b] bg-[#b8860b] text-white'
                    : 'border-[#e0d5c0] bg-white text-[#5a4a3a] hover:border-[#d4a843]'
                }`}
              >
                All ({posts.length})
              </button>
              {KEY_QUOTES.filter((q) => keywordCounts[q.id]).map((q) => (
                <button
                  key={q.id}
                  onClick={() => setSelectedKeyword(q.id)}
                  className={`cursor-pointer shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-all font-sans whitespace-nowrap ${
                    selectedKeyword === q.id
                      ? 'border-[#b8860b] bg-[#b8860b] text-white'
                      : 'border-[#e0d5c0] bg-white text-[#5a4a3a] hover:border-[#d4a843]'
                  }`}
                >
                  {q.zh} ({keywordCounts[q.id]})
                </button>
              ))}
            </div>
          )}

          {/* Time Sort */}
          {filterMode === 'time' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTimeSort('newest')}
                className={`cursor-pointer rounded-full border px-4 py-1.5 text-xs font-medium transition-all font-sans ${
                  timeSort === 'newest'
                    ? 'border-[#b8860b] bg-[#b8860b] text-white'
                    : 'border-[#e0d5c0] bg-white text-[#5a4a3a] hover:border-[#d4a843]'
                }`}
              >
                Newest First
              </button>
              <button
                onClick={() => setTimeSort('oldest')}
                className={`cursor-pointer rounded-full border px-4 py-1.5 text-xs font-medium transition-all font-sans ${
                  timeSort === 'oldest'
                    ? 'border-[#b8860b] bg-[#b8860b] text-white'
                    : 'border-[#e0d5c0] bg-white text-[#5a4a3a] hover:border-[#d4a843]'
                }`}
              >
                Oldest First
              </button>
            </div>
          )}
        </div>

        {/* Posts */}
        {displayedPosts.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#5a4a3a] opacity-50">
            No insights found for this keyword.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {displayedPosts.map((post) => {
              const kw = getKeyword(post);
              return (
                <div
                  key={post.id}
                  className="rounded-xl border border-[#e0d5c0] bg-white px-4 py-4 transition-shadow hover:shadow-md"
                >
                  <div className="mb-3 flex items-center gap-2.5">
                    <div
                      className="flex size-8 items-center justify-center rounded-full text-sm font-semibold text-white"
                      style={{ background: post.color }}
                    >
                      {post.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#2c2416]">{post.author}</div>
                      <div className="text-[11px] text-[#5a4a3a] opacity-50">{post.role}</div>
                    </div>
                  </div>

                  <div>
                    {kw && (
                      <div className="mb-2 inline-block rounded-lg bg-[#f0e8d8] px-3 py-1.5">
                        <p className="font-cn text-sm font-medium text-[#2c2416]">{kw.zh}</p>
                        <p className="text-[11px] italic text-[#5a4a3a] opacity-70">{kw.en}</p>
                      </div>
                    )}
                    <p className="line-clamp-3 text-sm leading-relaxed text-[#5a4a3a]">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center gap-4 border-t border-[#f0e8d8] pt-3 text-xs text-[#5a4a3a] opacity-60">
                    <span className="flex items-center gap-1">
                      <Heart size={12} /> {post.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle size={12} /> {post.comments}
                    </span>
                    <span className="ml-auto">{post.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Publish Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center"
          style={{ background: 'rgba(44, 36, 22, 0.5)' }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-[480px] animate-slide-up overflow-y-auto rounded-t-2xl bg-white px-5 pb-8 pt-6"
            style={{ maxHeight: '85vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-[#e0d5c0]" />

            <h3 className="mb-4 text-center font-serif text-lg font-semibold text-[#2c2416]">
              Share Your Insight
            </h3>

            <div className="mb-4 flex items-center gap-2.5 rounded-lg bg-[#faf6ef] px-3.5 py-2.5">
              <div className="flex size-7 items-center justify-center rounded-full bg-[#d4a843] text-xs font-semibold text-white">
                {(profile?.display_name || user?.email || '?').charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-[#2c2416]">
                {profile?.display_name || user?.email}
              </span>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-xs font-medium text-[#5a4a3a]">
                Key Word — choose a Tao Te Ching verse
              </label>
              <div className="flex max-h-[200px] flex-col gap-1.5 overflow-y-auto rounded-lg border border-[#e0d5c0] bg-[#faf6ef] p-1.5">
                {KEY_QUOTES.map((q) => {
                  const selected = form.keywordId === q.id;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setForm({ ...form, keywordId: q.id })}
                      className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2.5 text-left transition-all font-sans ${
                        selected
                          ? 'border-[#b8860b] bg-white shadow-sm'
                          : 'border-transparent bg-white/50 hover:bg-white'
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-white transition-colors ${
                          selected
                            ? 'border-[#b8860b] bg-[#b8860b]'
                            : 'border-[#e0d5c0] bg-white'
                        }`}
                      >
                        {selected && <Check size={12} strokeWidth={3} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-cn text-sm font-medium text-[#2c2416]">{q.zh}</p>
                        <p className="mt-0.5 text-[11px] italic leading-tight text-[#5a4a3a] opacity-60">
                          {q.en}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-3.5">
              <label className="mb-1 block text-xs font-medium text-[#5a4a3a]">Your Reflection</label>
              <textarea
                placeholder="How does this verse speak to your life?"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={5}
                className="w-full resize-none rounded-lg border border-[#e0d5c0] bg-[#faf6ef] px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#d4a843] focus:bg-white font-sans"
              />
            </div>

            <div className="mt-5 flex gap-2.5">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 cursor-pointer rounded-full bg-[#faf6ef] px-3 py-3 text-sm font-medium text-[#5a4a3a] transition-colors hover:bg-[#f0e8d8] font-sans border-none"
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                disabled={!form.keywordId || !form.content.trim()}
                className="flex-1 cursor-pointer rounded-full bg-[#2c2416] px-3 py-3 text-sm font-medium text-[#faf6ef] transition-colors hover:bg-[#b8860b] disabled:opacity-40 font-sans border-none"
              >
                Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
