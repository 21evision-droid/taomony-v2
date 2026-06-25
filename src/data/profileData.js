// ── Mock Profile Data ───────────────────────────────────────
// In production, this data comes from Supabase profiles table
// and various analytics tables.

export const PROFILE_STATS = {
  totalScore: 1140,       // Cumulative challenge score
  longestStreak: 12,       // Days
  completionRate: 78,      // Percentage
};

export const MEMBER_SINCE = 'December 2025';

export const MODULE_TABS = [
  { id: 'all',       label: 'All' },
  { id: 'challenge-discussion', label: 'Challenge' },
  { id: 'wisdom-library',       label: 'Wisdom Library' },
  { id: 'practitioner-journey', label: 'Practitioner Journey' },
  { id: 'meditation-guide',     label: 'Meditate' },
  { id: 'sleep-stories',        label: 'Sleep' },
];

export const SUBMODULE_META = {
  'challenge-discussion':  { label: 'Challenge',     color: '#d97706', bg: 'bg-amber-100' },
  'wisdom-library':        { label: 'Wisdom Library', color: '#10b981', bg: 'bg-emerald-100' },
  'practitioner-journey':  { label: 'Practitioner',   color: '#b8860b', bg: 'bg-yellow-100' },
  'meditation-guide':      { label: 'Meditate',       color: '#8b5cf6', bg: 'bg-purple-100' },
  'sleep-stories':         { label: 'Sleep',          color: '#6366f1', bg: 'bg-indigo-100' },
};
