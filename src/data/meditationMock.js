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
