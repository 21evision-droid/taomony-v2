# Embedding Architecture Specification

## Overview

Replace the current SHA-256 hash placeholder with real semantic embeddings
using OpenAI `text-embedding-3-small`. This document is an
implementation-ready specification — no API calls, no credentials required.

---

## Embedding Flow

```
Fragment submitted
  ↓
raw_fragments.insert
  (source_type, content, media_url, channel_id set by user)
  ↓
trigger-workflow-a Edge Function
  (fetches fragment, POSTs to Dify)
  ↓
Workflow A (Dify)
  │
  ├── Node 2: LLM Classify (category)
  ├── Node 3: Code Map (category → UUID)
  ├── Node 4: LLM Fragment Type (canonical)
  │
  ├── Node 5: EMBEDDING GENERATION ★ REPLACED ★
  │   ┌─────────────────────────────────────────────┐
  │   │  Input: category_slug + fragment_type +     │
  │   │         content[:2048]                       │
  │   │  Process: text-embedding-3-small API call    │
  │   │  Output: 1536-dim float array                │
  │   └─────────────────────────────────────────────┘
  │
  └── Node 6: HTTP Callback (fragment_id, category_id,
              fragment_type, embedding, tags, status)
  ↓
dify-callback Edge Function
  ↓
raw_fragments.update
  (embedding column populated with real 1536-dim vector)
  ↓
pgvector index (HNSW) enables semantic search
```

---

## Model Selection

| Property | Value |
|----------|-------|
| **Model** | `text-embedding-3-small` |
| **Provider** | OpenAI |
| **Dimensions** | 1536 |
| **Max input tokens** | 8191 |
| **Cost per 1M tokens** | $0.020 |
| **Cost per 1K fragments*** | ~$0.001 |
| **Relative quality** | Strong — best cost/quality ratio |

*At ~50 tokens per average fragment (200 chars).

Why `text-embedding-3-small` over `text-embedding-3-large`:

| Criterion | small | large |
|-----------|:-----:|:-----:|
| Cost per 1M tokens | $0.020 | $0.130 |
| Dimensions (params) | 1536 | 3072 |
| MTEB score | 62.3% | 64.6% |
| Retrieval average | 53.0% | 55.4% |

The small model is 6.5× cheaper with only 2-3% quality difference —
appropriate for community content where sub-millimeter retrieval precision
is unnecessary.

---

## Vector Dimension

### Fixed: 1536

The `raw_fragments` schema already declares:
```sql
embedding extensions.vector(1536)
```

`text-embedding-3-small` natively outputs 1536 dimensions. The `dimensions`
API parameter can reduce this (e.g., 256, 512) for lower storage cost at the
expense of some accuracy.

**Recommendation: Use full 1536 dimensions.** The `extensions.vector(1536)`
column is already created. Storage cost is:

| Fragments | Raw size (1536 × float4) | With HNSW index overhead |
|-----------|--------------------------|--------------------------|
| 10,000 | ~60 MB | ~120 MB |
| 100,000 | ~600 MB | ~1.2 GB |
| 1,000,000 | ~6 GB | ~12 GB |

At the current rate (~5,600 fragments), storage cost is negligible.

---

## Storage Strategy

### Column (already exists)

```sql
embedding extensions.vector(1536) DEFAULT NULL
```

The column is nullable because:
- Early fragments (before embedding goes live) will have NULL embeddings
- Failed fragments (`status = 'failed'`) have no embedding
- Migration: fragments with NULL embedding are simply excluded from semantic
  search

### Indexing — Required after embeddings are populated

Two options for vector search indexing:

#### Option A: HNSW (Recommended)

```sql
CREATE INDEX idx_raw_fragments_embedding_hnsw
  ON raw_fragments
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 200);
```

