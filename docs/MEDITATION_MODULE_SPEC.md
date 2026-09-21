# Taomony Meditation Module — Product Constitution

> **Status:** Approved (2026-09-19) — synced with `docs/superpowers/specs/2026-09-19-meditation-video-architecture-design.md`
> **Role:** Single source of truth for all Meditation module implementation.
> All data structures, content, UI design, component implementation, and Supabase schema must reference this document (and the video-architecture design) as the highest authority.
> **If code conflicts with this SPEC, fix the code — not the principles.**

---

## 1. Product Philosophy

### 1.1 What Meditation Is

Meditation is the module where Tao is **experienced**, not explained.

> **Learning** = Read / understand Tao.
> **Meditation** = Experience / practice Tao.

A Tao Te Ching principle that is hard to map to a real-life scenario (e.g., 致虚极守静笃) finds its practice entry here — as a breath / mind / awareness experience, not as an intellectual explanation.

### 1.2 What Meditation Is NOT

- **Not a guided-meditation content library.** Not "Taoist Headspace". Choosing a meditation and following the guide is the OLD model.
- **Not a course/video library** (the old Foundation/Transformation/Unity YouTube library).
- **Not a habit tracker or productivity system.** No streaks, points, check-ins, or completion pressure.

Meditation is:

> **Build your practice, one Taoist micro-practice at a time.**
> **Meditation is not something you listen to. It is something you practice.**

---

## 2. Core Model

The Meditation module has **two pillars**:

