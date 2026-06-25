# Resonance Discovery — Compatibility Document

> **Phase:** Future (post-validation)
> **Purpose:** Document the current system's data outputs that future Resonance Discovery, Resonance Circle, Sub-Agent social interaction, Recommendation, and Matching systems will consume.
> **Rule:** No code — specification only.

---

## 1. Data Schema Reference

### 1.1 `raw_fragments` — Data Source

```sql
CREATE TABLE raw_fragments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id),
  content     TEXT NOT NULL,
  channel_id  UUID NOT NULL REFERENCES channels(id),
  source_type TEXT NOT NULL DEFAULT 'fragment'
    CHECK (source_type IN ('fragment','short_article','long_article','image','youtube_link')),
  media_url   TEXT DEFAULT NULL,
  category_id UUID REFERENCES categories(id),
  fragment_type TEXT DEFAULT NULL
    CHECK (fragment_type IN ('fragment','extended_fragment','reflection')),
  embedding   extensions.vector(1536) DEFAULT NULL,
  tags        JSONB DEFAULT NULL,
  status      TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','completed','failed')),
  is_distilled BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Key consumption columns for future systems:**

| Column | Used For | Notes |
|--------|----------|-------|
| `content` | Embedding generation, similarity scoring, clustering | Already exists in all 6550 test fragments |
| `embedding` | Vector similarity search | Column exists but NULL in all current data |
| `category_id` | Coarse grouping, cluster label | Currently NULL for all seeded data — needs denormalization fix |
| `channel_id` | Fine-grained topic grouping | Populated for all fragments |
| `user_id` | Contributor attribution, user affinity | Populated for all fragments |
| `tags` | Metadata for filtering, facet extraction | Currently NULL — Dify processing would populate this |
| `created_at` | Time-series clustering, recency weighting | Populated for all fragments (90-day range in test data) |
| `is_distilled` | Exclude already-distilled from future batches | Available after Phase 3A migration |
| `source_type` | Content-type weighting (fragment vs article vs image) | Populated for all fragments |

### 1.2 `distilled_posts` — Clustering Output

```sql
CREATE TABLE distilled_posts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT NOT NULL,
  content             TEXT NOT NULL,
  summary             TEXT,
  source_fragment_ids UUID[] NOT NULL,
  contributor_count   INTEGER NOT NULL DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','published','archived')),
  published_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Key consumption columns:**

| Column | Used For | Notes |
|--------|----------|-------|
| `source_fragment_ids` | Ground-truth cluster membership | Array of UUIDs — enables overlap analysis |
| `contributor_count` | Community engagement metric | Used for resonance scoring |
| `title` / `summary` | Cluster label for UX | Currently generic (mock) — Dify will improve |
| `status` | Distillation lifecycle | 'published' posts visible to users |
| `published_at` | Recency ordering | Current frontend orders by this DESC |

### 1.3 `master_agent_runs` — Processing Audit Trail

