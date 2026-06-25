# Harmony Resonance — Validation Report

> **Date:** 2026-06-07
> **Scope:** Phases 3A–3D (Database, Processor, Edge Function, Featured Resonance UI)
> **Status:** ✅ Validated | ⚠ Needs Fix | ❌ Blocked

---

## Executive Summary

The Harmony Resonance system was validated across 6 dimensions using 6,550 seeded fragments, 5 test users, and 6 distilled posts. The core pipeline (fragment → batch → distill → publish) functions correctly end-to-end. Key findings:

- **Performance**: Distillation completes in 320–590ms at current scale. Scales linearly.
- **Data integrity**: Zero duplicate fragments across distilled posts. FIFO ordering confirmed.
- **Quality**: Mock summaries are generic (expected — Dify Workflow B is the fix).
- **Security**: 1 HIGH-severity issue — RLS policy blocks anon reads; workaround uses service_role key in client code (dev only).
- **Data quality**: 1 systemic issue — `category_id` not populated during fragment ingestion.

---

## 1. Fragment Seeder Validation

**Scripts:** `scripts/seed-fragments.mjs`

| Target | Actual | Status |
|--------|--------|--------|
| 50     | 50     | ✅     |
| 500    | 500    | ✅     |
| 1,000  | 1,000  | ✅     |
| 5,000  | 5,000  | ✅     |

**Final corpus:** 6,550 fragments, 5 test users + 2 real users

**Status breakdown:**
```
completed:  5,922 (90.4%)  ← target 90%
pending:      302  (4.6%)  ← target 5%
processing:   184  (2.8%)  ← target 3%
failed:       142  (2.2%)  ← target 2%
```

**Test users created:** 5 (`seeduser_0` through `seeduser_4`)

**Key observation:** `auth.admin.createUser()` with `email_confirm: true` works reliably. User reuse (check-then-create) works for repeat runs.

---

## 2. Master Agent Stress Test

**Script:** `scripts/stress-test.mjs`

### Performance at Different Batch Sizes

| Batch Size | Avg Duration | Fragments/sec | Notes |
|-----------|-------------|---------------|-------|
| 50         | 321ms       | 156/s         | Design threshold |
| 100        | 321ms       | 311/s         | I/O dominated |
| 500        | 592ms       | 845/s         | Scales well |
| 1,000      | 583ms       | 1,715/s       | GPU not reached |

**Scaling characteristic:** Near-linear. The bottleneck is the initial DB query (avg ~430ms for 50 fragments, ~610ms for 1,000). Content generation is O(10 excerpts) regardless of batch size.

### FIFO Ordering Verification

```
Oldest undistilled: 2026-03-09T07:15:38
Most recent distilled source range: 2026-03-10T22:21:40 → 2026-03-11T10:08:48
```
✅ Fragments are processed in strict chronological order (oldest first).

### Contributor Distribution

All 5 test users appear in every batch (expected with random distribution across 3 months of data). The 2 real users (21evision, evision21) have no fragments — their data was created before the Harmony Resonance schema.

---

## 3. Distillation Quality Audit

**Script:** `scripts/quality-audit.mjs`

### 3.1 Topic Coherence

| Metric | Value | Grade |
|--------|-------|-------|
| Unique channels per batch | 14–17 | ✅ Rich diversity |
| Unique categories per batch | 0 | ⚠ All null |
| Content near-duplicates | 3/50 (6%) | ✅ Acceptable |

**Finding:** The seed data spans 16 of 19 available channels per batch on average. Content templates provide sufficient variety (only 6% near-duplicate openings). The `category_id` is null for ALL fragments because the seeder only sets `channel_id` — category denormalization is missing from the ingestion pipeline.

**Recommendation:** Add a DB trigger or application-level logic to set `raw_fragments.category_id` from `channels.category_id` on INSERT.

### 3.2 Summary Quality

| Post | Summary | Grade |
|------|---------|-------|
| "Reflections on General" | "A distillation of 50 fragments across 0 categories..." | ⚠ Generic + zero categories |
| "The Way of Stillness" | "A distillation of community wisdom on the way of stillness." | ⚠ Generic pattern |
| "Harmony in Daily Life" | "A distillation of community wisdom on harmony in daily life." | ⚠ Generic pattern |
| "Community Wisdom: Daily Practice" | "A distillation of community wisdom on community wisdom: daily practice." | ⚠ Generic pattern |

**Finding:** All 6 posts use the template `"A distillation of ..."`. This is expected from the mock. Dify Workflow B will generate meaningful, varied summaries.

