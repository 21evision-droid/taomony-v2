# Taomony V3 — Architecture & Content Plan

> **Status:** Living document. Principles are firm; specifics may evolve during implementation.
> **Last updated:** 2026-07-26

---

## 1. Product Identity

**Name:** Taomony (Taoism + Harmony = "Tao to Harmony")

**Elevator pitch:** A meditation/wellness app built on Taoist wellness theory, differentiated from Insight Timer / Headspace / Calm by a **micro-task model** instead of traditional guided meditation.

**Target audience:** Western English-speaking users. Launch market: Australia → global.

**Business model:** Subscription (industry standard for meditation apps).

**Language:** All English. No Chinese UI.

---

## 2. Core Innovation: Micro-Task Model

Traditional meditation apps rely on guided audio sessions. Users burn out because the format is monotonous and competitors are interchangeable.

Taomony's approach:
- Platform provides curated micro-tasks organized into task pools
- Users select a personal task bundle (e.g., 3 tasks from a pool of 10+)
- Each task runs for a defined cycle (e.g., 7 days)
- Platform provides supervision reminders (push notifications / check-ins)
- After each cycle, user reports status → determines next steps (advance / repeat)

The model is inspired by habit formation: small, consistent actions produce lasting change better than big, sporadic efforts.

---

## 3. Five Modules

### 3.1 Learning (道德经 / Tao Te Ching)

**Old model:** Browse all 81 chapters, study cards, comments section. Problem: information overload — nobody reads theory.

**New model:** Task-list format. Each task = a real-life problem paired with a Tao Te Ching chapter as solution. The user experiences the chapter through a task cycle.

**Precedent:** r/Taoism on Reddit — people come with problems seeking Taoism-based solutions.

**Example tasks:**
- "Feeling overwhelmed at work? Read Chapter 48 (非无为) and practice reducing one unnecessary thing each day this week."

### 3.2 Meditate

**Old model:** Standard guided meditation (audio-based).

**New model:** Decompose Taoist meditation practices into progressive micro-tasks.

**Content sources:** 小周天 (Microcosmic Orbit), 太乙金华宗旨 (Secret of the Golden Flower), and other Taoist inner alchemy practices. Each broken into step-by-step tasks the user tackles sequentially.

**Example tasks:**
- "Day 1-3: Focus on lower dantian breathing for 5 minutes each morning."
- "Day 4-7: Visualize energy rising up the spine for 10 minutes."

### 3.3 Sleep

**Old model:** Guided sleep content (music, meditation audio).

**New model:** Micro-tasks that build sleep hygiene habits. The philosophy: good sleep comes from consistent practice, not a magic audio track.

**Example tasks:**
- "No phone screen for 1 hour before bed."
- "Standing meditation (站桩) for 10 minutes before sleep."
- Tasks are independent — no strict ordering.

### 3.4 Taomony Eating

**Old name in code:** TaoWeight

**Rationale for inclusion:** Eating is a path to harmony. Taoist dietary wisdom is a core part of Taoist wellness.

**Three-tier progressive structure:**

| Tier | Focus | Example |
|---|---|---|
| Tier 1 | Lifestyle habits | "No sugary drinks for one week." "At least 5 days/week meat-free dinner." |
| Tier 2 | Scenario prompts | Platform provides specific situational cues for mindful eating decisions |
| Tier 3 | Taoist recipes | Platform provides recipes; user cooks and reports results |

**Status feedback loop:** After each cycle, user checks off states (results of the tasks). If improvement → advance to next tier. If not → repeat current tier with different task selection (10+ tasks per tier, user picks 3).

### 3.5 Resonance (Dify Workflow Module)

**Old name in code:** HarmonyPavilion

**Status:** ⚠️ Postponed. Depends on Dify Docker setup. Existing Dify workflows (A/B) will be significantly reworked.

---

## 4. Shared Micro-Task Skeleton

All modules (except Resonance) share a common pattern:

> Platform task pool → User selects bundle → Execute over cycle → Status check-in → Next decision

Each module gets its own database tables to preserve flexibility for module-specific needs.

---

## 5. Tech Stack

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

## 6. Database Approach

- **Each module gets its own tables** — no forced unified schema across modules.
- Existing tables (comments, submissions, journey_posts, categories, channels, raw_fragments) are legacy from V2 — **do not delete**, but will not be used in the new architecture.
- New migrations will be added as new `.sql` files under `supabase/migrations/`.
- Auth: Supabase Auth with email login (Google OAuth deferred to final stage).

---

## 7. Git & Naming

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

## 8. Development Order

1. **Learning** ← First module. Entry point and app face.
2. **Meditate**
3. **Sleep**
4. **Taomony Eating**
5. **Resonance** (postponed — requires Dify)

Each module gets its own Claude Code chat session.

---

## 9. Migration Status

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

## 10. Design Principles

1. **Flexibility over rigidity** — Each module's uniqueness is respected. Don't force a one-size-fits-all schema.
2. **Micro-tasks first** — Every feature is thought of in terms of small, user-actionable units.
3. **English only** — All UI text, all task content, all communication.
4. **Mobile-first** — The app is designed for phone screens first (max-width 480px).
5. **Simple, not speculative** — No features that aren't requested. No abstraction for hypothetical futures.

---

*This document will be updated as decisions are made during implementation.*
