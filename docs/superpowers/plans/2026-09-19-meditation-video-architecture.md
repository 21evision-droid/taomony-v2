# Meditation Module — Video-Centric Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Meditation micro-task sub-module (sub-tasks + combinations) as a video-centric practice system with preview/practice dual-entry, per-unit N/X cycles, strict linear gating, and a combination-only reflection flow (Tao Echo → Harvest → Resonance).

**Architecture:** Phase 1 mock following the existing codebase pattern — localStorage stores (`meditationStore.js`, `meditationHarvestStore.js`) mirroring `journeyStore.js`/`harvestStore.js`, mock content in `meditationMock.js`, and React Router pages under `/meditate/*`. A shared `MeditationVideoPlayer` implements the preview/practice dual-entry with a duration-based stand-in until real silent-demonstration videos are supplied. A Supabase migration file records the Phase 2 schema (7 tables) without wiring it to the UI.

**Tech Stack:** React 19, Vite 8, Tailwind CSS 4, React Router 7, Lucide React. **No test runner exists** in this repo — verification is `npm run build`, `npm run lint`, and manual `npm run dev` checks.

**Repo root:** `D:\ObsidianNotes\PersonalWiki\Taomony-v2开发\Developertaomony-v2` (all paths below are relative to this root).

**Design authority:** `docs/superpowers/specs/2026-09-19-meditation-video-architecture-design.md` — the approved design this plan implements.

---

## Scope

In scope (design §1): the **Micro-task sub-module** — sub-tasks + combinations, the two-tier practice model, the practice engine (video, cycle, gating), and the combination reflection flow.

Out of scope (deferred, separate plans): Inner Alchemy, Collective Meditation, the meditation module home (top-level 3-sub-module screen), the Learning-style wheel entry + Bagua center video display, Harvest content, and video content. These are explicitly deferred by the design and are **not** tasks in this plan.

## Verification convention (read first)

This repo has **no test runner** (`package.json` scripts are `dev` / `build` / `lint` / `preview` only). Each task is verified with:

- `npm run build` — catches syntax/import errors (vite build).
- `npm run lint` — catches eslint errors (including react-hooks rules) in new files.
- Manual `npm run dev` — browser check described per task.

Run commands from the repo root. Commit after each task.

---

## File Structure

**Create (data):**
- `src/data/meditationMock.js` — 3 dimensions, 9 sub-tasks, 2 combinations + lookup helpers. Phase-1 content; directly convertible to Supabase tables.
- `src/data/meditationStore.js` — append-only attempt records + gating helpers (mirrors `journeyStore.js`).
- `src/data/meditationHarvestStore.js` — per-combination Harvest selections + Resonance-share flag (mirrors `harvestStore.js`).

**Create (components, new dir `src/components/meditation/`):**
- `src/components/meditation/MeditationVideoPlayer.jsx` — modal player, preview/practice mode label, full-playback → `onComplete`.
- `src/components/meditation/HelpModal.jsx` — the 7 execution-rules explanation (§5.2).

**Create (pages):**
- `src/pages/MeditationHome.jsx` — `/meditate` micro-task entry (3 dimension cards + Combinations lock state).
- `src/pages/MeditationDimension.jsx` — `/meditate/dimension/:slug` sub-task list, help button.
- `src/pages/MeditationSubtask.jsx` — `/meditate/subtask/:id` preview + practice + rep progress + Continue.
- `src/pages/MeditationCombinations.jsx` — `/meditate/combinations` list (global lock).
- `src/pages/MeditationCombination.jsx` — `/meditate/combination/:id` preview + practice + Continue to Tao Echo.
- `src/pages/TaoEchoView.jsx` — `/meditate/combination/:id/tao-echo`.
- `src/pages/HarvestView.jsx` — `/meditate/combination/:id/harvest`.

**Create (profile + migration):**
- `src/components/profile/MeditationRecordCard.jsx` — completed micro-task record card.
- `supabase/migrations/20260920000000_create_meditation_tables.sql` — Phase-2 schema (7 tables, not wired to UI).

**Modify:**
- `src/pages/Profile.jsx` — add Meditation section (design §10.1).
- `src/App.jsx` — routes for the 7 new pages.

**Delete (legacy meditation code being replaced):**
- `src/pages/Meditate.jsx`
- `src/components/meditate/` (all 8 files)

---

## Task 1: Meditation mock data

**Files:**
- Create: `src/data/meditationMock.js`

- [ ] **Step 1: Create the mock data file**

Create `src/data/meditationMock.js`:

```js
// ── Meditation Module Mock Data (Phase 1) ──────────────────
// 3 Dimensions (Body removed), sub-tasks per dimension, combinations.
// Structure follows docs/superpowers/specs/2026-09-19-meditation-video-architecture-design.md
// §3, §4, §9. Designed to be directly convertible to Supabase tables:
//   meditation_dimensions / meditation_subtasks / meditation_combinations.
//
// Video content and Harvest options are supplied later by the content team
// (design §13). videoUrl stays null until real silent demonstration videos
// exist; Tao Echo passages are placeholder excerpts to be finalized by the
// content team.

export const MEDITATION_DIMENSIONS = [
  {
    id: 'breathing',
    slug: 'breathing',
    title: 'Breathing',
    description: 'Observe, regulate, and release the breath',
    orderIndex: 1,
  },
  {
    id: 'mind',
    slug: 'mind',
    title: 'Mind',
    description: 'Observe thoughts, practice non-attachment, return to stillness',
    orderIndex: 2,
  },
  {
    id: 'awareness',
    slug: 'awareness',
    title: 'Awareness',
    description: 'Open observation of sensation, sound, space, and being',
    orderIndex: 3,
  },
];

export const MEDITATION_SUBTASKS = [
  // ── Breathing ────────────────────────────────────────────
  {
    id: 'observe-breath',
    dimensionId: 'breathing',
    title: 'Observe Breath',
    description: 'Watch the breath without changing it.',
    videoUrl: null,
    durationSeconds: 180,
    repeatCount: 3,
    windowDays: 5,
    orderIndex: 1,
    isActive: true,
  },
  {
    id: 'regulate-breath',
    dimensionId: 'breathing',
    title: 'Regulate Breath',
    description: 'Gently lengthen and smooth the breath.',
    videoUrl: null,
    durationSeconds: 180,
    repeatCount: 3,
    windowDays: 5,
    orderIndex: 2,
    isActive: true,
  },
  {
    id: 'release-breath',
    dimensionId: 'breathing',
    title: 'Release Breath',
    description: 'Let the out-breath fall away completely.',
    videoUrl: null,
    durationSeconds: 180,
    repeatCount: 3,
    windowDays: 5,
    orderIndex: 3,
    isActive: true,
  },
  // ── Mind ─────────────────────────────────────────────────
  {
    id: 'observe-thoughts',
    dimensionId: 'mind',
    title: 'Observe Thoughts',
    description: 'Watch thoughts arise and pass without following them.',
    videoUrl: null,
    durationSeconds: 240,
    repeatCount: 3,
    windowDays: 7,
    orderIndex: 1,
    isActive: true,
  },
  {
    id: 'non-attachment',
    dimensionId: 'mind',
    title: 'Non-Attachment',
    description: 'Let each thought go without holding it.',
    videoUrl: null,
    durationSeconds: 240,
    repeatCount: 3,
    windowDays: 7,
    orderIndex: 2,
    isActive: true,
  },
  {
    id: 'return-to-stillness',
    dimensionId: 'mind',
    title: 'Return to Stillness',
    description: 'Come back to stillness when the mind wanders.',
    videoUrl: null,
    durationSeconds: 240,
    repeatCount: 3,
    windowDays: 7,
    orderIndex: 3,
    isActive: true,
  },
  // ── Awareness ────────────────────────────────────────────
  {
    id: 'open-sensation',
    dimensionId: 'awareness',
    title: 'Open Sensation',
    description: 'Receive bodily sensation openly.',
    videoUrl: null,
    durationSeconds: 300,
    repeatCount: 3,
    windowDays: 7,
    orderIndex: 1,
    isActive: true,
  },
  {
    id: 'open-sound',
    dimensionId: 'awareness',
    title: 'Open Sound',
    description: 'Receive sound without naming it.',
    videoUrl: null,
    durationSeconds: 300,
    repeatCount: 3,
    windowDays: 7,
    orderIndex: 2,
    isActive: true,
  },
  {
    id: 'open-being',
    dimensionId: 'awareness',
    title: 'Open Being',
    description: 'Rest in open awareness of space and being.',
    videoUrl: null,
    durationSeconds: 300,
    repeatCount: 3,
    windowDays: 7,
    orderIndex: 3,
    isActive: true,
  },
];

export const MEDITATION_COMBINATIONS = [
  {
    id: 'natural-flow',
    title: 'Natural Flow',
    subtitle: 'Natural Breath → Observe Thoughts → Open Awareness',
    description:
      'A continuous practice moving from breath to thought to open awareness.',
    videoUrl: null,
    durationSeconds: 600,
    repeatCount: 3,
    windowDays: 7,
    orderIndex: 1,
    isActive: true,
    taoEcho: {
      passage: 'Empty your mind of all thoughts. Let your heart be at peace.',
      chapter: 16,
      implication:
        'The three stages of this practice — breath, thought, awareness — return the scattered mind to its quiet root.',
    },
  },
  {
    id: 'stillness-flow',
    title: 'Stillness Flow',
    subtitle: 'Return to Stillness → Open Being',
    description: 'A practice settling the mind into still, open presence.',
    videoUrl: null,
    durationSeconds: 480,
    repeatCount: 3,
    windowDays: 7,
    orderIndex: 2,
    isActive: true,
    taoEcho: {
      passage:
        'Do you have the patience to wait until your mud settles and the water is clear?',
      chapter: 15,
      implication:
        'Stillness is not forced; it is what remains when the practice stops stirring the water.',
    },
  },
];

// ── Helpers ────────────────────────────────────────────────

export function getDimensionBySlug(slug) {
  return MEDITATION_DIMENSIONS.find((d) => d.slug === slug);
}

export function getSubtasksForDimension(dimensionId) {
  return MEDITATION_SUBTASKS.filter(
    (s) => s.dimensionId === dimensionId && s.isActive
  ).sort((a, b) => a.orderIndex - b.orderIndex);
}

export function getSubtaskById(id) {
  return MEDITATION_SUBTASKS.find((s) => s.id === id);
}

export function getCombinationById(id) {
  return MEDITATION_COMBINATIONS.find((c) => c.id === id);
}

export function getActiveCombinations() {
  return MEDITATION_COMBINATIONS.filter((c) => c.isActive).sort(
    (a, b) => a.orderIndex - b.orderIndex
  );
}
```

