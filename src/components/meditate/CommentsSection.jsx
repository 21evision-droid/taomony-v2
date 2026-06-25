import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowUp, Loader2, Heart, MessageCircle, ChevronDown } from 'lucide-react';

const PAGE_SIZE = 10;

export default function CommentsSection({ canPost }) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');

  const fetchComments = async (pageNum) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('module', 'meditate')
        .order('created_at', { ascending: false })
        .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

      if (error) throw error;
      if (pageNum === 0) {
        setComments(data || []);
      } else {
        setComments((prev) => [...prev, ...(data || [])]);
      }
      setHasMore((data || []).length === PAGE_SIZE);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments(0);
  }, []);

  const handlePost = async () => {
    if (!text.trim() || !user || !canPost) return;
    setPosting(true);
    setPostError('');
    try {
      const displayName = profile?.display_name || user.email?.split('@')[0] || 'Spirit';
      const { data, error } = await supabase
        .from('comments')
        .insert({
          user_id: user.id,
          author: displayName,
          avatar: displayName.charAt(0).toUpperCase(),
          text: text.trim(),
          module: 'meditate',
          sub_module: 'collective',
          time: 'now',
          tag: 'member',
          likes: 0,
          liked: false,
          replies: [],
        })
        .select()
        .single();

      if (error) throw error;
      setComments((prev) => [data, ...prev]);
      setText('');
    } catch (err) {
      console.error('Failed to post comment:', err);
      setPostError(err.message || 'Failed to post. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handlePost();
    }
  };

  return (
    <div className="w-full px-4 mt-16 pb-8">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-5">
        <MessageCircle size={14} className="text-stone-500" />
        <span className="text-[11px] tracking-[0.2em] font-bold text-stone-500 uppercase">
          Shared Reflections
        </span>
      </div>

      {/* Comment list */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-stone-500" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-stone-600/50 text-[13px]">
            No reflections yet. Be the first to share.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="flex gap-3"
            >
              {/* Avatar */}
              <div className="flex items-center justify-center size-8 rounded-full bg-stone-700/50 text-stone-400 shrink-0 mt-0.5">
                <span className="text-[11px] font-bold">{comment.avatar}</span>
              </div>

              {/* Body */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[12px] font-bold text-stone-300">
                    {comment.author}
                  </span>
                  <span className="text-[10px] text-stone-600">
                    {comment.created_at
                      ? new Date(comment.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                      : comment.time}
                  </span>
                </div>
                <p className="text-[13px] text-stone-400 leading-relaxed break-words">
                  {comment.text}
                </p>
                <div className="flex items-center gap-3 mt-1.5">
                  <button className="flex items-center gap-1 text-stone-600 hover:text-stone-400 transition-colors">
                    <Heart size={11} />
                    <span className="text-[10px]">{comment.likes || 0}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center mt-5">
          <button
            onClick={() => {
              const nextPage = page + 1;
              setPage(nextPage);
              fetchComments(nextPage);
            }}
            className="flex items-center gap-2 text-stone-500 hover:text-stone-300 text-[11px] tracking-wider font-bold transition-colors uppercase"
          >
            <ChevronDown size={14} />
            Load More
          </button>
        </div>
      )}

      {/* Error feedback */}
      {postError && (
        <p className="mt-3 text-red-400 text-[11px] text-center">{postError}</p>
      )}

      {/* Input — only when joined the collective */}
      {canPost && (
        <div className="mt-5 flex items-center gap-3">
          <div className="flex-1">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Share your reflection..."
              rows={1}
              className="w-full h-10 bg-stone-800/60 border border-stone-700/50 rounded-xl px-4 py-2 text-[13px] text-stone-200 placeholder:text-stone-600 resize-none focus:outline-none focus:border-[#d4a843]/40 transition-colors"
            />
          </div>
          <button
            onClick={handlePost}
            disabled={posting}
            className="flex items-center justify-center size-10 rounded-xl bg-[#d4a843]/30 text-white hover:bg-[#d4a843]/50 transition-all shrink-0"
            style={{ opacity: (!text.trim() || posting) ? 0.4 : 1 }}
          >
            {posting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowUp size={18} />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
