# Taomony V3 — Architecture & Content Plan

> **Status:** Living document. Principles are firm; specifics may evolve during implementation.
> **Last updated:** 2026-08-30

---

## 1. Product Identity

**Name:** Taomony (Taoism + Harmony = "Tao to Harmony")

**Elevator pitch:** A meditation/wellness app built on Taoist wellness theory, differentiated from Insight Timer / Headspace / Calm by a **micro-practice model** instead of traditional guided meditation.

**Target audience:** Western English-speaking users. Launch market: Australia → global.

**Business model:** Subscription (industry standard for meditation apps).

**Language:** All English. No Chinese UI.

---

## 2. Core Innovation: The Micro-Practice Model

Traditional meditation apps rely on guided audio sessions. Users burn out because the format is monotonous and competitors are interchangeable.

Taomony's approach:
- Platform provides curated micro-practices organized into practice pools
- Users select a personal practice bundle (e.g., 3 practices from a pool of 10+)
- Each practice runs for a defined cycle (e.g., 7 days)
- Platform provides gentle guidance reminders
- After each cycle, the user reports a **Harvest** (Meditation / Sleep / Eating) or **Reflection** (Learning) — what actually changed → **Calibration** determines the next step

The model is inspired by habit formation: small, consistent actions produce lasting change better than big, sporadic efforts.

> **Terminology note:** earlier drafts used "micro-task". Current working terms (provisional — to be unified before launch): Meditation uses **sub-task / combination** (umbrella: **micro-task**), Learning uses **Journey**, Sleep uses **Sleep Practice**, Eating uses **Experiment / Micro Practice**.

---

## 3. Core Practice Loop — Harvest → Calibration → Insight → Resonance

### 3.1 Core Principle

> **Practice → Observe → Discover → Resonance**

Taomony should not merely provide users with content or practices. Users should be able to observe what actually changes after practicing, use that result to adjust their next practice, and gradually discover what works for them.

The core principle is:

> **Don't meditate to complete a session. Practice to discover what actually works.**

The broader product loop is:

> **Understand → Practice → Observe → Adjust → Discover → Share**

The system must remain result-driven without becoming achievement-driven, gamified, or metric-obsessed.