- [ ] **Step 2: Verify the file is syntactically valid**

Run: `npm run lint`
Expected: no errors reported for `src/data/meditationMock.js` (other pre-existing repo errors, if any, are unrelated).

- [ ] **Step 3: Commit**

```bash
git add src/data/meditationMock.js
git commit -m "feat(meditation): add Phase 1 mock data (3 dimensions, sub-tasks, combinations)"
```

---

## Task 2: Meditation attempt store

**Files:**
- Create: `src/data/meditationStore.js`

- [ ] **Step 1: Create the attempt store**

Create `src/data/meditationStore.js`:

```js
// ── Meditation Attempt Store (Phase 1 Mock) ────────────────
// Append-only cycle records for sub-tasks and combinations.
// Uses localStorage for persistence across page refreshes.
//
// The API shape is designed to map directly to Supabase tables:
//   meditation_subtask_attempts      — sub-task cycle records
//   meditation_combination_attempts  — combination cycle records
//
// Phase 2: replace with Supabase queries. Function signatures
// should remain the same for minimal refactoring.

const STORAGE_KEY = 'taomony_meditation_attempts';

export const UNIT_KINDS = ['subtask', 'combination'];

// ── Internal helpers ────────────────────────────────────────

function empty() {
  return { subtask: {}, combination: {} };
}

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : empty();
    if (!data.subtask) data.subtask = {};
    if (!data.combination) data.combination = {};
    autoExpire(data);
    return data;
  } catch {
    return empty();
  }
}

function write(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Auto-expire: an in-progress attempt whose window has passed is gently
// marked 'expired' (never 'failed'). The old record is preserved (design §6.2).
function autoExpire(data) {
  const now = Date.now();
  Object.values(data).forEach((units) => {
    Object.values(units).forEach((attempts) => {
      attempts.forEach((a) => {
        if (
          a.status === 'in_progress' &&
          a.completedReps < a.repeatCount &&
          new Date(a.expiresAt).getTime() < now
        ) {
          a.status = 'expired';
          a.closedAt = new Date().toISOString();
        }
      });
    });
  });
}

function findActiveIndex(attempts) {
  for (let i = attempts.length - 1; i >= 0; i -= 1) {
    if (attempts[i].status === 'in_progress') return i;
  }
  return -1;
}

// ── Public API ──────────────────────────────────────────────

/** All attempts for a unit (append-only history, oldest first). */
export function getAttempts(kind, unitId) {
  const data = read();
  return data[kind]?.[unitId] || [];
}

/** The active (latest in-progress) attempt, or null. */
export function getActiveAttempt(kind, unitId) {
  const attempts = getAttempts(kind, unitId);
  const idx = findActiveIndex(attempts);
  return idx === -1 ? null : attempts[idx];
}

/** The most recent completed attempt, or null. */
export function getCompletedAttempt(kind, unitId) {
  const attempts = getAttempts(kind, unitId);
  for (let i = attempts.length - 1; i >= 0; i -= 1) {
    if (attempts[i].status === 'completed') return attempts[i];
  }
  return null;
}

/** True when the unit has a completed attempt. */
export function isUnitComplete(kind, unitId) {
  return getCompletedAttempt(kind, unitId) !== null;
}

/**
 * Begin a new attempt for a unit. If the unit was attempted before, the new
 * record gets the next attempt number (append-only; the old record is kept).
 * Returns the new in-progress attempt record.
 */
export function beginAttempt(kind, unitId, repeatCount, windowDays) {
  const data = read();
  const unitAttempts = data[kind]?.[unitId] || [];
  const attemptNumber = unitAttempts.length + 1;
  const record = {
    attemptNumber,
    startedAt: new Date().toISOString(),
    expiresAt: new Date(
      Date.now() + windowDays * 24 * 60 * 60 * 1000
    ).toISOString(),
    repeatCount,
    completedReps: 0,
    status: 'in_progress',
    closedAt: null,
  };
  data[kind][unitId] = [...unitAttempts, record];
  write(data);
  return record;
}

/**
 * Record one completed repetition on the active attempt. Full playback in
 * practice mode = 1 repetition. When completedReps reaches repeatCount the
 * attempt is marked completed (early completion — the window is an upper
 * bound, not a minimum; design §6.1).
 * Returns the updated attempt, or null if there is no active attempt.
 */
export function recordRepetition(kind, unitId) {
  const data = read();
  const unitAttempts = data[kind]?.[unitId] || [];
  const idx = findActiveIndex(unitAttempts);
  if (idx === -1) return null;
  const attempt = unitAttempts[idx];
  attempt.completedReps += 1;
  if (attempt.completedReps >= attempt.repeatCount) {
    attempt.status = 'completed';
    attempt.closedAt = new Date().toISOString();
  }
  data[kind][unitId] = [...unitAttempts];
  write(data);
  return attempt;
}

// ── Progression helpers (derived, design §7) ────────────────

/** The first incomplete sub-task in a dimension (linear order), or null. */
export function getNextSubtask(subtasks) {
  return subtasks.find((s) => !isUnitComplete('subtask', s.id)) || null;
}

/** True when every sub-task (across all dimensions) is complete. */
export function allSubtasksComplete(subtasks) {
  return subtasks.every((s) => isUnitComplete('subtask', s.id));
}

/** True when every micro-task (sub-tasks + combinations) is complete. */
export function allMicroTasksComplete(subtasks, combinations) {
  return (
    allSubtasksComplete(subtasks) &&
    combinations.every((c) => isUnitComplete('combination', c.id))
  );
}

/** Completed micro-task records for the Profile section, newest first. */
export function getCompletedRecords() {
  const data = read();
  const records = [];
  Object.entries(data.subtask || {}).forEach(([unitId, attempts]) => {
    const done = [...attempts].reverse().find((a) => a.status === 'completed');
    if (done) records.push({ kind: 'subtask', unitId, record: done });
  });
  Object.entries(data.combination || {}).forEach(([unitId, attempts]) => {
    const done = [...attempts].reverse().find((a) => a.status === 'completed');
    if (done) records.push({ kind: 'combination', unitId, record: done });
  });
  return records.sort(
    (a, b) => new Date(b.record.closedAt) - new Date(a.record.closedAt)
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: no errors in `src/data/meditationStore.js`.

- [ ] **Step 3: Commit**

```bash
git add src/data/meditationStore.js
git commit -m "feat(meditation): add append-only attempt store with gating helpers"
```

---

## Task 3: Meditation Harvest store

**Files:**
- Create: `src/data/meditationHarvestStore.js`

- [ ] **Step 1: Create the Harvest store**

Create `src/data/meditationHarvestStore.js`:

```js
// ── Meditation Harvest Store (Phase 1 Mock) ────────────────
// Stores per-combination Harvest submissions and the optional
// Resonance-share flag. Uses localStorage.
//
// Data shape:
//   { [combinationId]: { [attemptNumber]: {
//       answers: [optionId, ...], resonanceShared: bool, submittedAt: ISO
//   } } }
//
// Harvest content (prompt + preset options) is curated later by the
// content team (design §13). This store persists only which options were
// selected and whether the practice was shared to Resonance.
//
// Phase 2: replace with Supabase table meditation_harvest_submissions.

