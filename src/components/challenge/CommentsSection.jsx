import { useState, useEffect } from 'react';
import { COMMENT_TAGS } from '../../data/taoWeightData';
import { getComments, addComment, toggleLike, addReply, subscribe } from '../../data/commentStore';

function tagLabel(id) {
  return COMMENT_TAGS.find(t => t.id === id)?.label || id;
}

export default function CommentsSection() {
  const [comments, setComments] = useState([]);
  const [filterTag, setFilterTag] = useState('weight-loss');
  const [newText, setNewText] = useState('');
  const [replyOpen, setReplyOpen] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    getComments().then(setComments);
    const unsub = subscribe(() => getComments().then(setComments));
    return unsub;
  }, []);

  const filteredComments = filterTag === 'all'
    ? comments
    : comments.filter(c => c.tag === filterTag);

  const handlePost = async () => {
    if (!newText.trim()) return;
    await addComment({
      tag: filterTag === 'all' ? 'weight-loss' : filterTag,
      module: 'challenge',
      subModule: 'challenge-discussion',
      text: newText.trim(),
    });
    setNewText('');
  };

  const handleLike = async (commentId, replyId) => {
    await toggleLike(commentId, replyId);
    getComments().then(setComments);
  };

  const handleReplyPost = async (commentId) => {
    if (!replyText.trim()) return;
    await addReply(commentId, replyText.trim());
    setReplyText('');
    setReplyOpen(null);
  };

  return (
    <div>
      {/* Section title */}
      <div className="text-[15px] font-semibold mt-6 mb-3 pt-4 border-t border-[#e0d5c0]">
        💬 Discussion ({filteredComments.length})
      </div>

      {/* Tag filter pills */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        {COMMENT_TAGS.map(t => (
          <button
            key={t.id}
            onClick={() => setFilterTag(t.id)}
            className={
              'px-3.5 py-1 rounded-full border text-xs cursor-pointer transition-all duration-200 ' +
              (filterTag === t.id
                ? 'bg-[#d97706] text-white border-[#d97706]'
                : 'bg-transparent text-[#5a4a3a] border-[#e0d5c0] hover:border-[#d97706] hover:text-[#d97706]')
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div className="flex gap-2 mb-5">
        <input
          placeholder="Share your thoughts..."
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handlePost()}
          className="flex-1 px-4 py-2.5 border border-[#e0d5c0] rounded-full text-[13px] outline-none bg-white focus:border-[#d97706] transition-colors"
        />
        <button
          onClick={handlePost}
          className="px-5 py-2.5 rounded-full bg-[#d97706] text-white text-[13px] font-semibold cursor-pointer whitespace-nowrap hover:bg-[#b85c00] transition-colors"
        >
          Post
        </button>
      </div>

      {/* Empty state */}
      {filteredComments.length === 0 ? (
        <div className="py-6 text-center text-[13px] text-[#5a4a3a] opacity-50">
          No discussions yet in this category.
        </div>
      ) : (
        /* Comment cards */
        filteredComments.map(c => (
          <div key={c.id} className="border border-dashed border-[#e0d5c0] rounded-xl p-3.5 mb-4">
            {/* Head */}
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-full bg-[#f0e8d8] flex items-center justify-center text-xs shrink-0">
                {c.avatar}
              </div>
              <span className="text-[13px] font-semibold text-[#2c2416]">{c.author}</span>
              <span className="text-[11px] text-[#5a4a3a] opacity-50">{c.time}</span>
              <span className="ml-auto text-[10px] text-[#d97706] bg-[#fef3c7] px-2 py-0.5 rounded-full whitespace-nowrap">
                {tagLabel(c.tag)}
              </span>
            </div>

            {/* Text */}
            <div className="text-sm text-[#5a4a3a] leading-relaxed ml-[42px] mb-1.5">
              {c.text}
            </div>

            {/* Actions */}
            <div className="flex gap-4 ml-[42px]">
              <button
                onClick={() => handleLike(c.id, null)}
                className="bg-transparent border-none text-xs text-[#5a4a3a] opacity-60 cursor-pointer flex items-center gap-1 hover:opacity-100 hover:text-[#d97706] transition-all"
              >
                👍 {c.likes}
              </button>
              <button
                onClick={() => setReplyOpen(replyOpen === c.id ? null : c.id)}
                className="bg-transparent border-none text-xs text-[#5a4a3a] opacity-60 cursor-pointer flex items-center gap-1 hover:opacity-100 hover:text-[#d97706] transition-all"
              >
                💬 Reply
              </button>
            </div>

            {/* Reply input */}
            {replyOpen === c.id && (
              <div className="flex gap-2 mt-2 ml-[42px]">
                <input
                  placeholder="Write a reply..."
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleReplyPost(c.id)}
                  className="flex-1 px-4 py-2 border border-[#e0d5c0] rounded-full text-[13px] outline-none bg-white focus:border-[#d97706] transition-colors"
                />
                <button
                  onClick={() => handleReplyPost(c.id)}
                  className="px-4 py-2 rounded-full bg-[#d97706] text-white text-[13px] font-semibold cursor-pointer whitespace-nowrap hover:bg-[#b85c00] transition-colors"
                >
                  Reply
                </button>
              </div>
            )}

            {/* Replies */}
            {c.replies.length > 0 && (
              <div className="ml-[42px] mt-2 pl-3 border-l-2 border-[#f0e8d8]">
                {c.replies.map(r => (
                  <div key={r.id} className="border-none rounded-none p-0 pb-2 mb-2 last:mb-0">
                    {/* Reply head */}
                    <div className="flex items-center gap-2.5 mb-1">
                      <div className="w-[26px] h-[26px] rounded-full bg-[#f0e8d8] flex items-center justify-center text-[11px] shrink-0">
                        {r.avatar}
                      </div>
                      <span className="text-[13px] font-semibold text-[#2c2416]">{r.author}</span>
                      <span className="text-[11px] text-[#5a4a3a] opacity-50">{r.time}</span>
                    </div>

                    {/* Reply text */}
                    <div className="text-sm text-[#5a4a3a] leading-relaxed ml-0 mb-1">
                      {r.text}
                    </div>

                    {/* Reply actions */}
                    <div className="flex gap-4 ml-0">
                      <button
                        onClick={() => handleLike(c.id, r.id)}
                        className="bg-transparent border-none text-xs text-[#5a4a3a] opacity-60 cursor-pointer flex items-center gap-1 hover:opacity-100 hover:text-[#d97706] transition-all"
                      >
                        👍 {r.likes}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
