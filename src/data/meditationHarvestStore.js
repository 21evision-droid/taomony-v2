// ── Meditation Harvest Store (Phase 1 Mock) ────────────────
// Stores tier-level Harvest submissions (one per completed tier:
// 'subtasks' or 'combinations') and the optional Resonance-share flag.
// Uses localStorage.
//
// Data shape:
//   { [tier]: { answers: [optionId, ...], resonanceShared: bool, submittedAt: ISO } }
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

/** Get a Harvest submission for a tier, or null. */
export function getHarvest(tier) {
  return read()[tier] || null;
}

/**
 * Toggle a Harvest option id on/off for a tier.
 * Returns the updated answers array.
 */
export function toggleHarvestOption(tier, optionId) {
  const data = read();
  const current = data[tier]?.answers || [];
  const answers = current.includes(optionId)
    ? current.filter((id) => id !== optionId)
    : [...current, optionId];
  data[tier] = {
    answers,
    resonanceShared: data[tier]?.resonanceShared || false,
  };
  write(data);
  return answers;
}

/**
 * Submit the Harvest for a tier, optionally shared to Resonance.
 * Returns the saved submission.
 */
export function submitHarvest(tier, resonanceShared) {
  const data = read();
  const submission = {
    answers: data[tier]?.answers || [],
    resonanceShared,
    submittedAt: new Date().toISOString(),
  };
  data[tier] = submission;
  write(data);
  return submission;
}