const STORAGE_KEY = 'taomony_meditation_harvests';

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function write(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** Get a harvest submission for a combination attempt, or null. */
export function getHarvest(combinationId, attemptNumber) {
  return read()[combinationId]?.[attemptNumber] || null;
}

/**
 * Toggle a Harvest option id on/off for a combination attempt.
 * Returns the updated answers array.
 */
export function toggleHarvestOption(combinationId, attemptNumber, optionId) {
  const data = read();
  const attempts = data[combinationId] || {};
  const current = attempts[attemptNumber]?.answers || [];
  const answers = current.includes(optionId)
    ? current.filter((id) => id !== optionId)
    : [...current, optionId];
  attempts[attemptNumber] = {
    answers,
    resonanceShared: attempts[attemptNumber]?.resonanceShared || false,
  };
  data[combinationId] = attempts;
  write(data);
  return answers;
}

/**
 * Submit the Harvest for a combination attempt, optionally shared to Resonance.
 * Returns the saved submission.
 */
export function submitHarvest(combinationId, attemptNumber, resonanceShared) {
  const data = read();
  const attempts = data[combinationId] || {};
  const submission = {
    answers: attempts[attemptNumber]?.answers || [],
    resonanceShared,
    submittedAt: new Date().toISOString(),
  };
  attempts[attemptNumber] = submission;
  data[combinationId] = attempts;
  write(data);
  return submission;
}
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: no errors in `src/data/meditationHarvestStore.js`.

- [ ] **Step 3: Commit**

```bash
git add src/data/meditationHarvestStore.js
git commit -m "feat(meditation): add Harvest store for combination reflection"
```

---

## Task 4: Meditation video player component

**Files:**
- Create: `src/components/meditation/MeditationVideoPlayer.jsx`

- [ ] **Step 1: Create the player component**

Create `src/components/meditation/MeditationVideoPlayer.jsx`:

```jsx
// MeditationVideoPlayer — modal player for preview and practice (design §5.1).
// Dual-entry: preview (free watching, no counting) vs practice (full playback
// = 1 repetition). The mode label is always shown.
//
// Videos are silent action demonstrations. Until real videos are supplied
// (design §13), a duration-based timer stands in for silent playback: reaching
// the end fires onComplete in practice mode. When a real videoUrl is present,
// a native <video> is used and onComplete fires on the 'ended' event.
//
// Props:
//   title           — unit title
//   videoUrl        — string | null (real videos supplied later)
//   durationSeconds — practice duration (video duration = practice duration)
//   mode            — 'preview' | 'practice'
//   repDisplay      — string shown only in practice mode (e.g. 'Rep 1/3')
//   onComplete      — () => void, practice only, fired once at end of playback
//   onClose         — () => void

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

export default function MeditationVideoPlayer({
  title,
  videoUrl,
  durationSeconds,
  mode,
  repDisplay,
  onComplete,
  onClose,
}) {
  const [elapsed, setElapsed] = useState(0);
  const firedRef = useRef(false);

  const isPractice = mode === 'practice';

  // Duration-based stand-in for the silent demonstration video.
  useEffect(() => {
    if (videoUrl || !durationSeconds || durationSeconds <= 0) return;
    const timer = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => clearInterval(timer);
  }, [videoUrl, durationSeconds]);

  // Fire completion exactly once when playback reaches the end in practice mode.
  useEffect(() => {
    if (
      isPractice &&
      !videoUrl &&
      durationSeconds > 0 &&
      elapsed >= durationSeconds &&
      !firedRef.current
    ) {
      firedRef.current = true;
      onComplete?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, isPractice]);

  const handleEnded = () => {
    if (isPractice && !firedRef.current) {
      firedRef.current = true;
      onComplete?.();
    }
  };

  const progress = durationSeconds
    ? Math.min(100, Math.round((elapsed / durationSeconds) * 100))
    : 0;
  const remaining = Math.max(0, durationSeconds - elapsed);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6"
      style={{ animation: 'fadeIn 0.2s ease' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] overflow-hidden rounded-2xl bg-[#2c2416] shadow-2xl"
        style={{ animation: 'scaleIn 0.3s ease' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — mode label always visible (§5.1) */}
        <div className="flex items-center justify-between px-4 py-3.5">
          <span className="text-sm font-semibold text-[#faf6ef]">
            {isPractice ? `Practicing · ${repDisplay}` : 'Preview'}
          </span>
          <button
            onClick={onClose}
            className="flex size-8 cursor-pointer items-center justify-center rounded-full bg-white/20 text-lg font-bold text-white transition-colors hover:bg-white/40 border-none leading-none"
          >
            <X size={16} />
          </button>
        </div>

        {/* Video frame */}
        <div className="relative w-full bg-black pb-[56.25%]">
          {videoUrl ? (
            <video
              src={videoUrl}
              autoPlay
              controls
              onEnded={handleEnded}
              className="absolute inset-0 size-full"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
              <p className="text-[#faf6ef] text-sm">{title}</p>
              <p className="text-[#cbbf9e] text-xs">
                Silent demonstration video — coming soon
              </p>
              <div className="w-full max-w-[260px] h-1.5 rounded-full bg-white/15 overflow-hidden">
                <div
                  className="h-full bg-[#faf6ef] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[#cbbf9e] text-xs">{remaining}s</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: no errors in `src/components/meditation/MeditationVideoPlayer.jsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/meditation/MeditationVideoPlayer.jsx
git commit -m "feat(meditation): add preview/practice video player with mode label"
```

---

## Task 5: Help modal component

**Files:**
- Create: `src/components/meditation/HelpModal.jsx`

- [ ] **Step 1: Create the help modal**

Create `src/components/meditation/HelpModal.jsx`:

```jsx
// HelpModal — execution requirements for first-time users (design §5.2).
// Seven rules in simple language. Opened from the "?" button on the dimension
// sub-task list and the combination list screens.

import { X } from 'lucide-react';

const RULES = [
  {
    title: 'Preview vs Practice',
    text: 'Tapping a video only watches it (no counting). "Start Practice" is the real exercise.',
  },
  {
    title: 'Completion',
    text: 'A practice video counts 1 repetition only when it plays to the end.',
  },
  {
    title: 'Cycle',
    text: 'Each task requires a set number of repetitions within a set number of days.',
  },
  {
    title: 'Early finish',
    text: 'Completing all repetitions ends the task early.',
  },
  {
    title: 'Timeout',
    text: 'If the window passes unfinished, the task is gently marked. Simply start again — the old record is kept.',
  },
  {
    title: 'Order',
    text: 'Tasks are completed one by one. The next unlocks only after the current one is done.',
  },
  {
    title: 'No rewards',
    text: 'Practice is self-discipline training. There are no points or streaks.',
  },
];

export default function HelpModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] max-h-[80vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <h3 className="font-['Playfair_Display'] text-lg text-stone-900">
            How practice works
          </h3>
          <button
            onClick={onClose}
            className="flex size-8 cursor-pointer items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 transition-colors border-none"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4 flex flex-col gap-4">
          {RULES.map((rule) => (
            <div key={rule.title}>
              <p className="text-stone-900 text-sm font-semibold mb-0.5">
                {rule.title}
              </p>
              <p className="text-stone-500 text-sm leading-relaxed">{rule.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: no errors in `src/components/meditation/HelpModal.jsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/meditation/HelpModal.jsx
git commit -m "feat(meditation): add execution-requirements help modal"
```

---

## Task 6: Meditation home page

**Files:**
- Create: `src/pages/MeditationHome.jsx`

- [ ] **Step 1: Create the home page**

Create `src/pages/MeditationHome.jsx`:

```jsx
// MeditationHome — Micro-task sub-module entry (design §10).
// 3 dimension cards + Combinations entry with lock state.
// This is NOT the meditation module home (the top-level screen listing the
// three sub-modules is deferred — design §1).

import { Link, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import {
  MEDITATION_DIMENSIONS,
  MEDITATION_SUBTASKS,
} from '../data/meditationMock';
import { allSubtasksComplete, isUnitComplete } from '../data/meditationStore';

export default function MeditationHome() {
  const navigate = useNavigate();
  const combinationsUnlocked = allSubtasksComplete(MEDITATION_SUBTASKS);
  const totalSubtasks = MEDITATION_SUBTASKS.length;
  const completedSubtasks = MEDITATION_SUBTASKS.filter((s) =>
    isUnitComplete('subtask', s.id)
  ).length;

  return (
    <div className="flex flex-col min-h-full bg-[#f5efe6] px-5 pt-12 pb-6">
      <div className="mb-6 text-center">
        <h1 className="font-['Playfair_Display'] text-2xl text-stone-900 mb-2">
          Meditation
        </h1>
        <p className="text-stone-500 text-sm leading-relaxed">
          Build your practice, one Taoist micro-practice at a time.
        </p>
      </div>

      {/* Dimensions */}
      <div className="flex flex-col gap-3">
        {MEDITATION_DIMENSIONS.map((dim) => {
          const subtasks = MEDITATION_SUBTASKS.filter(
            (s) => s.dimensionId === dim.id
          );
          const done = subtasks.filter((s) =>
            isUnitComplete('subtask', s.id)
          ).length;
          return (
            <button
              key={dim.id}
              onClick={() => navigate(`/meditate/dimension/${dim.slug}`)}
              className="bg-white rounded-xl p-4 text-left border border-stone-100 shadow-sm hover:shadow-md hover:border-stone-200 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-['Playfair_Display'] text-base text-stone-900">
                  {dim.title}
                </h3>
                <span className="text-stone-300 text-xs">
                  {done}/{subtasks.length}
                </span>
              </div>
              <p className="text-stone-500 text-xs leading-relaxed">
                {dim.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Combinations entry */}
      <div className="mt-6">
        {combinationsUnlocked ? (
          <Link
            to="/meditate/combinations"
            className="block bg-stone-900 text-white rounded-xl p-4 text-center hover:bg-stone-800 transition-colors"
          >
            <p className="font-medium text-sm">Combinations</p>
            <p className="text-stone-300 text-xs mt-1">
              Cross-dimension practices — the heart of your training
            </p>
          </Link>
        ) : (
          <div className="bg-white rounded-xl p-4 text-center border border-stone-100">
            <p className="flex items-center justify-center gap-1.5 text-stone-400 text-sm font-medium">
              <Lock size={14} />
              Combinations
            </p>
            <p className="text-stone-400 text-xs mt-1">
              Complete all sub-tasks to unlock ({completedSubtasks}/{totalSubtasks})
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: no errors in `src/pages/MeditationHome.jsx`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/MeditationHome.jsx
git commit -m "feat(meditation): add micro-task entry screen (dimensions + combinations lock)"
```

---

## Task 7: Meditation dimension page

**Files:**
- Create: `src/pages/MeditationDimension.jsx`

- [ ] **Step 1: Create the dimension page**

Create `src/pages/MeditationDimension.jsx`:

```jsx
// MeditationDimension — a dimension's sub-task list in linear order (§10).
// All videos previewable; practice gated to the current advanceable unit.
// A prominent help button ("?") opens the execution-requirements modal (§5.2).

import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Lock, HelpCircle } from 'lucide-react';
import {
  getDimensionBySlug,
  getSubtasksForDimension,
} from '../data/meditationMock';
import { isUnitComplete } from '../data/meditationStore';
import HelpModal from '../components/meditation/HelpModal';

export default function MeditationDimension() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(false);

  const dimension = getDimensionBySlug(slug);

  if (!dimension) {
    return (
      <div className="flex flex-col min-h-full bg-[#f5efe6] px-5 pt-12 pb-6">
        <Link to="/meditate" className="text-stone-400 text-xs hover:text-stone-600 transition-colors">
          &larr; Meditation
        </Link>
        <p className="text-stone-400 text-sm mt-4">Dimension not found.</p>
      </div>
    );
  }

  const subtasks = getSubtasksForDimension(dimension.id);
  const nextSubtask =
    subtasks.find((s) => !isUnitComplete('subtask', s.id)) || null;

  return (
    <div className="flex flex-col min-h-full bg-[#f5efe6] px-5 pt-12 pb-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link to="/meditate" className="text-stone-400 text-xs hover:text-stone-600 transition-colors">
            &larr; Meditation
          </Link>
          <h1 className="font-['Playfair_Display'] text-xl text-stone-900 mt-2">
            {dimension.title}
          </h1>
          <p className="text-stone-500 text-sm mt-1">{dimension.description}</p>
        </div>
        <button
          onClick={() => setShowHelp(true)}
          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white border border-stone-200 text-stone-500 hover:text-stone-900 transition-colors"
          title="How practice works"
        >
          <HelpCircle size={18} />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {subtasks.map((s, i) => {
          const complete = isUnitComplete('subtask', s.id);
          const isCurrent = nextSubtask?.id === s.id;
          return (
            <div
              key={s.id}
              className="bg-white rounded-xl p-4 border border-stone-100 shadow-sm"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-['Playfair_Display'] text-base text-stone-900">
                  {i + 1}. {s.title}
                </h3>
                {complete ? (
                  <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs">
                    Complete
                  </span>
                ) : (
                  <span className="text-stone-300 text-xs">
                    {s.repeatCount} reps / {s.windowDays} days
                  </span>
                )}
              </div>
              <p className="text-stone-500 text-xs leading-relaxed mb-3">
                {s.description}
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/meditate/subtask/${s.id}`)}
                  className="flex-1 py-2.5 rounded-lg border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  Preview
                </button>
                {complete ? (
                  <span className="flex-1 py-2.5 rounded-lg bg-emerald-50 text-emerald-600 text-sm font-medium text-center">
                    Done
                  </span>
                ) : isCurrent ? (
                  <button
                    onClick={() => navigate(`/meditate/subtask/${s.id}`)}
                    className="flex-1 py-2.5 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors cursor-pointer"
                  >
                    Start Practice
                  </button>
                ) : (
                  <span className="flex-1 py-2.5 rounded-lg bg-stone-100 text-stone-400 text-xs text-center flex items-center justify-center gap-1">
                    <Lock size={12} />
                    Complete the previous micro-task to unlock
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: no errors in `src/pages/MeditationDimension.jsx`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/MeditationDimension.jsx
git commit -m "feat(meditation): add dimension sub-task list with help button"
```

---

## Task 8: Meditation sub-task page

**Files:**
- Create: `src/pages/MeditationSubtask.jsx`

- [ ] **Step 1: Create the sub-task page**

Create `src/pages/MeditationSubtask.jsx`:

```jsx
// MeditationSubtask — single-dimension practice unit (§10).
// Preview is always available; practice is gated to the current unit.
// Full playback in practice mode = 1 repetition. On completion, "Continue"
// advances manually (design §7).

import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import {
  getSubtaskById,
  getDimensionBySlug,
  getSubtasksForDimension,
} from '../data/meditationMock';
import {
  beginAttempt,
  recordRepetition,
  getActiveAttempt,
  isUnitComplete,
} from '../data/meditationStore';
import MeditationVideoPlayer from '../components/meditation/MeditationVideoPlayer';

export default function MeditationSubtask() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [playerMode, setPlayerMode] = useState(null); // null | 'preview' | 'practice'

  const subtask = getSubtaskById(id);

  if (!subtask) {
    return (
      <div className="flex flex-col min-h-full bg-[#f5efe6] px-5 pt-12 pb-6">
        <Link to="/meditate" className="text-stone-400 text-xs hover:text-stone-600 transition-colors">
          &larr; Meditation
        </Link>
        <p className="text-stone-400 text-sm mt-4">Sub-task not found.</p>
      </div>
    );
  }

  const dimension = getDimensionBySlug(subtask.dimensionId);
  const subtasksInDim = getSubtasksForDimension(subtask.dimensionId);
  const complete = isUnitComplete('subtask', subtask.id);

  // Gating: this unit is advanceable only if every earlier unit in the
  // dimension is complete.
  const myIndex = subtasksInDim.findIndex((s) => s.id === subtask.id);
  const previousIncomplete = subtasksInDim
    .slice(0, myIndex)
    .some((s) => !isUnitComplete('subtask', s.id));
  const isCurrent = !complete && !previousIncomplete;

  const activeAttempt = getActiveAttempt('subtask', subtask.id);
  const completedReps = complete
    ? subtask.repeatCount
    : activeAttempt?.completedReps || 0;

  const nextInDim = subtasksInDim[myIndex + 1];

  const handleStartPractice = () => {
    if (!activeAttempt) {
      beginAttempt('subtask', subtask.id, subtask.repeatCount, subtask.windowDays);
    }
    setPlayerMode('practice');
  };

  const handleComplete = () => {
    recordRepetition('subtask', subtask.id);
    setPlayerMode(null);
  };

  return (
    <div className="flex flex-col min-h-full bg-[#f5efe6] px-5 pt-12 pb-6">
      <Link
        to={`/meditate/dimension/${subtask.dimensionId}`}
        className="text-stone-400 text-xs hover:text-stone-600 transition-colors"
      >
        &larr; {dimension?.title || 'Dimension'}
      </Link>

      <div className="mt-4 mb-5">
        <h1 className="font-['Playfair_Display'] text-xl text-stone-900 mb-2">
          {subtask.title}
        </h1>
        <p className="text-stone-500 text-sm leading-relaxed">{subtask.description}</p>
        <p className="text-stone-400 text-xs mt-3">
          {subtask.repeatCount} repetitions within {subtask.windowDays} days
        </p>
      </div>

      {/* Video area — tap for preview */}
      <button
        onClick={() => setPlayerMode('preview')}
        className="relative w-full pb-[56.25%] bg-stone-900 rounded-xl overflow-hidden cursor-pointer mb-4"
      >
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex items-center gap-2 text-white/80 text-sm">
            <span className="flex size-12 items-center justify-center rounded-full bg-white/20">
              ▶
            </span>
            Preview
          </span>
        </span>
      </button>

      {/* Rep progress */}
      <div className="bg-white rounded-xl p-4 border border-stone-100 shadow-sm mb-4">
        <p className="text-stone-400 text-xs uppercase tracking-wider mb-2">
          Progress
        </p>
        <p className="text-stone-900 text-sm font-medium">
          {completedReps} / {subtask.repeatCount} repetitions
        </p>
        <div className="mt-2 h-1.5 rounded-full bg-stone-100 overflow-hidden">
          <div
            className="h-full bg-stone-900 transition-all"
            style={{
              width: `${Math.min(100, (completedReps / subtask.repeatCount) * 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Action */}
      {complete ? (
        <div className="flex flex-col gap-2">
          <span className="py-3 rounded-xl bg-emerald-50 text-emerald-600 text-sm font-medium text-center">
            Practice complete
          </span>
          <button
            onClick={() =>
              navigate(
                nextInDim ? `/meditate/subtask/${nextInDim.id}` : '/meditate'
              )
            }
            className="py-3.5 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors cursor-pointer"
          >
            {nextInDim ? `Continue to ${nextInDim.title}` : 'Continue'}
          </button>
        </div>
      ) : isCurrent ? (
        <button
          onClick={handleStartPractice}
          className="py-3.5 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors cursor-pointer"
        >
          Start Practice
        </button>
      ) : (
        <span className="py-3.5 rounded-xl bg-stone-100 text-stone-400 text-sm text-center flex items-center justify-center gap-1.5">
          <Lock size={14} />
          Complete the previous micro-task to unlock
        </span>
      )}

      {playerMode && (
        <MeditationVideoPlayer
          title={subtask.title}
          videoUrl={subtask.videoUrl}
          durationSeconds={subtask.durationSeconds}
          mode={playerMode}
          repDisplay={`${Math.min(completedReps + 1, subtask.repeatCount)}/${subtask.repeatCount}`}
          onComplete={handleComplete}
          onClose={() => setPlayerMode(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: no errors in `src/pages/MeditationSubtask.jsx`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/MeditationSubtask.jsx
git commit -m "feat(meditation): add sub-task practice page with preview/practice gating"
```

---

## Task 9: Meditation combinations list page

**Files:**
- Create: `src/pages/MeditationCombinations.jsx`

- [ ] **Step 1: Create the combinations list page**

Create `src/pages/MeditationCombinations.jsx`:

```jsx
// MeditationCombinations — combination list (design §10).
// Unlocked only when all sub-tasks are complete (single global gate).
// All videos freely previewable; practice gated by the global unlock.

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, HelpCircle } from 'lucide-react';
import {
  MEDITATION_SUBTASKS,
  getActiveCombinations,
} from '../data/meditationMock';
import { allSubtasksComplete, isUnitComplete } from '../data/meditationStore';
import HelpModal from '../components/meditation/HelpModal';

export default function MeditationCombinations() {
  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(false);
  const combinations = getActiveCombinations();
  const unlocked = allSubtasksComplete(MEDITATION_SUBTASKS);

  return (
    <div className="flex flex-col min-h-full bg-[#f5efe6] px-5 pt-12 pb-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link to="/meditate" className="text-stone-400 text-xs hover:text-stone-600 transition-colors">
            &larr; Meditation
          </Link>
          <h1 className="font-['Playfair_Display'] text-xl text-stone-900 mt-2">
            Combinations
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Cross-dimension practices — the heart of your training
          </p>
        </div>
        <button
          onClick={() => setShowHelp(true)}
          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white border border-stone-200 text-stone-500 hover:text-stone-900 transition-colors"
          title="How practice works"
        >
          <HelpCircle size={18} />
        </button>
      </div>

      {!unlocked && (
        <div className="bg-white rounded-xl p-4 border border-stone-100 shadow-sm mb-4 text-center">
          <p className="flex items-center justify-center gap-1.5 text-stone-400 text-sm font-medium">
            <Lock size={14} />
            Complete all sub-tasks to unlock combinations
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {combinations.map((c) => {
          const complete = isUnitComplete('combination', c.id);
          return (
            <div key={c.id} className="bg-white rounded-xl p-4 border border-stone-100 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-['Playfair_Display'] text-base text-stone-900">
                  {c.title}
                </h3>
                {complete ? (
                  <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs">
                    Complete
                  </span>
                ) : (
                  <span className="text-stone-300 text-xs">
                    {c.repeatCount} reps / {c.windowDays} days
                  </span>
                )}
              </div>
              <p className="text-stone-400 text-xs mb-1">{c.subtitle}</p>
              <p className="text-stone-500 text-xs leading-relaxed mb-3">
                {c.description}
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/meditate/combination/${c.id}`)}
                  className="flex-1 py-2.5 rounded-lg border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  Preview
                </button>
                {complete ? (
                  <span className="flex-1 py-2.5 rounded-lg bg-emerald-50 text-emerald-600 text-sm font-medium text-center">
                    Done
                  </span>
                ) : unlocked ? (
                  <button
                    onClick={() => navigate(`/meditate/combination/${c.id}`)}
                    className="flex-1 py-2.5 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors cursor-pointer"
                  >
                    Start Practice
                  </button>
                ) : (
                  <span className="flex-1 py-2.5 rounded-lg bg-stone-100 text-stone-400 text-xs text-center flex items-center justify-center gap-1">
                    <Lock size={12} />
                    Locked
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: no errors in `src/pages/MeditationCombinations.jsx`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/MeditationCombinations.jsx
git commit -m "feat(meditation): add combinations list with global unlock"
```

---

## Task 10: Meditation combination page

**Files:**
- Create: `src/pages/MeditationCombination.jsx`

- [ ] **Step 1: Create the combination page**

Create `src/pages/MeditationCombination.jsx`:

```jsx
// MeditationCombination — cross-dimension practice unit (design §10).
// Unlocked only when all sub-tasks are complete (single global gate).
// On cycle completion the user proceeds to the Tao Echo reflection flow (§8).

import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { getCombinationById, MEDITATION_SUBTASKS } from '../data/meditationMock';
import {
  beginAttempt,
  recordRepetition,
  getActiveAttempt,
  isUnitComplete,
  allSubtasksComplete,
} from '../data/meditationStore';
import MeditationVideoPlayer from '../components/meditation/MeditationVideoPlayer';

export default function MeditationCombination() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [playerMode, setPlayerMode] = useState(null);

  const combination = getCombinationById(id);

  if (!combination) {
    return (
      <div className="flex flex-col min-h-full bg-[#f5efe6] px-5 pt-12 pb-6">
        <Link to="/meditate" className="text-stone-400 text-xs hover:text-stone-600 transition-colors">
          &larr; Meditation
        </Link>
        <p className="text-stone-400 text-sm mt-4">Combination not found.</p>
      </div>
    );
  }

  const unlocked = allSubtasksComplete(MEDITATION_SUBTASKS);
  const complete = isUnitComplete('combination', combination.id);
  const activeAttempt = getActiveAttempt('combination', combination.id);
  const completedReps = complete
    ? combination.repeatCount
    : activeAttempt?.completedReps || 0;

  const handleStartPractice = () => {
    if (!activeAttempt) {
      beginAttempt(
        'combination',
        combination.id,
        combination.repeatCount,
        combination.windowDays
      );
    }
    setPlayerMode('practice');
  };

  const handleComplete = () => {
    recordRepetition('combination', combination.id);
    setPlayerMode(null);
  };

  return (
    <div className="flex flex-col min-h-full bg-[#f5efe6] px-5 pt-12 pb-6">
      <Link
        to="/meditate/combinations"
        className="text-stone-400 text-xs hover:text-stone-600 transition-colors"
      >
        &larr; Combinations
      </Link>

      <div className="mt-4 mb-5">
        <h1 className="font-['Playfair_Display'] text-xl text-stone-900 mb-2">
          {combination.title}
        </h1>
        <p className="text-stone-400 text-xs mb-1">{combination.subtitle}</p>
        <p className="text-stone-500 text-sm leading-relaxed">
          {combination.description}
        </p>
        <p className="text-stone-400 text-xs mt-3">
          {combination.repeatCount} repetitions within {combination.windowDays} days
        </p>
      </div>

      <button
        onClick={() => setPlayerMode('preview')}
        className="relative w-full pb-[56.25%] bg-stone-900 rounded-xl overflow-hidden cursor-pointer mb-4"
      >
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex items-center gap-2 text-white/80 text-sm">
            <span className="flex size-12 items-center justify-center rounded-full bg-white/20">
              ▶
            </span>
            Preview
          </span>
        </span>
      </button>

      <div className="bg-white rounded-xl p-4 border border-stone-100 shadow-sm mb-4">
        <p className="text-stone-400 text-xs uppercase tracking-wider mb-2">
          Progress
        </p>
        <p className="text-stone-900 text-sm font-medium">
          {completedReps} / {combination.repeatCount} repetitions
        </p>
        <div className="mt-2 h-1.5 rounded-full bg-stone-100 overflow-hidden">
          <div
            className="h-full bg-stone-900 transition-all"
            style={{
              width: `${Math.min(100, (completedReps / combination.repeatCount) * 100)}%`,
            }}
          />
        </div>
      </div>

      {complete ? (
        <button
          onClick={() =>
            navigate(`/meditate/combination/${combination.id}/tao-echo`)
          }
          className="py-3.5 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors cursor-pointer"
        >
          Continue to Tao Echo
        </button>
      ) : unlocked ? (
        <button
          onClick={handleStartPractice}
          className="py-3.5 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors cursor-pointer"
        >
          Start Practice
        </button>
      ) : (
        <span className="py-3.5 rounded-xl bg-stone-100 text-stone-400 text-sm text-center flex items-center justify-center gap-1.5">
          <Lock size={14} />
          Complete all sub-tasks to unlock
        </span>
      )}

      {playerMode && (
        <MeditationVideoPlayer
          title={combination.title}
          videoUrl={combination.videoUrl}
          durationSeconds={combination.durationSeconds}
          mode={playerMode}
          repDisplay={`${Math.min(completedReps + 1, combination.repeatCount)}/${combination.repeatCount}`}
          onComplete={handleComplete}
          onClose={() => setPlayerMode(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: no errors in `src/pages/MeditationCombination.jsx`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/MeditationCombination.jsx
git commit -m "feat(meditation): add combination practice page"
```

---

## Task 11: Tao Echo and Harvest pages

**Files:**
- Create: `src/pages/TaoEchoView.jsx`
- Create: `src/pages/HarvestView.jsx`

- [ ] **Step 1: Create the Tao Echo page**

Create `src/pages/TaoEchoView.jsx`:

```jsx
// TaoEchoView — Tao Echo reflection stage (design §8).
// One combination → one Tao Echo: passage + chapter reference + implication.

import { Link, useNavigate, useParams } from 'react-router-dom';
import { getCombinationById } from '../data/meditationMock';

export default function TaoEchoView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const combination = getCombinationById(id);

  if (!combination) {
    return (
      <div className="flex flex-col min-h-full bg-[#f5efe6] px-5 pt-12 pb-6">
        <Link to="/meditate" className="text-stone-400 text-xs hover:text-stone-600 transition-colors">
          &larr; Meditation
        </Link>
        <p className="text-stone-400 text-sm mt-4">Combination not found.</p>
      </div>
    );
  }

  const { taoEcho } = combination;

  return (
    <div className="flex flex-col min-h-full bg-[#f5efe6] px-5 pt-12 pb-6">
      <Link
        to={`/meditate/combination/${combination.id}`}
        className="text-stone-400 text-xs hover:text-stone-600 transition-colors"
      >
        &larr; {combination.title}
      </Link>

      <div className="mt-4 mb-6">
        <p className="text-stone-400 text-xs uppercase tracking-wider mb-2">
          Tao Echo
        </p>
        <h1 className="font-['Playfair_Display'] text-xl text-stone-900 mb-2">
          {combination.title}
        </h1>
      </div>

      <div className="bg-white rounded-xl p-5 border border-stone-100 shadow-sm mb-6">
        <p className="font-['Playfair_Display'] text-lg text-stone-800 leading-relaxed mb-3">
          &ldquo;{taoEcho.passage}&rdquo;
        </p>
        <p className="text-stone-400 text-xs mb-4">
          Tao Te Ching · Chapter {taoEcho.chapter}
        </p>
        <div className="border-t border-stone-100 pt-4">
          <p className="text-stone-400 text-xs uppercase tracking-wider mb-2">
            Implication
          </p>
          <p className="text-stone-600 text-sm leading-relaxed">
            {taoEcho.implication}
          </p>
        </div>
      </div>

      <button
        onClick={() => navigate(`/meditate/combination/${combination.id}/harvest`)}
        className="py-3.5 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors cursor-pointer"
      >
        Continue to Harvest
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create the Harvest page**

Create `src/pages/HarvestView.jsx`:

```jsx
// HarvestView — Harvest reflection stage (design §8).
// "What actually changed?" — structured, preset options. Content is curated
// later by the content team (design §13); this view renders the framework
// (prompt + options + optional Resonance share) and shows a "being curated"
// placeholder when no options exist yet.

import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Wheat } from 'lucide-react';
import { getCombinationById } from '../data/meditationMock';
import { getCompletedAttempt } from '../data/meditationStore';
import {
  getHarvest,
  toggleHarvestOption,
  submitHarvest,
} from '../data/meditationHarvestStore';

export default function HarvestView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const combination = getCombinationById(id);

  // Harvest options are supplied later (design §13). The framework stores
  // selections keyed by attempt; until options exist, none are rendered.
  const options = combination?.harvestOptions || [];
  const attempt = getCompletedAttempt('combination', id);

  const [selected, setSelected] = useState(
    attempt ? getHarvest(id, attempt.attemptNumber)?.answers || [] : []
  );
  const [shared, setShared] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!combination) {
    return (
      <div className="flex flex-col min-h-full bg-[#f5efe6] px-5 pt-12 pb-6">
        <Link to="/meditate" className="text-stone-400 text-xs hover:text-stone-600 transition-colors">
          &larr; Meditation
        </Link>
        <p className="text-stone-400 text-sm mt-4">Combination not found.</p>
      </div>
    );
  }

  const handleSubmit = () => {
    if (attempt) {
      submitHarvest(id, attempt.attemptNumber, shared);
    }
    setSubmitted(true);
  };

  return (
    <div className="flex flex-col min-h-full bg-[#f5efe6] px-5 pt-12 pb-6">
      <Link
        to={`/meditate/combination/${combination.id}/tao-echo`}
        className="text-stone-400 text-xs hover:text-stone-600 transition-colors"
      >
        &larr; Tao Echo
      </Link>

      <div className="mt-4 mb-6">
        <p className="text-stone-400 text-xs uppercase tracking-wider mb-2">
          Harvest
        </p>
        <h1 className="font-['Playfair_Display'] text-xl text-stone-900 mb-2">
          What actually changed?
        </h1>
      </div>

      {options.length === 0 ? (
        <div className="bg-white rounded-xl p-5 border border-stone-100 shadow-sm mb-6">
          <p className="flex items-center gap-1.5 text-stone-400 text-xs uppercase tracking-wider mb-3">
            <Wheat className="size-4" />
            Harvest
          </p>
          <p className="text-stone-400 text-sm leading-relaxed">
            Harvest options for this combination are being curated.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 mb-6 overflow-hidden">
          {options.map((opt) => {
            const isSelected = selected.includes(opt.id);
            return (
              <label
                key={opt.id}
                className="flex items-start gap-3 px-4 py-3 border-b border-stone-100 last:border-b-0 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() =>
                    attempt &&
                    setSelected(
                      toggleHarvestOption(id, attempt.attemptNumber, opt.id)
                    )
                  }
                  className="mt-0.5 size-4 accent-stone-900"
                />
                <span className="text-sm text-stone-700 leading-relaxed">
                  {opt.text}
                </span>
              </label>
            );
          })}
        </div>
      )}

      {/* Optional share to Resonance */}
      <label className="flex items-center gap-3 bg-white rounded-xl p-4 border border-stone-100 shadow-sm mb-6 cursor-pointer">
        <input
          type="checkbox"
          checked={shared}
          onChange={(e) => setShared(e.target.checked)}
          className="size-4 accent-stone-900"
        />
        <span className="text-sm text-stone-700">
          Share this practice to Resonance
        </span>
      </label>

      {submitted ? (
        <div className="text-center">
          <p className="text-emerald-600 text-sm font-medium mb-4">
            Harvest recorded.
          </p>
          <button
            onClick={() => navigate('/meditate/combinations')}
            className="py-3.5 w-full rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Back to Combinations
          </button>
        </div>
      ) : (
        <button
          onClick={handleSubmit}
          className="py-3.5 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors cursor-pointer"
        >
          Complete Harvest
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npm run lint`
Expected: no errors in `src/pages/TaoEchoView.jsx` or `src/pages/HarvestView.jsx`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/TaoEchoView.jsx src/pages/HarvestView.jsx
git commit -m "feat(meditation): add Tao Echo and Harvest reflection pages"
```

---

## Task 12: Profile record

**Files:**
- Create: `src/components/profile/MeditationRecordCard.jsx`
- Modify: `src/pages/Profile.jsx` (add the Meditation section)

- [ ] **Step 1: Create the record card**

Create `src/components/profile/MeditationRecordCard.jsx`:

```jsx
// MeditationRecordCard — a completed micro-task record in the Profile's
// Meditation section (design §10.1). Mirrors Learning's Tao Archive card.

import { Link } from 'react-router-dom';
import {
  MEDITATION_DIMENSIONS,
  MEDITATION_SUBTASKS,
  MEDITATION_COMBINATIONS,
} from '../../data/meditationMock';
import { getHarvest } from '../../data/meditationHarvestStore';

function MeditationRecordCard({ kind, unitId, record }) {
  const subtask =
    kind === 'subtask'
      ? MEDITATION_SUBTASKS.find((s) => s.id === unitId)
      : null;
  const combination =
    kind === 'combination'
      ? MEDITATION_COMBINATIONS.find((c) => c.id === unitId)
      : null;
  const unit = subtask || combination;
  const dimension = subtask
    ? MEDITATION_DIMENSIONS.find((d) => d.id === subtask.dimensionId)
    : null;
  const harvest = combination
    ? Boolean(getHarvest(unitId, record.attemptNumber))
    : false;

  const fmt = (iso) =>
    new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  return (
    <div className="bg-white rounded-xl p-4 border border-stone-100 shadow-sm">
      <h3 className="font-['Playfair_Display'] text-sm text-stone-900 mb-1">
        {unit?.title || 'Unknown practice'}
      </h3>
      <p className="text-stone-400 text-xs mb-2">
        {subtask ? `Sub-task · ${dimension?.title || ''}` : 'Combination'}
      </p>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
          Complete
        </span>
        <span className="text-stone-300">{fmt(record.closedAt)}</span>
        {harvest && (
          <Link
            to={`/meditate/combination/${unitId}/harvest`}
            className="ml-auto text-stone-500 underline hover:text-stone-900 transition-colors"
          >
            View Harvest
          </Link>
        )}
      </div>
    </div>
  );
}

export default MeditationRecordCard;
```

- [ ] **Step 2: Add the Meditation section to Profile.jsx**

In `src/pages/Profile.jsx`, add the import lines at the top (after the existing imports) and the section before the closing `</div>` of the signed-in return.

**Edit 1 — imports** (add after `import CommentActivity ...`):

```jsx
import CommentActivity from '../components/profile/CommentActivity';
import MeditationRecordCard from '../components/profile/MeditationRecordCard';
import { getCompletedRecords } from '../data/meditationStore';
```

**Edit 2 — read records** (add `const meditationRecords = getCompletedRecords();` right before the final `return (` of the signed-in branch):

```jsx
  const meditationRecords = getCompletedRecords();

  return (
```

**Edit 3 — render the section** (replace the closing block of the signed-in return):

From:

```jsx
        <ProfileHeader />
        <ProfileStats />
        <RankingTimeline />
        <CommentActivity />
      </div>
    </div>
  );
```

To:

```jsx
        <ProfileHeader />
        <ProfileStats />
        <RankingTimeline />
        <CommentActivity />

        {/* Meditation — completed micro-tasks (design §10.1) */}
        <div className="mt-8 pt-6 border-t border-stone-200">
          <p className="text-stone-400 text-xs uppercase tracking-wider mb-3">
            Meditation
          </p>
          {meditationRecords.length > 0 ? (
            <div className="flex flex-col gap-3">
              {meditationRecords.map(({ kind, unitId, record }) => (
                <MeditationRecordCard
                  key={`${kind}-${unitId}`}
                  kind={kind}
                  unitId={unitId}
                  record={record}
                />
              ))}
            </div>
          ) : (
            <p className="text-stone-400 text-sm">
              No completed meditations yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
```

- [ ] **Step 3: Verify**

Run: `npm run lint`
Expected: no errors in `src/components/profile/MeditationRecordCard.jsx` or `src/pages/Profile.jsx`.

- [ ] **Step 4: Commit**

```bash
git add src/components/profile/MeditationRecordCard.jsx src/pages/Profile.jsx
git commit -m "feat(meditation): record completed micro-tasks in Profile"
```

---

## Task 13: Routes and removal of legacy meditation code

**Files:**
- Modify: `src/App.jsx`
- Delete: `src/pages/Meditate.jsx`
- Delete: `src/components/meditate/` (8 files: `CommentsSection.jsx`, `CourseLibrary.jsx`, `MeditateHub.jsx`, `MemberPracticesPortal.jsx`, `MemberPracticesView.jsx`, `StageTabs.jsx`, `VideoPlayerModal.jsx`, `useMemberPractices.js`)

- [ ] **Step 1: Update App.jsx imports**

In `src/App.jsx`, replace the line:

```jsx
import Meditate from './pages/Meditate';
```

with:

```jsx
import MeditationHome from './pages/MeditationHome';
import MeditationDimension from './pages/MeditationDimension';
import MeditationSubtask from './pages/MeditationSubtask';
import MeditationCombinations from './pages/MeditationCombinations';
import MeditationCombination from './pages/MeditationCombination';
import TaoEchoView from './pages/TaoEchoView';
import HarvestView from './pages/HarvestView';
```

- [ ] **Step 2: Update the routes**

In `src/App.jsx`, replace the single line:

```jsx
            <Route path="meditate" element={<Meditate />} />
```

with:

```jsx
            <Route path="meditate" element={<MeditationHome />} />
            <Route path="meditate/dimension/:slug" element={<MeditationDimension />} />
            <Route path="meditate/subtask/:id" element={<MeditationSubtask />} />
            <Route path="meditate/combinations" element={<MeditationCombinations />} />
            <Route path="meditate/combination/:id/tao-echo" element={<TaoEchoView />} />
            <Route path="meditate/combination/:id/harvest" element={<HarvestView />} />
            <Route path="meditate/combination/:id" element={<MeditationCombination />} />
```

Note: `tao-echo` and `harvest` are listed before `combination/:id` (static suffixes before the dynamic segment, matching the Learning routes convention in this file).

- [ ] **Step 3: Delete legacy files**

Run:

```bash
git rm src/pages/Meditate.jsx
git rm src/components/meditate/CommentsSection.jsx src/components/meditate/CourseLibrary.jsx src/components/meditate/MeditateHub.jsx src/components/meditate/MemberPracticesPortal.jsx src/components/meditate/MemberPracticesView.jsx src/components/meditate/StageTabs.jsx src/components/meditate/VideoPlayerModal.jsx src/components/meditate/useMemberPractices.js
```

Expected: files staged for deletion. (The `git rm` of the last file also removes the now-empty directory.)

- [ ] **Step 4: Verify the full build**

Run: `npm run build`
Expected: build succeeds with no errors. If any import of the deleted files remains, the build fails — fix the offending import before proceeding.

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "feat(meditation): wire meditation routes and remove legacy meditate code"
```

---

## Task 14: Supabase migration (Phase 2 schema)

**Files:**
- Create: `supabase/migrations/20260920000000_create_meditation_tables.sql`

- [ ] **Step 1: Create the migration file**

Create `supabase/migrations/20260920000000_create_meditation_tables.sql`:

```sql
-- ─────────────────────────────────────────────────────────────
-- Migration: Meditation module (video-centric architecture)
-- Sub-tasks + combinations, append-only attempts, harvest.
-- See docs/superpowers/specs/2026-09-19-meditation-video-architecture-design.md §9
-- Phase 2 schema — not yet wired to the UI (Phase 1 uses localStorage mocks).
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.meditation_dimensions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  title       text NOT NULL,
  description text,
  order_index integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.meditation_subtasks (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dimension_id     uuid NOT NULL REFERENCES public.meditation_dimensions(id) ON DELETE CASCADE,
  title            text NOT NULL,
  description      text,
  video_url        text,
  duration_seconds integer NOT NULL,
  repeat_count     integer NOT NULL,
  window_days      integer NOT NULL,
  order_index      integer NOT NULL DEFAULT 0,
  is_active        boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.meditation_combinations (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title                text NOT NULL,
  description          text,
  video_url            text,
  duration_seconds     integer NOT NULL,
  repeat_count         integer NOT NULL,
  window_days          integer NOT NULL,
  order_index          integer NOT NULL DEFAULT 0,
  is_active            boolean NOT NULL DEFAULT true,
  tao_echo_passage     text,
  tao_echo_chapter     integer,
  tao_echo_implication text
);

CREATE TABLE IF NOT EXISTS public.meditation_subtask_attempts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subtask_id     uuid NOT NULL REFERENCES public.meditation_subtasks(id) ON DELETE CASCADE,
  attempt_number integer NOT NULL,
  completed_reps integer NOT NULL DEFAULT 0,
  status         text NOT NULL CHECK (status IN ('in_progress', 'completed', 'expired')),
  started_at     timestamptz NOT NULL DEFAULT now(),
  closed_at      timestamptz
);

CREATE TABLE IF NOT EXISTS public.meditation_combination_attempts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  combination_id uuid NOT NULL REFERENCES public.meditation_combinations(id) ON DELETE CASCADE,
  attempt_number integer NOT NULL,
  completed_reps integer NOT NULL DEFAULT 0,
  status         text NOT NULL CHECK (status IN ('in_progress', 'completed', 'expired')),
  started_at     timestamptz NOT NULL DEFAULT now(),
  closed_at      timestamptz
);

CREATE TABLE IF NOT EXISTS public.meditation_harvest_config (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  combination_id uuid NOT NULL REFERENCES public.meditation_combinations(id) ON DELETE CASCADE,
  question_key   text NOT NULL,
  question_text  text NOT NULL,
  options        jsonb NOT NULL DEFAULT '[]'::jsonb,
  interpretation text,
  recommendation text
);

CREATE TABLE IF NOT EXISTS public.meditation_harvest_submissions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  combination_id   uuid NOT NULL REFERENCES public.meditation_combinations(id) ON DELETE CASCADE,
  attempt_id       uuid REFERENCES public.meditation_combination_attempts(id) ON DELETE SET NULL,
  answers          jsonb NOT NULL DEFAULT '[]'::jsonb,
  resonance_shared boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_meditation_subtasks_dimension
  ON meditation_subtasks (dimension_id, order_index);
CREATE INDEX IF NOT EXISTS idx_meditation_subtask_attempts_user
  ON meditation_subtask_attempts (user_id, subtask_id);
CREATE INDEX IF NOT EXISTS idx_meditation_combination_attempts_user
  ON meditation_combination_attempts (user_id, combination_id);
CREATE INDEX IF NOT EXISTS idx_meditation_harvest_submissions_user
  ON meditation_harvest_submissions (user_id, combination_id);

-- ── Row Level Security ─────────────────────────────────────

ALTER TABLE public.meditation_dimensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meditation_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meditation_combinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meditation_subtask_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meditation_combination_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meditation_harvest_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meditation_harvest_submissions ENABLE ROW LEVEL SECURITY;

-- Content tables: anyone can read
DROP POLICY IF EXISTS "Anyone can read meditation dimensions" ON public.meditation_dimensions;
CREATE POLICY "Anyone can read meditation dimensions" ON public.meditation_dimensions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can read meditation subtasks" ON public.meditation_subtasks;
CREATE POLICY "Anyone can read meditation subtasks" ON public.meditation_subtasks
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can read meditation combinations" ON public.meditation_combinations;
CREATE POLICY "Anyone can read meditation combinations" ON public.meditation_combinations
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can read meditation harvest config" ON public.meditation_harvest_config;
CREATE POLICY "Anyone can read meditation harvest config" ON public.meditation_harvest_config
  FOR SELECT USING (true);

-- Attempt tables: users manage their own rows
DROP POLICY IF EXISTS "Users can read own subtask attempts" ON public.meditation_subtask_attempts;
CREATE POLICY "Users can read own subtask attempts" ON public.meditation_subtask_attempts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subtask attempts" ON public.meditation_subtask_attempts;
CREATE POLICY "Users can insert own subtask attempts" ON public.meditation_subtask_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own subtask attempts" ON public.meditation_subtask_attempts;
CREATE POLICY "Users can update own subtask attempts" ON public.meditation_subtask_attempts
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own combination attempts" ON public.meditation_combination_attempts;
CREATE POLICY "Users can read own combination attempts" ON public.meditation_combination_attempts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own combination attempts" ON public.meditation_combination_attempts;
CREATE POLICY "Users can insert own combination attempts" ON public.meditation_combination_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own combination attempts" ON public.meditation_combination_attempts;
CREATE POLICY "Users can update own combination attempts" ON public.meditation_combination_attempts
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own harvest submissions" ON public.meditation_harvest_submissions;
CREATE POLICY "Users can read own harvest submissions" ON public.meditation_harvest_submissions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own harvest submissions" ON public.meditation_harvest_submissions;
CREATE POLICY "Users can insert own harvest submissions" ON public.meditation_harvest_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

- [ ] **Step 2: Verify**

Run: `git status`
Expected: the new migration file is listed as untracked. (The migration is not applied to a live Supabase instance in this plan — it records the Phase 2 schema contract.)

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260920000000_create_meditation_tables.sql
git commit -m "feat(meditation): add Supabase schema for meditation module"
```

---

## Final verification

- [ ] **Step 1: Full build + lint**

Run: `npm run build && npm run lint`
Expected: build succeeds; lint reports no errors in any file created or modified by this plan.

- [ ] **Step 2: Manual browser check**

Run: `npm run dev`, open the local URL, and walk the golden path:

1. `/meditate` → 3 dimension cards + locked Combinations (shows `0/9`).
2. Enter Breathing → 3 sub-tasks; "Observe Breath" shows Start Practice, the other two show the lock message. The "?" button opens the help modal.
3. Tap Preview on a locked sub-task → player opens with the "Preview" label; closing leaves progress unchanged.
4. Start Practice on "Observe Breath" → player label reads `Practicing · Rep 1/3`; wait for the countdown → progress becomes `1/3`.
5. Repeat to 3 reps → "Practice complete" + Continue; Continue advances to "Regulate Breath".
6. Complete all 9 sub-tasks → `/meditate` Combinations entry unlocks.
7. Practice a combination to completion → "Continue to Tao Echo" → passage + chapter + implication → "Continue to Harvest" → "being curated" placeholder + share checkbox → "Complete Harvest" → confirmation.
8. `/profile` (signed in) → Meditation section lists completed units.

Expected: every step matches the description; no console errors.

---

## Self-review notes (already applied inline)

- **Spec coverage:** §3 (3 dims), §4 (two-tier), §5.1 (preview/practice + mode label), §5.2 (help modal), §6 (N/X cycle, early finish, timeout via auto-expire, interruption via player remount, no rewards), §7 (linear sub-task gating, global combination gate, manual Continue, monotonic unlock), §8 (Tao Echo → Harvest → Resonance, no Insight), §9 (7-table migration), §10 (7 routes), §10.1 (Profile record) are all implemented. Deferred items (§1 sub-module home, §10.2 wheel/Bagua, Inner Alchemy, Collective Meditation, Harvest/video content) are intentionally absent.
- **Placeholder scan:** no TBD/TODO; the only "coming soon" strings are the intentional UI placeholders for not-yet-supplied video and Harvest content, which the design (§13) explicitly defers.
- **Type consistency:** store functions `beginAttempt(kind, unitId, repeatCount, windowDays)`, `recordRepetition(kind, unitId)`, `isUnitComplete(kind, unitId)`, `getActiveAttempt(kind, unitId)`, `getCompletedAttempt(kind, unitId)`, `getCompletedRecords()` are used with matching names/signatures across pages. Mock-data helpers (`getDimensionBySlug`, `getSubtasksForDimension`, `getSubtaskById`, `getCombinationById`, `getActiveCombinations`) match their definitions in Task 1.
