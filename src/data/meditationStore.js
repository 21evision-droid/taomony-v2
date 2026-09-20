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
    if (autoExpire(data)) write(data);
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
  let changed = false;
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
          changed = true;
        }
      });
    });
  });
  return changed;
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
  if (!Number.isInteger(repeatCount) || repeatCount <= 0) {
    throw new Error(
      `beginAttempt: invalid repeatCount (${repeatCount}). Expected a positive integer from the unit data.`
    );
  }
  if (!Number.isInteger(windowDays) || windowDays <= 0) {
    throw new Error(
      `beginAttempt: invalid windowDays (${windowDays}). Expected a positive integer from the unit data.`
    );
  }
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
