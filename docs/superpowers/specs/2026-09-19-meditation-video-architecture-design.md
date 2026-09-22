# Meditation Module — Video-Centric Architecture Design

> **Date:** 2026-09-19 (updated 2026-09-22)
> **Status:** Approved — updated for replay / Tao Echo on cards / tier-level Harvest
> **Scope:** Individual Practice (sub-tasks + combinations)
> **Supersedes:** portions of `MEDITATION_MODULE_SPEC.md` that describe the 15-day-cycle / combination-as-session model (see §12)

---

## 1. Scope

The Meditation module contains **three sub-modules**:

1. **Micro-task sub-module** — single-dimension sub-tasks + cross-dimension combinations. *This design.*
2. **Inner Alchemy sub-module** (小周天, 太乙金华宗旨, etc.) — deferred.
3. **Virtual Synchronous / Collective Meditation sub-module** — deferred (a separate dedicated zone).

**In scope:** the Micro-task sub-module — a two-tier system of **Sub-tasks** and **Combinations**, rebuilt around silent demonstration videos.

**Out of scope (deferred, no design here):**

- **Inner Alchemy** — unlocked only after *all* micro-tasks are complete. Deferred to a later design.
- **Collective Meditation** (virtual synchronous) — a separate dedicated zone inside the Meditation module. Deferred.
- **Meditation module home** (the top-level screen listing the three sub-modules) — deferred; this design covers only the Micro-task sub-module's own entry.

---

## 2. Product Philosophy (unchanged)

- Meditation is where Tao is **experienced**, not explained.
- Not a guided-meditation content library ("Taoist Headspace").
- Not a habit tracker / productivity system (no streaks, points, check-ins).
- **"Build your practice, one Taoist micro-practice at a time."**
- **"Meditation is not something you listen to. It is something you practice."**

---

## 3. Taxonomy — 3 Dimensions

| Dimension | Domain |
|---|---|
| **Breathing** | Observe / regulate / release the breath |
| **Mind** | Observe thoughts, non-attachment, return to stillness |
| **Awareness** | Open observation of sensation, sound, space, being |

- **Body is removed.** The four-dimension taxonomy is reduced to three: Breathing, Mind, Awareness.
- Body-type sub-tasks (Relax Shoulders, Rooting, physical stillness) are dropped, not reassigned.
- Stillness remains a *state*, not a dimension.

---

## 4. Two-Tier Practice Model

```
Sub-task (single-dimension, basic)
        ↓ complete all sub-tasks (global gate)
Combination (cross-dimension, important)
        ↓ complete all micro-tasks
Inner Alchemy (deferred)
```

- **Sub-task** — a single-dimension practice unit (e.g., "Observe Breath" in Breathing). The basic building block. Carries its own video and its own cycle.
- **Combination** — a cross-dimension practice unit (e.g., "Natural Breath → Observe Thoughts → Open Awareness"). It has its **own integrated video**, not a concatenation of sub-task videos. This is the *most important* part of training.
- Both layers carry their own practice cycle (§6). Sub-tasks must be completed first (basic → important).

---

## 5. Video & Practice Mechanics

- Every sub-task and every combination is delivered as a **short video**.
- Videos are **silent action demonstrations** — no narration, no guided-meditation voiceover. A demonstration shows the person's action only; guidance is not the content.
- **Video duration = practice duration.**
- **Completion = full playback in practice mode.** One repetition counts when the practice video plays through to its end; skipping ahead does not count a repetition until the end is reached.

### 5.1 Preview vs Practice (dual-entry)

Watching and practicing are two separate actions, plus a third — free replay of a completed unit:

| | Preview (free browsing) | Practice (executing) | Free practice (replay) |
|---|---|---|---|
| Access | Any video, any time — tap a thumbnail | "Start Practice" button on the currently advanceable unit | "Practice again" on a completed unit |
| Player label | "Preview" | "Practicing · Rep N/M" | "Free practice" |
| Counting | Does not count toward the cycle | Full playback counts as 1 repetition | Does not count; no record change |
| Gating | None | Locked by progression rules (§7) | Only after the unit's cycle is complete |