| Property | Value |
|----------|-------|
| **Build time** | Slower (hours for 1M rows) |
| **Query speed** | Faster (sub-10ms at 100K rows) |
| **Accuracy** | Higher (99%+ recall with ef_search=200) |
| **Mutability** | Supports INSERT without rebuild |
| **Disk usage** | Higher (~2× raw vector size) |

#### Option B: IVFFlat

```sql
CREATE INDEX idx_raw_fragments_embedding_ivfflat
  ON raw_fragments
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

| Property | Value |
|----------|-------|
| **Build time** | Faster (minutes) |
| **Query speed** | Fast, degrades at high lists |
| **Accuracy** | Lower (~90-95% recall) |
| **Mutability** | Requires periodic rebuild as data grows |
| **Disk usage** | Lower (~1.2× raw vector size) |

**Recommendation: HNSW.** It is the modern standard, handles INSERTs
gracefully, and the extra disk space at 5K-100K fragments is irrelevant.

### Index Creation Sequence

1. Populate embeddings for all existing completed fragments
2. Create HNSW index
3. Verify query performance
4. Set up periodic `REINDEX` (monthly, or after every 50K new fragments)

### Backfilling Existing Fragments

For the ~5,600 existing fragments with NULL embedding:

```sql
-- Select fragments that need embeddings
SELECT id, content, category_id, fragment_type
FROM raw_fragments
WHERE status = 'completed'
  AND embedding IS NULL;
```

Backfill via a batch script that:
1. Reads fragments in batches of 20
2. Calls `text-embedding-3-small` API
3. Updates rows

Estimated cost: ~5,600 fragments × 50 tokens = ~280K tokens = **$0.0056**.

---

## Dify Node Configuration

### Approach A: HTTP Request Node to OpenAI (Recommended for Self-Hosted)

Replace the current `code-embedding` Python node (Node 5) with an HTTP Request
node.

**Node configuration:**

| Field | Value |
|-------|-------|
| **Type** | `http_request` |
| **Method** | `POST` |
| **URL** | `https://api.openai.com/v1/embeddings` |
| **Authorization** | API Key (Bearer token) |
| **API Key** | `{{#env.OPENAI_API_KEY#}}` (set in Dify environment variables) |
| **Headers** | `Content-Type: application/json` |
| **Timeout** | 15000 ms |

**Request body:**

```json
{
  "model": "text-embedding-3-small",
  "input": "{{#code-map-category.category_slug#}}: {{#start.content#}}",
  "dimensions": 1536
}
```

**Response parsing:**

```json
{
  "embedding": "{{#result.data[0].embedding#}}"
}
```

**Edge cases:**
- If `content` exceeds 8191 tokens (~25K chars): truncate to 2048 chars in
  the input, which is ~500 tokens — well within limits.
- If the API call fails: log error in callback body with `status = "failed"`
  and `error = "embedding_failed"`. Do not block the rest of the workflow —
  the fragment can still be categorized and typed without an embedding.

**Fallback behavior in callback:**

When `embedding` is not present in the callback (API failure), the Edge
Function should still update the fragment with `status = "completed"` but
leave `embedding = NULL`. A reconciliation job can retry embeddings later.

### Approach B: Dify Native Embedding Node

If Dify's plugin system supports a native embedding node (depends on
installed plugins):

| Field | Value |
|-------|-------|
| **Node type** | `embedding` (if available) |
| **Model** | `text-embedding-3-small` |
| **Input** | `{{#code-map-category.category_slug#}}: {{#start.content#}}` |
| **Dimensions** | 1536 |
| **Credentials** | Inherited from OpenAI provider setup |

**Priority:** Approach A is more portable and works with any Dify version.
Approach B is cleaner but depends on plugin availability.

---

## Input Text Construction

The embedding input should be a structured string that combines category
context with content:

```
{category_slug}: {content}
```

Examples:
```
learning: Today I was reading about the concept of wu wei in Dao De Jing...
meditate: Sat for 20 minutes this morning focusing on the breath...
```

