# Dify Integration Readiness Audit

> Phase 3E — Priority 4
> Date: 2026-06-07
> Scope: Audit only. No Dify coding.

---

## 1. Architecture Overview

Two Dify workflows are planned:

```
User Fragment
     │
     ▼
┌──────────────────────────────────────────────────┐
│  Workflow A — Fragment Classification            │
│  Input:  fragment content + metadata             │
│  Output: category_id, fragment_type, tags,       │
│          embedding (1536-dim)                    │
│  Trigger: per-fragment, on submission            │
│  Callback: POST /functions/v1/dify-callback      │
└──────────────────────┬───────────────────────────┘
                       │
                       ▼
              raw_fragments (updated)
                       │
                  [accumulate 50]
                       │
                       ▼
┌──────────────────────────────────────────────────┐
│  Workflow B — Distillation                       │
│  Input:  batch of 50 fragments                    │
│  Output: title, content, summary,                 │
│          source_fragment_ids                      │
│  Trigger: threshold-based (cron / manual)         │
│  Result: INSERT into distilled_posts              │
└──────────────────────────────────────────────────┘
```

---

## 2. Workflow A Contract

### 2.1 Workflow A — Expected Input (to Dify)

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `fragment_id` | UUID | `raw_fragments.id` | Required |
| `content` | text | `raw_fragments.content` | Required |
| `user_id` | UUID | `raw_fragments.user_id` | Optional — for personalization |
| `channel_id` | UUID | `raw_fragments.channel_id` | Optional — hints category |
| `source_type` | enum | fragment, short_article, etc. | Optional — hints processing mode |

### 2.2 Workflow A — Expected Output (via Dify callback)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `fragment_id` | UUID | Yes | Matches insert |
| `category_id` | UUID | No | Mapped from Dify classification |
| `fragment_type` | string | No | `fragment`, `extended_fragment`, `reflection` |
| `embedding` | float[] | No | 1536-dim pgvector |
| `tags` | string[] | No | For future filtering |
| `status` | "completed" \| "failed" | No | Defaults to "completed" |
| `error` | string | If failed | Required when status=failed |

### 2.3 Current State — Workflow A

**✅ Implemented — `dify-callback` Edge Function**
- File: `supabase/functions/dify-callback/index.ts`
- Method: POST
- Auth: `x-webhook-secret` header vs `DIFY_WEBHOOK_SECRET` env var
- Validation: fragment_id required, error message required on failure
- Update: writes category_id, fragment_type, tags, embedding to `raw_fragments`
- Status: **Ready for production use** — no code changes needed

**❌ Gap — No caller**
- No Dify instance is configured to POST to `/functions/v1/dify-callback`
- No `DIFY_WEBHOOK_SECRET` env var has been set in Supabase
- No `DIFY_API_KEY` or `DIFY_BASE_URL` environment variables exist

**❌ Gap — submit-fragment Edge Function does not invoke Dify**
- `submit-fragment/index.ts` inserts fragment as `status: "pending"` then returns
- Missing step: after insert, call Dify Workflow A API with fragment content
- The mock (`difyProcessor.js`) handles this client-side instead

**❌ Gap — Frontend bypasses Edge Function**
- `FragmentComposer.jsx` does `supabase.from('raw_fragments').insert()` directly
- Never calls `submit-fragment` Edge Function
- This means: no server-side auth validation, no server-side Dify trigger path
- `index.html` has a `submitFragmentViaEdge()` function but it's not used by the Vite app

**⚠️ Mock — `difyProcessor.js`**
- Simulates 2s delay, assigns random category from weighted pool
- Updates `raw_fragments` directly via client-side supabase
- Random assignment (not AI classification) — cannot test real categorization
- Tags and embedding are hardcoded to null

---

## 3. Workflow B Contract

### 3.1 Workflow B — Expected Input (to Dify)

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `fragments` | array | `raw_fragments` query | Top 50 oldest undistilled completed |
| `fragments[].id` | UUID | `raw_fragments.id` | |
| `fragments[].content` | text | `raw_fragments.content` | Truncated to token limit? |
| `fragments[].category_id` | UUID | `raw_fragments.category_id` | For context |
| `fragments[].user_id` | UUID | `raw_fragments.user_id` | For contributor counting |

### 3.2 Workflow B — Expected Output

| Field | Type | Notes |
|-------|------|-------|
| `title` | string | Generated title for distilled post |
| `content` | text | Full markdown content |
| `summary` | string | Short summary / excerpt |
| `source_fragment_ids` | UUID[] | Matches input batch |

### 3.3 Current State — Workflow B

**✅ Integration markers in place**
- `masterAgentProcessor.js` has 3 marked integration points (lines 25, 121, 144)
- `useWorkflowB(enabled)` toggle ready
- Return contract explicitly documented and matches `distilled_posts` columns
- `generateDistilledPost()` public API dispatches to mock or (future) Dify Workflow B

