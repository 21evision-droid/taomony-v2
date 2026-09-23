// ── Reflection Store ─────────────────────────────────────────
// Shared store for Resonance reflections.
// Module-agnostic: any module calls saveReflection() to auto-publish
// a reflection to Resonance, classified by `source`.
//
//   source        — 'learning' | 'meditate' | 'sleep' | 'eating'
//   sourceDetail  — optional sub-source (e.g. journey title)

import { supabase } from '../lib/supabase';

const CHANGE_EVENT = 'reflections-changed';
const listeners = new Set();

function notify() {
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  listeners.forEach((fn) => fn());
}

function startRealtime() {
  // The Supabase client keeps subscribed channels across HMR reloads, while
  // this module's state resets. Check the client's registry so we never call
  // .on() on an already-subscribed channel.
  if (
    supabase
      .getChannels()
      .some((c) => c.topic === 'realtime:reflections-realtime')
  ) {
    return;
  }
  supabase
    .channel('reflections-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'reflections' }, notify)
    .subscribe();
}

// The `reflections → profiles` embed must name its FK explicitly: adding the
// likes/comments tables (which also reference profiles) made `profiles(...)`
// ambiguous to PostgREST (PGRST201).
const SELECT =
  'id, content, source, source_detail, created_at, profiles!reflections_user_id_fkey(display_name, avatar_url)';

/**
 * Auto-publish a reflection to Resonance.
 * @param {{ source: string, sourceDetail?: string, content: string }} input
 * @returns {Promise<object|null>} inserted row, or null on failure
 */
export async function saveReflection({ source, sourceDetail, content }) {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from('reflections')
    .insert({
      user_id: userId,
      source,
      source_detail: sourceDetail || null,
      content,
    })
    .select(SELECT)
    .single();

  if (error) {
    console.error('Failed to save reflection:', error.message);
    return null;
  }
  notify();
  return data;
}

/**
 * Fetch all reflections, newest first, with author profiles.
 */
export async function fetchReflections() {
  startRealtime();
  const { data, error } = await supabase
    .from('reflections')
    .select(SELECT)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load reflections:', error.message);
    return [];
  }
  return data || [];
}

/** Subscribe to reflection changes. Returns an unsubscribe function. */
export function subscribe(callback) {
  startRealtime();
  listeners.add(callback);
  return () => listeners.delete(callback);
}

// ── Reactions (likes + comments) ────────────────────────────

const COMMENT_SELECT = 'id, content, created_at, profiles(display_name)';

/**
 * Load like/comment counts (and the current user's liked state) for a set
 * of reflections. Returns { [reflectionId]: { likeCount, liked, commentCount } }.
 */
export async function fetchReactionCounts(reflectionIds) {
  if (!reflectionIds.length) return {};
  const ids = [...new Set(reflectionIds)];

  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id || null;

  const [likesRes, commentsRes] = await Promise.all([
    supabase
      .from('reflection_likes')
      .select('reflection_id, user_id')
      .in('reflection_id', ids),
    supabase
      .from('reflection_comments')
      .select('reflection_id')
      .in('reflection_id', ids),
  ]);

  const likeCounts = {};
  const likedByMe = {};
  for (const row of likesRes.data || []) {
    likeCounts[row.reflection_id] = (likeCounts[row.reflection_id] || 0) + 1;
    if (userId && row.user_id === userId) likedByMe[row.reflection_id] = true;
  }

  const commentCounts = {};
  for (const row of commentsRes.data || []) {
    commentCounts[row.reflection_id] =
      (commentCounts[row.reflection_id] || 0) + 1;
  }

  const map = {};
  for (const id of ids) {
    map[id] = {
      likeCount: likeCounts[id] || 0,
      liked: likedByMe[id] || false,
      commentCount: commentCounts[id] || 0,
    };
  }
  return map;
}

/**
 * Toggle a like on a reflection for the current user.
 * Returns { liked: boolean } or null when unauthenticated/failed.
 */
export async function toggleLike(reflectionId) {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  if (!userId) return null;

  const { data: existing } = await supabase
    .from('reflection_likes')
    .select('reflection_id')
    .eq('reflection_id', reflectionId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('reflection_likes')
      .delete()
      .eq('reflection_id', reflectionId)
      .eq('user_id', userId);
    if (error) {
      console.error('Failed to unlike:', error.message);
      return null;
    }
    return { liked: false };
  }

  const { error } = await supabase
    .from('reflection_likes')
    .insert({ reflection_id: reflectionId, user_id: userId });
  if (error) {
    console.error('Failed to like:', error.message);
    return null;
  }
  return { liked: true };
}

/** Fetch a reflection's comments, oldest first, with author names. */
export async function fetchComments(reflectionId) {
  const { data, error } = await supabase
    .from('reflection_comments')
    .select(COMMENT_SELECT)
    .eq('reflection_id', reflectionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to load comments:', error.message);
    return [];
  }
  return data || [];
}

/**
 * Add a comment to a reflection. Returns the inserted row (with author
 * profile) or null when unauthenticated/failed.
 */
export async function addComment(reflectionId, content) {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from('reflection_comments')
    .insert({ reflection_id: reflectionId, user_id: userId, content })
    .select(COMMENT_SELECT)
    .single();

  if (error) {
    console.error('Failed to add comment:', error.message);
    return null;
  }
  return data;
}
