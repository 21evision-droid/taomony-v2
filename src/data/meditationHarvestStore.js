// ── Meditation Harvest Store (Phase 1 Mock) ────────────────
// Stores tier-level Harvest selections (one per completed tier:
// 'subtasks' or 'combinations'). Uses localStorage.
//
// Data shape:
//   { [tier]: [optionId, ...] }
//
// Harvest content (prompt + preset options) is curated later by the
// content team (design §13). This store persists only which options were
// selected. The Harvest flow continues into Reflection (a separate page),
// so there is no submit/Resonance state here.
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

/** Get the selected option ids for a tier (empty array when none). */
export function getHarvest(tier) {
  return read()[tier] || [];
}

/**
 * Toggle a Harvest option id on/off for a tier.
 * Returns the updated option-id array.
 */
export function toggleHarvestOption(tier, optionId) {
  const data = read();
  const current = data[tier] || [];
  const next = current.includes(optionId)
    ? current.filter((id) => id !== optionId)
    : [...current, optionId];
  data[tier] = next;
  write(data);
  return next;
}