**✅ Composite index optimized for batch query**
- Index `idx_raw_fragments_distillation_pickup` on `(status, is_distilled, created_at ASC)`
- Benchmark: 365ms vs 436ms baseline (16% faster)

**❌ Gap — No Dify Workflow B workflow**
- Mock does simple aggregation: category voting + concatenated excerpts
- Real Dify Workflow B would need: summarization, title generation, thematic synthesis
- No Dify workflow has been designed or created

**❌ Gap — No Dify API integration**
- `callDifyWorkflowB()` function does not exist
- No `DIFY_API_KEY`, `DIFY_WORKFLOW_B_ID`, `DIFY_BASE_URL` env vars
- No HTTP client code for calling Dify's workflow execution API

---

## 4. Callback Payload Contract

Defined by `dify-callback/index.ts`:

```typescript
interface CallbackBody {
  fragment_id: string;      // UUID, required
  category_id?: string;     // UUID
  fragment_type?: string;   // "fragment" | "extended_fragment" | "reflection"
  embedding?: number[];     // 1536-dim vector for pgvector
  tags?: string[];          // classification tags
  status?: "completed" | "failed";  // defaults to "completed"
  error?: string;           // required if status === "failed"
}
```

**Contract is stable** — field names, types, and validation are finalized.

---

## 5. Remaining Implementation Gaps

### Gap 1: Dify Instance Setup (BLOCKER)

| Item | Status | Notes |
|------|--------|-------|
| Dify instance deployed | ❌ Not started | Self-host or Dify Cloud? |
| Dify API key generated | ❌ Not started | `DIFY_API_KEY` |
| Dify base URL configured | ❌ Not started | `DIFY_BASE_URL` |
| Webhook secret generated | ❌ Not started | `DIFY_WEBHOOK_SECRET` |
| Supabase env vars set | ❌ Not started | Must configure via `supabase secrets set` |

**Recommendation**: Self-host Dify on the same VPS or use Dify Cloud. Self-hosting gives control over workflow design iteration. Dify Cloud is faster to start. Either way, generate API key and webhook secret first.

### Gap 2: Workflow A — Real Classification Workflow

| Item | Status | Notes |
|------|--------|-------|
| Dify workflow A created | ❌ Not started | Text classification workflow |
| Category mapping configured | ❌ Not started | Map Dify labels to `categories` UUIDs |
| Embedding model configured | ❌ Not started | text-embedding-3-small or similar |
| Webhook target set | ❌ Not started | Point to `dify-callback` Edge Function URL |

**Dify Workflow A design sketch**:
1. Input node: `fragment_id`, `content`, `channel_id`
2. LLM node: classify into categories (prompt with category definitions)
3. LLM node: determine fragment_type
4. Code node: format callback payload
5. HTTP request node: POST to `/functions/v1/dify-callback`

### Gap 3: Workflow B — Real Distillation Workflow

| Item | Status | Notes |
|------|--------|-------|
| Dify workflow B created | ❌ Not started | Summarization/generation workflow |
| Batch input format designed | ❌ Not started | 50 fragments may exceed token limits |
| Title generation designed | ❌ Not started | Thematic title from batch |
| Content generation designed | ❌ Not started | Synthesis vs concatenation strategy |

**Dify Workflow B design sketch**:
1. Input node: `fragments[]` array
2. Code node: truncate/summarize fragments to fit context window
3. LLM node: analyze themes, find common thread
4. LLM node: generate title
5. LLM node: write distilled content
6. Output node: `{ title, content, summary, source_fragment_ids }`

**Token budget concern**: 50 fragments × ~200 words avg = ~10,000 words ≈ ~13,000 tokens. This likely exceeds Dify's context window for a single LLM call. Strategy: pre-summarize or batch in sub-groups.

### Gap 4: Frontend → Edge Function Connection

| Item | Status | Notes |
|------|--------|-------|
| FragmentComposer uses submit-fragment | ❌ Uses direct insert | Must switch to `supabase.functions.invoke('submit-fragment')` |
| submit-fragment calls Dify after insert | ❌ Just returns | Must add HTTP call to Dify Workflow A |
| Error handling for Dify failure | ❌ Not designed | Current: client-side. Future: async with retry |

**Two approaches**:
- **Option A (recommended)**: Make `FragmentComposer.jsx` call `submit-fragment` Edge Function. Then add Dify API call to the Edge Function. Dify calls back asynchronously. Frontend polls or uses Realtime.
- **Option B**: Keep client-side submission but add a separate backend worker that polls for `status: "pending"` fragments and sends them to Dify. More complex but decouples UI from processing.

### Gap 5: Embedding Pipeline

| Item | Status | Notes |
|------|--------|-------|
| pgvector extension enabled | ✅ Done | Already configured |
| `raw_fragments.embedding` column | ✅ Exists | `vector(1536)` |
| Embedding generation in Dify | ❌ Not configured | Must add to Workflow A |
| Similarity search queries | ❌ Not implemented | No code uses embeddings yet |

