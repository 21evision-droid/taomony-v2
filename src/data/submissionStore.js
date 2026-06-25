// ── Challenge Submission Store ──────────────────────────────
// Uses Supabase for persistence.
// All functions are async — consumers must handle Promises.

import { supabase } from '../lib/supabase';

async function getCurrentUserId() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.id ?? null;
}

export async function getSubmissions() {
  const userId = await getCurrentUserId();
  if (!userId) return [];
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Failed to load submissions:', error.message);
    return [];
  }
  return data || [];
}

export async function addSubmission(dateStr, score, habits) {
  const userId = await getCurrentUserId();
  if (!userId) return;
  const { error } = await supabase.from('submissions').insert({
    user_id: userId,
    date: dateStr,
    score,
    habits: habits.map((h) => ({ id: h.id, name: h.name, completed: h.completed, points: h.points })),
  });
  if (error) console.error('Failed to add submission:', error.message);
}

export async function hasSubmittedToday() {
  const userId = await getCurrentUserId();
  if (!userId) return false;
  const today = new Date().toDateString();
  const { data } = await supabase
    .from('submissions')
    .select('id')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle();
  return !!data;
}

export async function getTotalScore() {
  const userId = await getCurrentUserId();
  if (!userId) return 0;
  const { data } = await supabase
    .from('submissions')
    .select('score')
    .eq('user_id', userId);
  return (data || []).reduce((sum, r) => sum + Number(r.score), 0);
}

export async function getSubmissionCount() {
  const userId = await getCurrentUserId();
  if (!userId) return 0;
  const { count } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  return count || 0;
}