- All videos (sub-tasks and combinations) are freely previewable in full, even while locked.
- **Free practice (replay):** after a unit's cycle completes, the user may replay it freely. Before replaying, the user is told they must complete all [tier] practices to advance (all sub-tasks to unlock Combinations; all combinations to unlock Inner Alchemy).
- The player always shows the current mode label, so the user always knows which state they are in.

### 5.2 Entry Instructions (first-time help)

When the user taps **Enter / Start** on a dimension, they land on that dimension's sub-task list. Because the execution rules are numerous and could confuse a first-time user, a **prominent help button** (e.g., a "?" icon in the screen header) is placed on this screen.

Tapping it opens an explanation of the execution requirements — presented as a **modal** (mobile-first; a collapsible accordion is an acceptable alternative). The explanation covers, in simple language:

1. **Preview vs Practice** — tapping a thumbnail only watches (no counting); "Start Practice" is the real exercise.
2. **Completion** — a practice video counts 1 repetition only when it plays to the end.
3. **Cycle** — each task requires N repetitions within X days.
4. **Early finish** — completing all N repetitions ends the task early.
5. **Timeout** — if the window passes unfinished, the task is gently marked; simply start again (the old record is kept).
6. **Order** — tasks are completed one by one; the next unlocks only after the current one is done.
7. **No rewards** — practice is self-discipline training; there are no points or streaks.

The same help is available on the combination screens (the rules are identical).

---

## 6. Cycle Mechanics

Each sub-task and each combination has its own **Practice Cycle**, defined by two platform-set parameters:

- **N** = required repetitions
- **X** = time window in days (e.g., "3 repetitions within 5 days")

Both N and X are set by the platform per unit, based on complexity. There is no fixed 15-day window.

### 6.1 Early completion

Completing all N repetitions ends the cycle **early** — X is an upper bound, not a minimum. (E.g., 3 reps in 3 days ends a "3 reps / 5 days" cycle.)

### 6.2 Timeout (window expired, N not reached)

- The cycle closes with a **gentle mark** (no failure language).
- The "continue" to the next unit **stays locked** — the user must reopen this unit and reach N reps to advance (strict gating preserved).
- **Reopen = a new record.** The old attempt is preserved, never overwritten.

### 6.3 Interruption (quit mid-repetition)

- The in-progress repetition is discarded; the user **restarts that repetition** on return.
- Already-completed repetitions are preserved.
- No second-level playback position is stored — only `completed_reps` + an in-progress flag.

### 6.4 No rewards

No streaks, points, badges, or completion pressure of any kind. Practice is self-discipline training.

---

## 7. Progression & Gating

- **Strict linear gating** within a sequence; advancement is **manual**.
- After a unit's cycle completes, its **"Continue" button becomes active**; the user taps it to advance.
- **Sub-tasks:** linear order within a dimension. The next sub-task's *practice* is locked until the previous sub-task is complete.
- **Combinations:** unlocked only when **all sub-tasks (across all dimensions) are complete** — a single global gate, not per-combination prerequisites.
- **Inner Alchemy:** unlocked only when **all micro-tasks** (sub-tasks + combinations) are complete. Deferred.
- Unlocking is **monotonic**: once a unit is complete it never re-locks.

---

## 8. Reflection Flow (tier-level Harvest)

Tao Echo is **platform content displayed below the micro-task list** — below a dimension's sub-task cards and below each combination card, labeled "Tao Echo" (one echo per dimension/combination, content differing per echo). It is not user-filled, not shown on the first-level navigation (home), and not a separate page/view.

Harvest is earned **once per completed tier**, not per unit:

```
Sub-tasks tier   → complete all sub-tasks    → one Harvest → (optional) Share to Resonance
Combinations tier → complete all combinations → one Harvest → (optional) Share to Resonance
```