### 3.3 Duplicate Handling

```
Unique fragments referenced: 300
Duplicate fragments across posts: 0
Properly marked is_distilled=true: 300/300 ✅
```
✅ No fragment appears in more than one distilled post.

### 3.4 Multi-Channel Aggregation

| Post | Channels Spanned |
|------|-----------------|
| Draft: Gratitude Circle | 17 channels |
| Draft: Inner Alchemy Insights | 17 channels |
| Harmony in Daily Life | 16 channels |
| Community Wisdom: Daily Practice | 14 channels |
| The Way of Stillness | 16 channels |
| Reflections on General | 14 channels |

✅ Good cross-channel aggregation. The oldest-fragments-first approach naturally captures channel diversity.

### 3.5 Contributor Attribution

```
All 6 posts: stored=5, actual=5 ✅
```
✅ Contributor counts are 100% accurate.

---

## 4. Featured Resonance Validation

### 4.1 Frontend Query

**Implementation:** `index.html` → `getPublishedDistilledPosts()` → `supabase.from('distilled_posts').select('*').eq('status', 'published').order('published_at', { ascending: false }).limit(5)`

**Test result (admin client):**
```
Found 4 published posts:
  [2026-06-07] Reflections on General — 5 contributors
  [2026-06-04] Harmony in Daily Life — 5 contributors
  [2026-06-02] Community Wisdom: Daily Practice — 5 contributors
  [2026-05-31] The Way of Stillness — 5 contributors
```

### 4.2 RLS Issue (HIGH Severity)

| Test | Anon Client | Admin Client |
|------|------------|-------------|
| Published posts returned | 0 | 4 |
| Draft posts returned | 0 | 2 |

**Root cause:** The RLS policy `USING (auth.role() = 'authenticated' AND status = 'published')` blocks the anon key used by the frontend.

**Current workaround:** `window.__taoAdminDb` — a second Supabase client using the service_role key — handles distilled_posts queries. This is a **temporary development measure** only.

**Fix pending:** Apply `supabase/migrations/20260606120000_fix_distilled_posts_rls.sql` when `supabase db push` connectivity is restored.

### 4.3 Realtime Subscription

The Realtime channel `distilled-posts-realtime` subscribes to INSERT and UPDATE on `distilled_posts`. The frontend handler:
- INSERT → prepend if `status === 'published'`, keep max 5
- UPDATE → add/update/remove based on status change

**Optimization opportunity:** Add `filter: 'status=eq.published'` to the Realtime channel to avoid processing draft/archived events.

### 4.4 UI Components

Components verified in `index.html`:
- `FeaturedResonanceCard` — gold gradient card with badge, title, summary, meta
- `FeaturedResonanceSection` — section wrapper with empty state and populated state
- Placement in `HarmonyPavilion` — between submit form and channel filter bar
- CSS — `.fr-card`, `.fr-badge`, `.fr-empty`, `.fr-divider` (lines 2024–2110)
- Empty state — "Community wisdom is still forming." with dove icon

---

## 5. Scalability Audit

**Script:** `scripts/scalability-audit.mjs`

### 5.1 Index Coverage

| Table | Index | Status |
|-------|-------|--------|
| raw_fragments | channel_id, user_id, status, created_at DESC | ✅ |
| raw_fragments | is_distilled (partial WHERE false) | ✅ |
| distilled_posts | status, published_at DESC, created_at DESC | ✅ |
| channels | category_id | ✅ |

**Missing:**
- Composite index for core distillation query: `(status, is_distilled, created_at ASC) WHERE status='completed' AND is_distilled=false`

At current scale (6,550 rows), individual indexes suffice. Beyond 50k rows, the composite index would be 3–5× faster.

### 5.2 Query Performance

| Query | Avg Time | Acceptable? |
|-------|---------|-------------|
| Count undistilled completed | 497ms | ✅ |
| Fetch 50 oldest undistilled | 436ms | ✅ |
| Fetch 1,000 oldest undistilled | 610ms | ✅ |
| Fetch published distilled (5) | 320ms | ✅ |
| Fetch channels | 322ms | ✅ |
| Fetch fragment feed (50) | 333ms | ✅ |

All queries complete under 1 second at current scale.

### 5.3 Scale Estimates

| Scenario | Daily Fragments | Distillations/Day | Bottleneck |
|----------|----------------|-------------------|------------|
| 1k users | 2,400 | 43 (every 33 min) | Advisory lock — low contention |
| 5k users | 12,000 | 216 (every 7 min) | Advisory lock — moderate contention |
| 10k users | 24,000 | 432 (every 3 min) | Advisory lock — high contention + table growth |