**Why prepend the category slug?**
- Improves retrieval accuracy for category-scoped queries
- "Find fragments related to meditation" → query with `meditate:` prefix
  naturally aligns with stored embeddings
- Cost increase: ~10 extra tokens per fragment, negligible

**Truncation:**
- If content exceeds 2048 characters, truncate to 2048
- This is ~500 tokens, well within the 8191 token model limit
- If you need longer context, increase to 8192 chars (~2000 tokens)
- Current max_length in Dify start node is 10000 chars, so 2048 is safe

---

## Cost Estimate

### Per-Fragment Cost

| Item | Cost |
|-----|------|
| Input tokens per fragment | ~60 (50 chars content + 10 slug prefix) |
| Cost per 1K tokens | $0.020 |
| Cost per fragment | $0.0000012 |
| Cost per 1,000 fragments | $0.0012 |
| Cost per 10,000 fragments | $0.012 |
| Cost per 100,000 fragments | $0.12 |
| Cost per 1,000,000 fragments | $1.20 |

### Comparison with Current (Placeholder)

| Metric | Current (SHA-256) | Real (text-embedding-3-small) |
|--------|:-:|:-:|
| Cost per fragment | $0.00 | $0.0000012 |
| Semantic search | ✗ Impossible | ✅ Enabled |
| Similarity accuracy | Random (~50%) | ~99th percentile |
| Storage | 128 floats | 1536 floats |
| DB column format | `vector(128)` (mismatched) | `vector(1536)` (correct) |

The cost is so low ($0.001 per 1K fragments) that it is effectively
negligible. For a typical month with 10K fragments, the embedding cost is
**$0.012** — less than a penny.

### Tag Generation (Optional)

If implemented alongside embeddings, tags via LLM add more cost:

| Item | Cost |
|-----|------|
| Tag generation (gpt-4o-mini) | ~$0.0003 per fragment |
| Tag generation for 10K fragments | ~$3.00 |

This is a separate concern. Tags are not required for semantic search.

---

## Migration Requirements

### Schema (already done)

```sql
-- Already exists from Phase 0:
embedding extensions.vector(1536) DEFAULT NULL
```

### Index (to be created after embeddings populated)

```sql
CREATE INDEX idx_raw_fragments_embedding_hnsw
  ON raw_fragments
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 200);
```

### Dify Changes

| Change | Node | Details |
|--------|------|---------|
| Replace code node | 5 — Prepare Embedding | HTTP Request → OpenAI embeddings API |
| Add env variable | Dify Workflow A env | `OPENAI_API_KEY` (reuse from shared.env) |
| Remove placeholder code | 5 | Delete SHA-256 Python code |

### Application Changes (Future)

Once embeddings are populated:

```sql
-- Semantic search query
SELECT id, content, category_id,
       1 - (embedding <=> query_embedding) AS similarity
FROM raw_fragments
WHERE status = 'completed'
  AND embedding IS NOT NULL
ORDER BY embedding <=> query_embedding
LIMIT 20;
```

No code changes to the application are needed until semantic search features
are implemented. The embedding column is write-only for now.

---

## Verification

After implementation:

```
1. Submit a fragment via the normal pipeline
2. Verify that raw_fragments.embedding is no longer NULL
3. Check embedding dimension: SELECT length(embedding) FROM raw_fragments LIMIT 1;
   → Expected: 1536
4. Check embedding values: SELECT embedding[1:5] FROM raw_fragments LIMIT 1;
   → Expected: non-zero float values (not SHA-256 hashes)
5. Verify cosine similarity between similar fragments > 0.7
   SELECT f1.content, f2.content,
          1 - (f1.embedding <=> f2.embedding) AS similarity
   FROM raw_fragments f1, raw_fragments f2
   WHERE f1.id = '<fragment_a>' AND f2.id = '<fragment_b>'
     AND f1.embedding IS NOT NULL AND f2.embedding IS NOT NULL;
```