- **Harvest** — "What actually changed?" Structured, preset, practice-specific options (content supplied later by the content team — framework only, no invented content).
- **Share to Resonance** — optional. The Resonance entry is auto-constructed from module + practice + duration/cycle + Harvest.

**Insight is removed** from the Meditation flow:

- There is no separate "What did you discover?" step — Harvest plus the optional Resonance share already capture the user's discovery.
- There is also no execution-result status (Explored / Partially / Not Sure) — completion is compulsory under strict gating, so the result is always "complete" and needs no display.

---

## 9. Data Model (Supabase)

| Table | Purpose |
|---|---|
| `meditation_dimensions` | 3 rows: Breathing, Mind, Awareness. `slug`, `title`, `description`, `order_index` + Tao Echo fields (`tao_echo_passage`, `tao_echo_chapter`, `tao_echo_implication`) |
| `meditation_subtasks` | Sub-task content: `dimension_id`, `title`, `description`, `video_url`, `duration_seconds`, `repeat_count` (N), `window_days` (X), `order_index`, `is_active` |
| `meditation_combinations` | Combination content: `title`, `description`, `video_url`, `duration_seconds`, `repeat_count`, `window_days`, `order_index`, `is_active` + Tao Echo fields (`tao_echo_passage`, `tao_echo_chapter`, `tao_echo_implication`) |
| `meditation_subtask_attempts` | Per-user sub-task cycle records (append-only). `user_id`, `subtask_id`, `attempt_number`, `completed_reps`, `status` (`in_progress`/`completed`/`expired`), `started_at`, `closed_at` |
| `meditation_combination_attempts` | Per-user combination cycle records (append-only). Same shape. |
| `meditation_harvest_config` | Harvest configuration per tier (filled by content team later): `tier` (`subtasks`/`combinations`), `question_key`, `question_text`, `options`, `interpretation`, `recommendation` |
| `meditation_harvest_submissions` | Submitted Harvest: `user_id`, `tier`, `answers`, `resonance_shared`, `created_at` |

Notes:

- **Append-only attempts** implement "reopen = new record, old preserved". The active attempt is the latest `in_progress` row; a unit is complete when it has a `completed` attempt.
- **Combination unlock** is derived: all sub-tasks have a `completed` attempt. No prerequisite junction table is needed.
- **No Insight storage** — there is no insight column or table in Meditation.
- **Profile records** are derived from `meditation_subtask_attempts` / `meditation_combination_attempts` (`status = completed`) plus `meditation_harvest_submissions`. No separate profile-storage table is needed.

---

## 10. UI Structure & Routes

