// ── Dev-Only Test Fixtures ──────────────────────────────────
// Test hooks for AI-driven / manual E2E testing of the Meditation module.
//
// These are compiled out of production builds (every consumer gates on
// `import.meta.env.DEV`), and nothing here runs unless a dev-only caller
// invokes it. Purpose: let a tester fast-forward the Meditation module's
// time gates and video timers without waiting out real cycles.
//
// Do NOT import this module from production code paths. Storage keys must
// stay in sync with the stores they manipulate:
//   taomony_meditation_attempts — src/data/meditationStore.js (STORAGE_KEY)
//   taomony_dev_fast_forward    — read inline by MeditationVideoPlayer.jsx

import { MEDITATION_SUBTASKS, MEDITATION_COMBINATIONS } from './meditationMock';

const ATTEMPTS_KEY = 'taomony_meditation_attempts';
const FAST_FORWARD_KEY = 'taomony_dev_fast_forward';

// ── Fast-forward video timer ────────────────────────────────
// Note: read lazily (no module-level localStorage access) so this whole
// module stays side-effect-free and is tree-shaken out of prod builds.

export function isFastForward() {
  try {
    return localStorage.getItem(FAST_FORWARD_KEY) === '1';
  } catch {
    return false;
  }
}

export function setFastForward(enabled) {
  try {
    if (enabled) localStorage.setItem(FAST_FORWARD_KEY, '1');
    else localStorage.removeItem(FAST_FORWARD_KEY);
  } catch {
    // localStorage unavailable — ignore.
  }
}

// ── Cycle unlock (seed completed attempts) ──────────────────

function makeCompletedAttempt() {
  const now = new Date().toISOString();
  return {
    attemptNumber: 1,
    startedAt: now,
    expiresAt: now,
    repeatCount: 3,
    completedReps: 3,
    status: 'completed',
    closedAt: now,
  };
}

function seed({ subtasks, combinations }) {
  const data = { subtask: {}, combination: {} };
  if (subtasks) {
    MEDITATION_SUBTASKS.forEach((s) => {
      data.subtask[s.id] = [makeCompletedAttempt()];
    });
  }
  if (combinations) {
    MEDITATION_COMBINATIONS.forEach((c) => {
      data.combination[c.id] = [makeCompletedAttempt()];
    });
  }
  localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(data));
  return data;
}

/** Complete every sub-task and combination (full unlock). */
export function unlockMeditationAll() {
  return seed({ subtasks: true, combinations: true });
}

/** Complete only sub-tasks — Combinations stay locked (tests the global gate). */
export function unlockMeditationSubtasks() {
  return seed({ subtasks: true, combinations: false });
}

/** Clear all Meditation attempt records — re-locks every unit. */
export function resetMeditation() {
  localStorage.removeItem(ATTEMPTS_KEY);
}