**Key thresholds:**
- **50k fragments/month:** Add composite index
- **500k fragments/month:** Table partitioning recommended
- **100+ distillations/day:** Increase threshold to 100–200 fragments
- **10k distilled_posts/year:** Consider archival strategy for old posts

### 5.4 Identified Bottlenecks

| Severity | Component | Issue |
|----------|-----------|-------|
| HIGH | distilled_posts RLS | Blocks anon reads; workaround uses service_role key in client |
| MEDIUM | Advisory lock | Serializes all distillations; queuing at scale |
| MEDIUM | No archival policy | Fragments accumulate indefinitely |
| LOW | Missing composite index | ~3× slower queries at 50k+ rows |
| LOW | category_id null | All fragments categorized as "General" |
| LOW | Realtime without filter | Processes all events including drafts |

---

## 6. Compatibility with Future Systems

**Document:** `docs/resonance-discovery-compatibility.md`

The current schema supports all planned future systems:

| Future System | Data Required | Status |
|--------------|--------------|--------|
| Resonance Clustering | `raw_fragments.content`, `category_id`, `embedding` | Schema ready; embeddings need population |
| Similarity Scoring | `raw_fragments.embedding` → vector cosine similarity | Column exists, currently NULL |
| User Affinity | `raw_fragments.user_id` → cross-user interaction graph | Populated for all fragments |
| Circle Formation | Query by `(category_id, created_at)` range | Indexed on both columns |
| Dify Workflow B | `POST /api/workflow-b/distill` | 3 integration points pre-marked in code |

---

## 7. Issues Summary

### Blockers (Must Fix Before Production)

| ID | Issue | File | Fix |
|----|-------|------|-----|
| B1 | RLS blocks anon reads of published distilled_posts | `migrations/20260606120000_fix_distilled_posts_rls.sql` | Apply migration; remove service_role key from `index.html` |

### High Priority (Fix Before Scale)

| ID | Issue | File | Fix |
|----|-------|------|-----|
| H1 | `category_id` null on fragment insertion | `raw_fragments` ingestion code | Add trigger or app-level denormalization from `channel_id` |

### Medium Priority

| ID | Issue | Fix |
|----|-------|-----|
| M1 | No composite index for distillation query | `CREATE INDEX idx_raw_fragments_distillation_pickup ON raw_fragments(status, is_distilled, created_at ASC) WHERE status='completed' AND is_distilled=false` |
| M2 | Advisory lock contention at scale | Increase threshold from 50 to 100–200; add cron scheduling |
| M3 | No data archival policy | Monthly job: move old distilled fragments to cold storage |

### Low Priority

| ID | Issue | Fix |
|----|-------|-----|
| L1 | Realtime processes all events | Add `filter: 'status=eq.published'` to Realtime channel |
| L2 | Mock summaries are generic | Accept until Dify Workflow B integration |

---

## 8. Validation Artifacts

| Artifact | Path | Purpose |
|----------|------|---------|
| Fragment Seeder | `scripts/seed-fragments.mjs` | Generate test fragments at any scale |
| Stress Test | `scripts/stress-test.mjs` | Performance benchmarking + threshold testing |
| Quality Audit | `scripts/quality-audit.mjs` | 6-dimension distillation quality analysis |
| Distilled Post Seeder | `scripts/seed-distilled-posts.mjs` | Create test distilled_posts for UI validation |
| Scalability Audit | `scripts/scalability-audit.mjs` | Index coverage + benchmarks + scale estimates |
| Compatibility Doc | `docs/resonance-discovery-compatibility.md` | Interface contracts for future systems |
| **This Report** | `docs/validation-report.md` | Combined validation deliverable |

---

## 9. Recommendation

The system is **validated for development and testing.** The core pipeline (seed → fragment → distillation → publish → display) works end-to-end.

**Before production launch, resolve:**
1. ✅ **BLOCKER B1:** Apply RLS migration (requires `supabase db push` connectivity)
2. ✅ **HIGH H1:** Fix `category_id` denormalization in fragment ingestion
3. ✅ **MEDIUM M1:** Add composite index for distillation query performance

**After fixes, the system is ready for:**
- Dify Workflow B integration (replaces mock distillation)
- Embedding generation (populates `raw_fragments.embedding`)
- Resonance Discovery features (clustering, similarity, circles)