```sql
CREATE TABLE master_agent_runs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status            TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running','completed','failed')),
  started_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at      TIMESTAMPTZ,
  fragment_count    INTEGER,
  distilled_post_id UUID REFERENCES distilled_posts(id),
  error_message     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Key consumption columns:**

| Column | Used For | Notes |
|--------|----------|-------|
| `fragment_count` | Throughput monitoring | Confirms batch size at each run |
| `distilled_post_id` | Links run to output | Enables traceability |
| `status` / `error_message` | Pipeline health monitoring | Alerts on failures |

---

## 2. Interface Contracts for Future Systems

### 2.1 Clustering Input

The current system groups fragments by **category vote** (plurality of categories in a batch). Future clustering systems should consume:

```
Input:  fragment[] where each fragment has { id, content, embedding?, category_id, channel_id, created_at, user_id }
Output: cluster[] where each cluster has { id, fragment_ids, dominant_topic, confidence, member_count }
```

**Integration point**: Replace `findDominantCategory()` in `masterAgentProcessor.js` with a clustering call.

### 2.2 Similarity Scoring Input

```
Input:  (fragment_a, fragment_b) → { content_a, content_b, category_ids, channel_ids, timestamps }
Output: similarity_score float [0, 1]
```

**Planned approaches** (in order of complexity):
1. **Category overlap**: `score = 1.0 if same category, else 0.5 if same channel` (current mock)
2. **Embedding cosine similarity**: `score = 1 - cosine_distance(embedding_a, embedding_b)` (requires embedding column populated)
3. **Hybrid**: Weighted combination of category overlap + embedding similarity + temporal proximity

### 2.3 User Affinity Input

```
Input:  activities[] where each activity has { user_id, fragment_id, channel_id, category_id, created_at }
Output: affinity_matrix where matrix[i][j] = interaction_frequency(user_i, user_j)
```

**Consumed from**: `raw_fragments.user_id` + presence in same distillation batch.

### 2.4 Resonance Circle Formation Input

```
Input:  candidates[] where each candidate has { user_id, fragment_ids[], category_distribution{}, recent_activity_timestamp }
Output: circle[] where each circle has { member_ids[], theme, min_affinity_score }
```

**Requirements from current system:**
- Must be able to query fragments by `(category_id, created_at)` range
- Must be able to check which fragments are NOT yet distilled (`is_distilled = false`)
- Must be able to identify users active in overlapping categories

---

## 3. Future Integration Points (Code Markers)

The codebase has 3 pre-marked integration points in `src/lib/masterAgentProcessor.js`:

| # | Location | Purpose |
|---|----------|---------|
| 1 | `useWorkflowB(enabled)` toggle (line 28) | Switches between mock and Dify Workflow B |
| 2 | `mockDistill()` body replacement (line 121) | Replace entire function with clustering pipeline |
| 3 | `difyWorkflowBDistill()` placeholder (line 150) | Uncomment and implement when Dify is configured |

---

## 4. Data Quality Prerequisites

Before any Resonance Discovery system can produce meaningful results, these data quality issues must be resolved:

| Priority | Issue | Blocking |
|----------|-------|----------|
| **P0** | `category_id` must be populated during fragment insertion | Without this, all fragments cluster as "General" |
| **P1** | `embedding` vector must be generated for fragment content | Required for similarity scoring, semantic search |
| **P2** | `tags` JSONB should be populated (from Dify or LLM extraction) | Enables facet-based filtering and topic discovery |
| **P3** | Fragment ingestion pipeline must set `category_id` from `channel_id` | Application-level fix (not database) |

---

## 5. Schema Migration Requirements for Future Systems

No database schema changes required. Future systems can work with the existing schema by:

1. **Populating existing columns** that are currently NULL (`embedding`, `tags`)
2. **Querying existing indexes** (all target columns are already indexed)
3. **Adding new columns** only for features not yet designed (e.g., `view_count`, `resonance_score`)

The `distilled_posts` table is designed as the **output side** of the pipeline. Future systems should:
- **Consume**: `distilled_posts` rows (read-only)
- **Produce**: Updates to `distilled_posts.status` (e.g., promote draft → published)
- **Analyze**: `master_agent_runs` for pipeline health and throughput

---

## 6. API Contract for Dify Workflow B

When Dify Workflow B replaces the mock:

```
POST /api/workflow-b/distill
Body: {
  fragments: [
    {
      id: "uuid",
      content: "string",
      category_id: "uuid|null",
      channel_id: "uuid",
      source_type: "fragment|short_article|long_article",
      embedding: [1536 floats] | null,
      tags: { ... } | null
    }
  ]
}
Response: {
  title: "string",
  content: "string",
  summary: "string",
  source_fragment_ids: ["uuid", ...],
  quality_score: float
}
```

The current mock output maps 1:1 to this contract, ensuring drop-in compatibility.
