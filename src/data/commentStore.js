// ── Comment Store ───────────────────────────────────────────
// Shared store for comments across CommentsSection and Profile.
// Uses Supabase for persistence + realtime subscriptions.
// Falls back to MOCK_COMMENTS for first-time seeding.

import { supabase } from '../lib/supabase';
import { MOCK_COMMENTS } from './taoWeightData';

const CHANGE_EVENT = 'comments-changed';
const listeners = new Set();
let channel = null;
let seedPromise = null;

function notify() {
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  listeners.forEach((fn) => fn());
}

function startRealtime() {
  if (channel) return;
  channel = supabase
    .channel('comments-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, notify)
    .subscribe();
}

/** Seed MOCK_COMMENTS into Supabase on first launch. */
async function ensureSeeded() {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    const { count, error } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true });
    if (error) { console.warn('commentStore seed check failed:', error.message); return; }
    if (count === 0) {
      const rows = MOCK_COMMENTS.map((c) => ({
        id: c.id,
        author: c.author,
        avatar: c.avatar,
        time: c.time,
        tag: c.tag,
        module: c.module,
        sub_module: c.subModule,
        text: c.text,
        likes: c.likes,
        liked: c.liked || false,
        replies: c.replies || [],
      }));
      const { error: insErr } = await supabase.from('comments').insert(rows);
      if (insErr) console.error('Seeding comments failed:', insErr.message);
      else console.log('Seeded', rows.length, 'mock comments into Supabase');
    }
  })();
  return seedPromise;
}

/** Fetch all comments from Supabase. Returns a Promise. */
export async function getComments() {
  await ensureSeeded();
  startRealtime();
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Failed to load comments:', error.message);
    return [];
  }
  // Map snake_case DB fields → camelCase (for backward compat with components)
  return (data || []).map(mapRow);
}

function mapRow(r) {
  return {
    id: r.id,
    author: r.author,
    avatar: r.avatar,
    time: r.time,
    tag: r.tag,
    module: r.module,
    subModule: r.sub_module,
    text: r.text,
    likes: r.likes,
    liked: r.liked,
    replies: Array.isArray(r.replies) ? r.replies : [],
  };
}

/** Subscribe to comment changes. Returns unsubscribe function. */
export function subscribe(callback) {
  startRealtime();
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/** Add a new comment. */
export async function addComment(comment) {
  const row = {
    id: Date.now(),
    author: 'You',
    avatar: '🧑',
    time: 'just now',
    tag: comment.tag || 'weight-loss',
    module: comment.module || 'challenge',
    sub_module: comment.subModule || comment.module || 'challenge',
    text: comment.text,
    likes: 0,
    liked: false,
    replies: [],
  };
  const { error } = await supabase.from('comments').insert(row);
  if (error) {
    console.error('Failed to add comment:', error.message);
    return null;
  }
  notify();
  return mapRow(row);
}

/** Toggle like on a comment or a reply. */
export async function toggleLike(commentId, replyId) {
  // Fetch current row
  const { data, error } = await supabase
    .from('comments')
    .select('likes, liked, replies')
    .eq('id', commentId)
    .single();
  if (error || !data) return;

  if (replyId) {
    // Toggle like on a nested reply
    const replies = (data.replies || []).map((r) =>
      r.id === replyId
        ? { ...r, liked: !r.liked, likes: r.liked ? r.likes - 1 : r.likes + 1 }
        : r
    );
    await supabase.from('comments').update({ replies }).eq('id', commentId);
  } else {
    // Toggle like on the comment itself
    await supabase
      .from('comments')
      .update({ liked: !data.liked, likes: data.liked ? data.likes - 1 : data.likes + 1 })
      .eq('id', commentId);
  }
  notify();
}

/** Add a reply to a comment. */
export async function addReply(commentId, text) {
  const { data, error } = await supabase
    .from('comments')
    .select('replies')
    .eq('id', commentId)
    .single();
  if (error || !data) return;

  const newReply = {
    id: Date.now(),
    author: 'You',
    avatar: '🧑',
    time: 'just now',
    text,
    likes: 0,
    liked: false,
  };
  await supabase
    .from('comments')
    .update({ replies: [...(data.replies || []), newReply] })
    .eq('id', commentId);
  notify();
}