1. **Individual Practice** — the micro-task practice model (this document's core).
2. **Collective Meditation** — a group practice experience. It already runs in the current module; it **survives** the rebuild and will be deeply optimized. It is inherently **not silent**.

### 2.1 Individual Practice — Two-Tier Model

```
Sub-task (single-dimension, basic)
        ↓ complete all sub-tasks (global gate)
Combination (cross-dimension, important)
        ↓ complete all micro-tasks
Inner Alchemy (deferred)
```

- **Sub-task** — a single-dimension practice unit (e.g., "Observe Breath" in Breathing). The basic building block. Carries its own video and its own cycle.
- **Combination** — a cross-dimension practice unit with its **own integrated video** (e.g., "Natural Breath → Observe Thoughts → Open Awareness"). The *most important* part of training.
- Both layers carry their own **Practice Cycle** (§5). Sub-tasks must be completed first (basic → important).

### 2.2 Tao Echo — The Bridge Back to the Tao

Each **Combination** is paired with exactly one **Tao Echo**:

> One Combination → One Tao Echo

A Tao Echo contains only:

1. **Original Tao Te Ching passage** — one relevant original passage. Normally only one passage per Combination; do not overload a practice with multiple quotations.
2. **Chapter reference** — the relevant *Tao Te Ching* chapter.
3. **Implication** — a concise explanation of how the abstract passage maps onto the specific practice. Not a general philosophical essay and not a replacement for the Tao Perspective used in Learning.

Tao Echo is the meditation module's link back to the source text. It is distinct from **Harvest** ("What actually changed?").

**Flow (Combination layer only):** Practice → **Tao Echo** → **Harvest** → (optional) **Share to Resonance**.

- Sub-tasks have **no reflection** — completing N repetitions is the whole task.
- **Insight is removed** from Meditation — Harvest plus the optional Resonance share already capture the user's discovery. There is no separate "What did you discover?" step, and no execution-result status (Explored / Partially / Not Sure).

> Cross-module: Meditation participates in the universal **Practice → Harvest → Discovery → Resonance** loop defined in `TAOMONY_V3_PLAN.md`. Harvest content is curated later (framework first, not invented now).

### 2.3 Collective Meditation — Virtual Synchronous Model

**Pain point:** Traditional collective meditation requires booking a time and everyone joining simultaneously. Taomony users span global timezones, so true simultaneity is impractical.

**Model:** *Virtual synchronous meditation* —
- Anyone can enter the space **at any time** and start **from the beginning** (their video starts at 0:00 when they join).
- The user **sees other practitioners currently present** in the space.
- This satisfies two needs at once: **start from the beginning** + **practice in a collective state**.
- **Shared is the sense of presence, NOT the playback timeline** — each user watches their own progress, not the same timestamp.

**Content:** separate from micro-tasks —
- Collective meditation uses its **own long-form immersive videos (10+ min)**, supplied separately.
- Sub-tasks (basic skills) and Inner Alchemy (小周天 etc.) are short and practice-oriented — NOT suitable as collective meditation content.
- Collective meditation's emphasis is **experience over practice**.

**Mechanics (carried into the rebuild):**
- **Seats:** 30 total — 15 phantom figures + 15 real seats, alternating (one real seat between two phantoms). Real users' usernames appear on join/leave; each user sees their **own** username persistently.
- **Presence:** real-time presence is kept (seat assignment, join/leave).
- **Room:** room numbering must be redesigned (current code hardcodes a single room).
- **Comments:** belong exclusively to Collective Meditation; the user must join before commenting. Micro-task sub-modules (self-training) have no comments.
- **Lifecycle:** drop-in — no cycle, no reflection, no bundle. A space of freedom and release, the counterpoint to the disciplined individual practice.
- **Entry-card fake count** ("128 Spirits Online") is removed; real presence count is shown inside the room. Future "popularity" cues are a separate concern.

- Inherently **not silent**: it breaks silence by design.
- Its current implementation is discarded and rebuilt — see §7.

---

## 3. Taxonomy

### 3.1 Base — Three Dimensions

| Dimension | Domain |
|---|---|
| **Breathing** | Observe / regulate / release the breath |
| **Mind** | Observe thoughts, non-attachment, return to stillness |
| **Awareness** | Open observation of sensation, sound, space, being |

- **Body is removed.** The four-dimension taxonomy is reduced to three. Body-type sub-tasks (Relax Shoulders, Rooting, physical stillness) are dropped, not reassigned.
- **Stillness is not a dimension.** It is a *state* that emerges through practice.

### 3.2 Advanced Tier — Inner Alchemy

- 小周天 (Microcosmic Orbit), 太乙金华宗旨 (Secret of the Golden Flower), and other Taoist inner-alchemy practices.
- Sequential practice content — NOT forced into the combinable micro-task model.
- **Unlocked only after all micro-tasks (sub-tasks + combinations) are complete** — a strict, monotonic gate. The user must finish every sub-task and every combination before entering Inner Alchemy.

---

## 4. Practice Cycle Semantics

- Each sub-task and each combination has its own **Practice Cycle**, defined by two platform-set parameters: **N** = required repetitions, **X** = time window in days (e.g., "3 repetitions within 5 days"). Both are set per unit by the platform based on complexity.
- There is **no fixed 15-day window** and **no Bundle** concept.

---

## 5. Cycle Mechanics

- **Early completion:** completing all N repetitions ends the cycle **early** — X is an upper bound, not a minimum.
- **Timeout (window expired, N not reached):** the cycle closes with a **gentle mark** ("expired", no failure language). The "Continue" to the next unit **stays locked** — the user must reopen this unit and reach N reps to advance (strict gating preserved). **Reopen = a new record**; the old attempt is preserved, never overwritten (append-only).
- **Interruption (quit mid-repetition):** the in-progress repetition is discarded; the user **restarts that repetition** on return. Already-completed repetitions are preserved. No playback position is stored — only `completed_reps` + an in-progress flag.
- **No rewards:** no streaks, points, badges, or completion pressure of any kind. Practice is self-discipline training.

---

## 6. Video & Practice Mechanics

- Every sub-task and every combination is delivered as a **short, silent demonstration video** — no narration, no guided-meditation voiceover. A demonstration shows the person's action only; guidance is not the content.
- **Video duration = practice duration.**
- **Completion = full playback in practice mode.** One repetition counts when the practice video plays through to its end; skipping ahead does not count a repetition until the end is reached.

### 6.1 Preview vs Practice (dual-entry)

| | Preview (free browsing) | Practice (executing) |
|---|---|---|
| Access | Any video, any time | "Start Practice" on the currently advanceable unit |
| Player label | "Preview" | "Practicing · Rep N/M" |
| Counting | Does not count toward the cycle | Full playback counts as 1 repetition |
| Gating | None | Locked by progression rules (§7) |

- All videos (sub-tasks and combinations) are freely previewable in full, even while locked.
- The player always shows the current mode label, so the user always knows which state they are in.

### 6.2 Entry Instructions (first-time help)

A **prominent help button** ("?" in the screen header) on the sub-task / combination list screens opens a modal explaining the execution rules: (1) Preview vs Practice, (2) completion, (3) cycle, (4) early finish, (5) timeout, (6) order, (7) no rewards.

---

## 7. Existing Code

The entire existing meditation **code** is **discarded and rebuilt** — the new solution takes a completely different architecture. **Exception: Collective Meditation is a surviving feature** — its current code is discarded, but the feature itself is re-architected, not deleted.

Legacy files (removed in the 2026-09 rebuild): `src/pages/Meditate.jsx` and `src/components/meditate/*` (CourseLibrary, MemberPracticesPortal, MemberPracticesView, VideoPlayerModal, CommentsSection, StageTabs, useMemberPractices).

New implementation: `src/pages/MeditationHome.jsx`, `MeditationDimension.jsx`, `MeditationSubtask.jsx`, `MeditationCombinations.jsx`, `MeditationCombination.jsx`, `TaoEchoView.jsx`, `HarvestView.jsx`; `src/components/meditation/MeditationVideoPlayer.jsx`, `HelpModal.jsx`; `src/components/profile/MeditationRecordCard.jsx`; `src/data/meditationMock.js`, `meditationStore.js`, `meditationHarvestStore.js`; `supabase/migrations/20260920000000_create_meditation_tables.sql`.

---

## 8. Canonical Language

| Term | Definition | Avoid |
|---|---|---|
| **Micro-task** (umbrella) | Any practice unit: a sub-task or a combination. | exercise, drill |
| **Sub-task** | Single-dimension practice unit (basic). Own video, own cycle. | micro-practice, step |
| **Combination** | Cross-dimension practice unit with its own integrated video (important). Own video, own cycle. | routine, playlist, session recipe |
| **Practice Cycle** | A sub-task's or combination's assignment: repeat N times within X days. | task, challenge, program |
| **Dimension** | Breathing, Mind, Awareness (Body removed). | stage, level, category |
| **Inner Alchemy** | The advanced tier (小周天, 太乙金华宗旨, etc.), unlocked only after all micro-tasks are complete. | advanced course |
| **Preview** | Free viewing of any video; does not count. | — |
| **Practice** | Gated execution; full playback = 1 repetition. | — |
| **Tao Echo** | One Combination → one Tao Echo (passage + chapter + Implication). | quote card |
| **Harvest** | "What actually changed?" — structured, at combination completion. | — |
| **Collective Meditation** | The group practice pillar: virtual synchronous. Long-form immersive content; experience over practice. Inherently not silent. | group session, live class |
| ~~Insight~~ | Removed from Meditation. | — |

---

## 9. Open / Deferred Questions

- Inner Alchemy: unit format, video, cycle, reflection — deferred.
- Collective meditation: room-numbering scheme, seat cap behavior, interaction beyond shared presence — deferred (separate zone).
- Harvest content: questions/options/interpretation per combination — supplied by content team later.
- Video content: all sub-task and combination silent demonstration videos — supplied later.
- Entry UI: wheel / Bagua pattern (Learning-module alignment) — separate implementation, decoupled from the practice engine.

---

## 10. Decision Log

| # | Decision | Result | Date |
|---|---|---|---|
| 1 | Core unit | micro-practice → combination → practice cycle (C) | 2026-08-29 |
| 2 | Taxonomy | 4 dimensions (Breathing/Body/Mind/Awareness); Stillness is a state | 2026-08-29 |
| 3 | Advanced tier | Inner Alchemy above the 4 dimensions; progressive, invitation not gate | 2026-08-29 |
| 4 | Existing code | Entire meditation code discarded (collective meditation feature survives) | 2026-08-29 |
| 5 | Cycle granularity | Practice Cycle = curated combination (b); bundle = 3 cycles; no free assembly | 2026-08-29 |
| 6 | Cycle philosophy | Follow Learning's gentle model; no task/check-in/streak language | 2026-08-29 |
| 7 | Content format | Micro-practice content = short video (supplied later) | 2026-08-29 |
| 8 | Silent mode | Video = learning, silent = practice state; silence is default but breakable (option c) | 2026-08-29 |
| 9 | Collective meditation | Second pillar; survives rebuild and is deeply optimized; inherently not silent | 2026-08-29 |
| 10 | Collective meditation model | Virtual synchronous: join anytime, start from beginning, see others present; own 10+ min immersive content; experience over practice | 2026-08-29 |
| 11 | Collective seats | 30 = 15 phantom + 15 real, alternating; own name persistent, others on join/leave | 2026-08-29 |
| 12 | Collective comments | Exclusive to collective; must join to comment; micro-task sub-modules have no comments | 2026-08-29 |
| 13 | Collective guider video | YouTube for now, self-produced later; no architecture impact | 2026-08-29 |
| 14 | Collective entry count | Remove fake "128 Spirits Online"; real count inside room; future popularity cues separate | 2026-08-29 |
| 15 | Collective lifecycle | Drop-in; no cycle/reflection/bundle; freedom after individual discipline | 2026-08-29 |
| 16 | Tao Echo | One Practice Combination → one Tao Echo (Tao passage + chapter + Implication); distinct from Harvest and Insight | 2026-08-30 |
| 17 | Two-tier model | Sub-task (single-dimension) → Combination (cross-dimension, own integrated video); supersedes #1 | 2026-09-19 |
| 18 | Taxonomy | 3 dimensions (Body removed); Stillness is a state; supersedes #2 | 2026-09-19 |
| 19 | Advanced tier | Inner Alchemy unlocked only after all micro-tasks (sub-tasks + combinations) complete; strict gate; supersedes #3 | 2026-09-19 |
| 20 | Cycle | Per-unit N/X; early completion; timeout = gentle expired (append-only, old record preserved); no bundle; no rewards; supersedes #5, #6 | 2026-09-19 |
| 21 | Video | Video = practice (silent demo, no narration); duration = practice; full playback = 1 rep; preview vs practice dual-entry; supersedes #7, #8 | 2026-09-19 |
| 22 | Reflection | Combination layer only: Tao Echo → Harvest → (optional) Resonance; Insight removed; no execution-result status; supersedes #16 | 2026-09-19 |