| Route | Screen |
|---|---|
| `/meditate` | Micro-task sub-module entry: 3 dimension cards + Combinations entry (shows lock state) + sub-task Harvest entry once all sub-tasks complete. (The meditation module's top-level home listing the 3 sub-modules is deferred — see §1.) |
| `/meditate/dimension/:slug` | A dimension's sub-task list (linear order), with its Tao Echo below the list. All videos previewable; practice gated. Prominent help button opens the execution-requirements explanation (§5.2). |
| `/meditate/subtask/:id` | Sub-task: preview + practice + free-practice player (mode label), repetition progress, replay, gate note |
| `/meditate/combinations` | Combination list (locked/unlocked), each card followed by its Tao Echo + combination Harvest entry once all combinations complete. All videos previewable. Same help button available. |
| `/meditate/combination/:id` | Combination: preview + practice + free-practice player, repetition progress, replay, gate note |
| `/meditate/harvest/:tier` | Tier-level Harvest (`subtasks` / `combinations`) → (optional) share to Resonance |

Mode-label UI (from §5.1):

- Tapping a thumbnail anywhere = **Preview** mode.
- Tapping **"Start Practice"** on the current unit = **Practice** mode.
- A locked unit's practice button shows a lock + "Complete the previous micro-task to unlock"; its video remains previewable.

### 10.1 Profile Record

Completed micro-tasks are recorded in the user's Profile (`/profile`), shown as a **Meditation section** — mirroring Learning's Tao Archive.

Each entry lists: the unit title, its dimension (or "Combination"), completion date, and — where a tier Harvest has been submitted — a link to it (sub-tasks → `/meditate/harvest/subtasks`, combinations → `/meditate/harvest/combinations`).

Data is read from the attempts and harvest tables (§9); no additional storage.

### 10.2 Entry UI — Wheel (deferred, separate implementation)

The Micro-task sub-module's entry will ultimately adopt the **Learning module's wheel pattern**: micro-task categories and tags arranged on a wheel; the user turns the wheel to enter a dimension / micro-task.

**Decision: implement separately.** This design ships with simple dimension cards as a placeholder entry. The wheel is a follow-up piece because:

- It is a pure navigation / visual layer, decoupled from the practice engine (video, cycle, gating, Harvest); the data model is unaffected.
- It must align with the Learning module's existing wheel component and interaction, which deserves its own design pass.
- The core practice loop can be built and verified before the entry is restyled.

Open point for the wheel design (not resolved here): how wheel-based entry coexists with strict linear gating — whether the wheel selects a *dimension* to enter (gating applies inside) or directly selects the *next micro-task* (which would still need to respect the platform's order).

**Bagua center video display (same deferred piece):** the entry's visual frame is a Bagua image (see `Taoism Master 03.png`) — its eight trigram positions are the wheel's category slots, and its **center (currently a meditating Laozi) will display the micro-task videos**. This is part of the same deferred entry-UI design, not a separate concern. Open points for that design: (a) whether the center video area is a *preview* surface (free browsing of all videos) or the *practice* player (gated execution) — the practice engine is unchanged either way, since the player is already a shared component; (b) how the 8 trigram slots map onto the 3 dimensions (+ combinations).

---

## 11. Canonical Language

| Term | Definition |
|---|---|
| **Micro-task** (umbrella) | Any practice unit: a sub-task or a combination. |
| **Sub-task** | Single-dimension practice unit (basic). Own video, own cycle. |
| **Combination** | Cross-dimension practice unit with its own integrated video (important). Own video, own cycle. |
| **Practice Cycle** | A sub-task's or combination's assignment: repeat N times within X days. |
| **Dimension** | Breathing, Mind, Awareness (Body removed). |
| **Preview** | Free viewing of any video; does not count. |
| **Practice** | Gated execution; full playback = 1 repetition. |
| **Tao Echo** | Platform-provided content shown below a dimension's or combination's micro-task list, labeled "Tao Echo" (passage + chapter + Implication). |
| **Free practice** | Replay of a completed unit; no counting, no record change. |
| **Harvest** | "What actually changed?" — structured, once per completed tier (sub-tasks / combinations). |
| ~~Insight~~ | Removed from Meditation. |

---

## 12. Impact on Existing Docs

`MEDITATION_MODULE_SPEC.md` (to be synced after approval):

- §2.1 Individual Practice — replace micro-practice→combination→cycle with the two-tier model.
- §3.1 — 4 dimensions → 3 (Body removed).
- §4, §5 — replace 15-day / combination-as-cycle with per-unit N/X cycles.
- §6 Content Format — replace "video = learning / silent = practice" with "video = practice (silent demo)".
- §8 Canonical Language — update per §11.
- Decision log — append this design's decisions.

`TAOMONY_V3_PLAN.md`:

- §4.2 Meditation flow — `Micro Practice → Tao Echo → Harvest → Insight → Resonance` becomes `Micro Practice → Tao Echo → Harvest → Resonance` (Insight removed).

---

## 13. Not Designed Here (Deferred)

- Inner Alchemy: unit format, video, cycle, reflection — deferred.
- Collective Meditation: room numbering, seats, presence — deferred (separate zone).
- Harvest content: questions/options/interpretation per tier (sub-tasks / combinations) — supplied by content team later.
- Video content: all sub-task and combination videos — supplied later.