Embedding is the foundation for future Resonance Discovery features. Without it, cross-fragment similarity is limited to keyword overlap.

### Gap 6: Monitoring & Error Recovery

| Item | Status | Notes |
|------|--------|-------|
| Dify callback failure handling | ❌ Not designed | What if callback never arrives? |
| Retry logic for Dify API calls | ❌ Not implemented | Transient failures should retry |
| Dead letter queue for stuck fragments | ❌ Not designed | Fragments stuck in "pending" forever |
| Logging/monitoring for Dify calls | ❌ Not designed | Need visibility into classification pipeline |

---

## 6. File-by-File Audit

### `src/lib/difyProcessor.js`
- **Purpose**: Mock Dify Workflow A
- **Status**: ✅ Good mock, proper contract comments
- **Action on go-live**: Replace body of `processFragment()` with `callDifyWorkflowA(fragmentId)` — or keep as fallback

### `src/lib/fragmentProcessor.js`
- **Purpose**: Abstraction layer between UI and DifyProcessor
- **Status**: ✅ Ready. `useMockFallback()` toggle works
- **Action on go-live**: No changes needed. Flip `_useMockFallback` when ready.

### `src/lib/masterAgentProcessor.js`
- **Purpose**: Distillation pipeline with mock + Dify Workflow B placeholder
- **Status**: ✅ Excellent contract documentation, 3 integration markers
- **Action on go-live**: Implement `difyWorkflowBDistill()`, flip `_useWorkflowB`

### `supabase/functions/submit-fragment/index.ts`
- **Purpose**: Edge Function for fragment submission
- **Status**: ⚠️ Needs Dify call added after insert
- **Action on go-live**: Add `await callDifyWorkflowA(fragmentId)` after successful insert

### `supabase/functions/dify-callback/index.ts`
- **Purpose**: Webhook receiver for Dify Workflow A results
- **Status**: ✅ Production-ready. No changes needed.
- **Note**: Already handles both success and failure paths

### `src/components/harmony/FragmentComposer.jsx`
- **Purpose**: Fragment submission UI
- **Status**: ⚠️ Bypasses Edge Function, does direct insert
- **Action on go-live**: Replace direct supabase insert with `supabase.functions.invoke('submit-fragment')`

### `src/pages/HarmonyResonance.jsx`
- **Purpose**: Fragment feed + submission orchestrator
- **Status**: ⚠️ Calls `processFragment()` client-side after submission
- **Action on go-live**: Remove `processFragment()` call — Dify will handle asynchronously via callback

---

## 7. Integration Sequence (Recommended)

```
Phase 1 — Foundation (current state is here)
  ├─ ✅ Dify callback Edge Function deployed
  ├─ ✅ Composite index for batch query
  ├─ ✅ Mock processors working end-to-end
  └─ ⬜ Dify instance deployed (new)

Phase 2 — Dify Setup
  ├─ Deploy Dify instance (self-host or cloud)
  ├─ Generate API key + webhook secret
  ├─ Set Supabase secrets: DIFY_API_KEY, DIFY_BASE_URL, DIFY_WEBHOOK_SECRET, DIFY_WORKFLOW_A_ID
  └─ Create Dify Workflow A (classification)

Phase 3 — Wire Workflow A
  ├─ Switch FragmentComposer to submit-fragment Edge Function
  ├─ Add Dify API call to submit-fragment after insert
  ├─ Test: submit fragment → Dify classifies → callback updates raw_fragments
  └─ Remove client-side processFragment() call

Phase 4 — Wire Workflow B
  ├─ Create Dify Workflow B (distillation)
  ├─ Implement callDifyWorkflowB() in masterAgentProcessor
  ├─ Test: 50 fragments → Dify distills → distilled_posts created
  └─ Remove mockDistill(), keep as fallback

Phase 5 — Embeddings & Discovery
  ├─ Add embedding generation to Dify Workflow A
  ├─ Test pgvector similarity search
  └─ Wire into UI (future Resonance Discovery feature)
```

---

## 8. Summary

| Area | Readiness | Action Required |
|------|-----------|----------------|
| Dify callback endpoint | ✅ Ready | Set `DIFY_WEBHOOK_SECRET` env var |
| Dify instance | ❌ Not started | Deploy Dify (self-host or cloud) |
| Workflow A (classification) | ❌ Not started | Create in Dify, configure webhook |
| Workflow B (distillation) | ❌ Not started | Create in Dify, design token strategy |
| submit-fragment connector | ⚠️ Partial | Add Dify API call after insert |
| Frontend → Edge Function | ❌ Bypassed | Switch FragmentComposer to invoke |
| Embedding pipeline | ❌ Not started | Add to Workflow A, test pgvector |
| Monitoring & retry | ❌ Not designed | Plan dead-letter and retry logic |
| Mock processors | ✅ Works | Keep as fallback for development |

**Estimated effort to go-live**: 3-5 days for a single developer familiar with Dify.