**Architectural principle — unify the flow, not the terminology.** The first four modules share one underlying experience flow, but each may keep its own UI terminology (e.g., Learning's **Reflection** / **Your Reflection** vs Meditation's **Harvest**, Sleep/Eating's **Harvest** / **Insight**). Do not force uniform names or redesign a module's existing mechanism purely for terminological consistency.

### 3.2 Harvest — A Post-Practice Submodule for Meditation, Sleep, and Eating

A **Harvest** submodule sits at the end of the practice flow in:

* Meditation
* Sleep
* Eating

**Learning is excluded** — Learning keeps its existing personalized **Reflection** mechanism (see §4.1); it is not renamed to Harvest. **Resonance is excluded** — Resonance is not a practice module.

**Harvest title:** `Harvest`
**Harvest subtitle:** **"What actually changed?"** (used consistently across modules unless a specific contextual variation is necessary).

Harvest is **not** a score, rating, or success/failure judgment. It is a structured way for the user to report what actually changed after completing a micro-practice or a defined practice cycle.

- Prioritize observable outcomes over subjective self-evaluation (what changed, what did not change, did the intended effect appear, did an unexpected effect appear).
- Harvest options are normally **preset and selectable**, not free-form.
- Where appropriate, Harvest supports measurable or semi-measurable outcomes.
- Do not turn Harvest into a conventional health-tracking dashboard — collect only what is directly relevant to the practice being performed.

### 3.3 Harvest Drives Calibration

Harvest is not a dead-end survey. After Harvest is submitted, Taomony uses the outcome to determine the most appropriate next step.

Possible recommendations:

* Continue
* Repeat
* Repeat with a shorter duration
* Repeat with a different intensity
* Adjust the practice
* Try a related micro-practice
* Progress to a deeper practice
* Try another practice

Example:

> Harvest: No noticeable change
> Recommendation: Repeat this practice for another cycle.

Calibration stays objective and non-judgmental. **Do not use** success/failure, scores, rewards, streaks, achievement language, or gamification. A negative or neutral result is still a valid practice result.

### 3.4 Insight — A New Optional Submodule

For Sleep and Eating, after Harvest and any resulting calibration, an optional second submodule (Meditation removed Insight in the 2026-09 redesign — see `MEDITATION_MODULE_SPEC.md`):

**Insight** — "What did you discover?"

* **Harvest asks:** "What actually changed?"
* **Insight asks:** "What did you discover?"

Harvest is structured and objective. Insight is the user's own interpretation, realization, or personal discovery arising from the practice. Insight preserves the user's own voice and is never converted into philosophical language by the platform. It is optional — skippable without friction.

**Insight is not Reflection.** "Reflection" is reserved for Learning's existing reflection stage. In Sleep and Eating, do not call this submodule "Reflection".

**Learning's "Your Reflection" is functionally equivalent.** Although Learning keeps the name **Your Reflection**, it serves the same broader purpose — capturing the user's own realization after actual practice. The underlying data architecture should conceptually treat Learning's *Your Reflection*, Sleep's *Insight*, and Eating's *Insight* as instances of **User-generated Practice Experience**, while UI terminology stays module-specific.

### 3.5 Insight → Resonance

If a user chooses to share an Insight, it flows naturally into **Resonance** — no separate post required.

The platform auto-constructs the Resonance entry from the context already generated by the practice:

* Source module
* Practice / Journey / Experiment
* Practice duration or cycle
* User's Insight

The user may optionally review the generated entry before publishing.

> **Practice naturally creates content.**

Do not design Resonance around asking users to continuously create posts.

### 3.6 Resonance — The Collective Memory of Practice

Resonance is formally defined as:

> **The collective memory of practice.**

This collective memory is **not artificially manufactured by the platform** — it is formed naturally from real experiences generated by the first four modules.

> **Resonance is not primarily a content-creation module. It is where lived experiences from Taomony's practices naturally converge.**

The system must not depend on forced posting, posting tasks, engagement incentives, or social pressure.

A Resonance entry makes its origin visible in a lightweight, non-promotional way (e.g., "Meditation · Natural Breath · 14-day practice"). Individual experiences are never presented as scientific proof or guaranteed outcomes; measurable outcomes (e.g., weight loss) remain personal results, not universal product claims, and Resonance must not become advertising copy.

### 3.7 System-Level Product Loop

> **Tao → Understanding → Practice → Harvest / Reflection → Calibration → Insight / Your Reflection → Resonance → New Practice**

Or in its shortest form:

> **Practice → Harvest → Discovery → Resonance**

The five modules are not five independent destinations:

* **Learning** helps users understand Tao.
* **Meditation** helps users experience Tao through inner practice.
* **Sleep** helps users restore natural rhythm through practice.
* **Eating** helps users transform daily behavior through practice.
* **Resonance** preserves and circulates the lived experiences generated by those practices.

The first four modules generate practice experiences. Harvest (or Reflection) provides evidence of change. Calibration determines what to do next. Insight (or Your Reflection) captures personal discovery. Resonance allows those discoveries to naturally become part of the collective memory of practice.

### 3.8 Critical Content Boundary — Harvest Content Must NOT Be Invented

The Harvest **framework and architecture** is built now; the actual Harvest **content** must not be invented by the implementation AI.

**Build now:** Harvest questions and options configuration, practice-specific Harvest configuration, Harvest→outcome mapping, Harvest interpretation, Harvest→Recommendation / Calibration logic, Harvest history, module-specific Harvest data, future content injection / configuration, Insight integration, the Insight→Resonance flow, and the Learning *Your Reflection*→Resonance integration. Each individual Micro Practice, Sleep Practice, or Eating Experiment must be able to carry its own customized Harvest configuration; a Tao Journey carries *Your Reflection* instead.

**Do NOT:** create a generic Harvest question bank; auto-generate Harvest questions for all practices; reuse the same questions across different practices; fill the database with placeholder Harvest content that appears final; use generic questions ("How did you feel?", "Did you feel better?", "Was this practice helpful?") unless explicitly provided later by the product/content team.

> **Harvest is practice-specific, not a generic questionnaire.**

Harvest content must be curated and mapped individually by the product/content team:

> **Micro Practice → Harvest Question(s) → Harvest Options → Outcome Interpretation → Recommendation**

The implementation AI's responsibility at that stage is to implement the provided content accurately, not reinterpret or redesign it.

---

## 4. Five Modules

### 4.1 Learning (道德经 / Tao Te Ching)

**Old model:** Browse all 81 chapters, study cards, comments section. Problem: information overload — nobody reads theory.

**New model:** Task-list format. Each task = a real-life problem paired with a Tao Te Ching chapter as solution. The user experiences the chapter through a task cycle.

**Precedent:** r/Taoism on Reddit — people come with problems seeking Taoism-based solutions.

**Example tasks:**
- "Feeling overwhelmed at work? Read Chapter 48 (非无为) and practice reducing one unnecessary thing each day this week."

**Practice flow:** Tao Journey → **Reflection** → **Your Reflection** → **Resonance** (optional share). The existing Reflection mechanism remains responsible for personalized post-Journey feedback; **Your Reflection** is the user's own free-form realization and is eventually shareable to Resonance.

### 4.2 Meditate

**Old model:** Standard guided meditation (audio-based).

**New model:** Two-tier practice rebuilt around **silent demonstration videos** (no narration — the video *is* the practice, not a guide):
- **Sub-task** — a single-dimension practice unit (Breathing / Mind / Awareness), with its own video and its own cycle.
- **Combination** — a cross-dimension unit with its own integrated video; the most important part of training.
- Every unit carries a **practice cycle**: repeat N times within X days (platform-set per unit); full playback of the practice video counts as 1 repetition.
- Sub-tasks unlock linearly within a dimension; Combinations unlock once **all** sub-tasks are complete; Inner Alchemy unlocks once **all** micro-tasks (sub-tasks + combinations) are complete.

**Content sources:** Inner Alchemy (小周天, 太乙金华宗旨, etc.) is the advanced tier, entered only after all micro-tasks are complete.

**Practice flow:** Practice → **Harvest** → **Reflection** → **Resonance** (optional share). Harvest is tier-level: one for all sub-tasks, one for all combinations. After the Harvest, a free-form **Reflection** (mirroring Learning's *Your Reflection*) auto-publishes to Resonance on close unless sharing is unchecked. (Insight is removed from the Meditation flow.)

**Tao Echo:** Platform-provided content — (1) one original Tao Te Ching passage, (2) its chapter reference, and (3) an **Implication** — a concise explanation of how the passage maps onto the specific practice. Tao Echo is distinct from Harvest, is displayed below the micro-task list on the dimension and combinations screens (labeled "Tao Echo"), and is not user-filled. (Authoritative definition lives in `MEDITATION_MODULE_SPEC.md`.)

**Content philosophy:** the Meditation module is based on **Taoist meditation** decomposed into Sub-tasks and Combinations (Breathing, Mind, Awareness), not a conventional library of guided meditations. Tao Te Ching passages map to practices only where the conceptual relationship is meaningful. Actual Tao Echo mappings, Harvest content, and silent demonstration videos are designed and supplied by the product/content team later.

### 4.3 Sleep

**Old model:** Guided sleep content (music, meditation audio).

**New model:** Micro-practices that build sleep hygiene habits. The philosophy: good sleep comes from consistent practice, not a magic audio track.

**Example tasks:**
- "No phone screen for 1 hour before bed."
- "Standing meditation (站桩) for 10 minutes before sleep."
- Tasks are independent — no strict ordering.

**Practice flow:** Sleep Practice → **Harvest** → **Insight** (optional) → **Resonance** (optional share). Sleep Harvest focuses on actual changes in sleep experience and related observable outcomes.

### 4.4 Taomony Eating

**Old name in code:** TaoWeight

**Rationale for inclusion:** Eating is a path to harmony. Taoist dietary wisdom is a core part of Taoist wellness.

**Three-tier progressive structure:**

| Tier | Focus | Example |
|---|---|---|
| Tier 1 | Lifestyle habits | "No sugary drinks for one week." "At least 5 days/week meat-free dinner." |
| Tier 2 | Scenario prompts | Platform provides specific situational cues for mindful eating decisions |
| Tier 3 | Taoist recipes | Platform provides recipes; user cooks and reports results |

**Status feedback loop:** After each cycle, user reports a **Harvest**. Calibration then recommends the next step — continue, adjust, or move to the next tier with a different practice selection (10+ practices per tier, user picks 3).

**Practice flow:** Eating Practice / Experiment → **Harvest** → **Insight** (optional) → **Resonance** (optional share). Eating Harvest supports both behavioral and measurable outcomes where appropriate.

**Special importance of Harvest:** Eating practices may produce both behavioral results (reduced cravings, less snacking, greater satisfaction with simpler food, more conscious eating) and observable/measurable physical results (weight change, other user-reported physical changes). This creates a powerful connection: **Behavioral Practice → Observable Harvest → Personal Insight**. When voluntarily shared through Resonance, these become a trust mechanism — real practice experiences rather than marketing claims. Maintain appropriate product language: never guarantee weight loss, never imply one user's result is universal, no medical claims, and present measurable outcomes as individual user-reported results.

### 4.5 Resonance (Dify Workflow Module)

**Old name in code:** HarmonyPavilion

**Positioning:** Resonance is **the collective memory of practice** — where lived experiences (Harvest + Insight) from the first four modules naturally converge. It is not a conventional social-media feed and not primarily a content-creation module; practice naturally creates its content (see §3.6).

**Status:** ⚠️ Postponed. Depends on Dify Docker setup. Existing Dify workflows (A/B) will be significantly reworked.

---

## 5. Shared Practice Skeleton

All modules (except Resonance) share a common pattern:

> Practice pool → User selects bundle → Execute over cycle → **Observe what changed** (Harvest / Reflection) → **Calibration** (next step) → **Capture discovery** (Insight / Your Reflection, optional) → **Resonance** (optional share)

Each module gets its own database tables to preserve flexibility for module-specific needs.

---

## 6. Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 19 |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS 4 |
| Routing | React Router 7 |
| Icons | Lucide React |
| Backend / DB | Supabase (supabase-js v2) |
| Edge Functions | Supabase / Deno |
| AI Pipeline (postponed) | Dify (self-hosted via Docker) |
| Tunnel (postponed) | ngrok (Supabase Cloud → local Dify) |
| Design | Mobile-first, max-width 480px |

---

## 7. Database Approach

- **Each module gets its own tables** — no forced unified schema across modules.
- Existing tables (comments, submissions, journey_posts, categories, channels, raw_fragments) are legacy from V2 — **do not delete**, but will not be used in the new architecture.
- New migrations will be added as new `.sql` files under `supabase/migrations/`.
- Auth: Supabase Auth with email login (Google OAuth deferred to final stage).
- **Harvest data is per-module** — each module keeps its own Harvest configuration and submissions (practice → Harvest questions → options → outcome interpretation → recommendation). Harvest is calibration input and is **not** shared to Resonance. Harvest content is populated later by the product/content team (see §3.8) — the framework is built first, content is not invented now.
- **Insight / Reflection data is shared** — all modules write their free-form discovery (Insight / Your Reflection / Reflection) into one `reflections` table classified by `source` (`learning` / `meditate` / `sleep` / `eating`), so Resonance is a single converging feed (see §3.6).

---

## 8. Git & Naming

- Repo: `21evision-droid/taomony-v2`
- Branch strategy: TBD — start on `master`, branch per module if needed.

**Module renaming (code-level):**

| Old name | New name |
|---|---|
| `home` | `learning` |
| `TaoWeight` | `TaomonyEating` |
| `HarmonyPavilion` | `Resonance` |
| `meditate` | (unchanged) |
| `sleep` | (unchanged) |

---

## 9. Development Order

1. **Learning** ← First module. Entry point and app face.
2. **Meditate**
3. **Sleep**
4. **Taomony Eating**
5. **Resonance** (postponed — requires Dify)

Each module gets its own Claude Code chat session.

---

## 10. Migration Status

### Already done (this machine)
- [x] Git installed & configured (`21evision-droid` / `21evision@gmail.com`)
- [x] GitHub HTTPS access confirmed
- [x] Node.js v22 available
- [x] Repo cloned to `D:\Developer\taomony-v2`
- [x] `SUPABASE_ACCESS_TOKEN` obtained (`sbp_c7...`)

### Still needed
- [ ] `npm install` in project directory
- [ ] `npx supabase link --project-ref jiwsgaegoudcutdnqydf`
- [ ] Docker Desktop (for Dify — postponed)
- [ ] ngrok (for Dify — postponed)
- [ ] Confirm `index.html` workflow with other engineer

### Cloud — no action needed
- GitHub repo, GitHub Actions, GitHub Secrets
- Supabase database, Edge Functions, Secrets

---

## 11. Design Principles

1. **Flexibility over rigidity** — Each module's uniqueness is respected. Don't force a one-size-fits-all schema.
2. **Micro-practices first** — Every feature is thought of in terms of small, user-actionable units.
3. **English only** — All UI text, all task content, all communication.
4. **Mobile-first** — The app is designed for phone screens first (max-width 480px).
5. **Simple, not speculative** — No features that aren't requested. No abstraction for hypothetical futures.
6. **Practice over consumption.**
7. **Result over assumption.**
8. **Calibration over rigid plans.**
9. **Insight over forced reflection.**
10. **Real experience over manufactured content.**
11. **Resonance over social engagement.**
12. **Harmony through continuous practice and adjustment, not force.**
13. **Unify the underlying experience flow, not the UI terminology** — modules keep their own names (Reflection vs Harvest, Your Reflection vs Insight) where those already exist.
14. **Real practice produces real experience** — the first four modules generate practice experiences; Harvest/Reflection observes what changed; Insight/Your Reflection captures discovery; Resonance preserves and shares it. In shortest form: **Practice → Harvest → Discovery → Resonance**.

Do not introduce attention-economy mechanisms, gamification, engagement metrics, likes, streaks, achievement systems, or social pressure as part of this mechanism.

---

*This document will be updated as decisions are made during implementation.*
