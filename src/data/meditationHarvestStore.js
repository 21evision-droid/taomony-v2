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
