# Workflow A — Fragment Classification Audit

## Overview

Workflow A classifies raw community fragments into Taomony's taxonomy,
determines fragment type, generates an embedding, and stores results via
callback. This audit reviews the current design for correctness, completeness,
and production readiness.

**Current pipeline:**
```
raw_fragments.insert
  → trigger-workflow-a Edge Function
    → Dify Workflow A
      1. LLM: classify category (5 slugs)
      2. Code: map slug → UUID
      3. LLM: determine fragment_type
      4. Code: generate embedding (placeholder)
      5. HTTP POST: callback to dify-callback Edge Function
         → raw_fragments.update
```

---

## A1. Fragment Classification Specification

### Current State

The classification LLM prompt (Node 2) asks the model to map content to one of
five category slugs. The fragment_type LLM (Node 4) classifies into three
types based solely on character count heuristics.

### Source Types (as defined in DB schema)

The `raw_fragments.source_type` column enforces:

| Source Type | Definition |
|-------------|-----------|
| `fragment` | A brief observation, insight, or daily moment |
| `short_article` | A moderately structured piece with some depth |
| `long_article` | A lengthy, structured composition |
| `image` | A photo, screenshot, or visual |
| `youtube_link` | A YouTube video URL |

**Issue:** Workflow A's fragment_type LLM output (`fragment`, `reflection`,
`extended_fragment`) duplicates the concept of `source_type` but uses a
different vocabulary. They serve the same purpose — describing the form of the
content.

### Recommended Classification Rules

The LLM should classify on **two independent axes**: **source form** (what it
is) and **category** (what it's about).

#### Axis 1: Source Form (derived from content + metadata)

| Form | Criteria | Example |
|------|----------|---------|
| `fragment` | < 300 chars, first-person, observational | "The morning light through bamboo..." |
| `short_article` | 300–2000 chars, structured thoughts | A reflection on a哲学 concept |
| `long_article` | > 2000 chars, multi-paragraph | A detailed personal essay |
| `image` | `source_type = "image"` or media_url present | A photo of a meditation setup |
| `youtube_link` | `source_type = "youtube_link"` or URL detected | A link to a dharma talk |

The current `reflection` / `extended_fragment` / `fragment` vocabulary should
be **replaced** with the DB-native `source_type` values to eliminate the
dual-vocabulary problem.

#### Axis 2: Category (semantic classification)

| Category | Content signals | Exclusion rules |
|----------|----------------|-----------------|
| `learning` | Book insights, study notes, intellectual growth, philosophy, psychology | Not: purely experiential or emotional content |
| `meditate` | Meditation experiences, mindfulness, breathing, inner stillness, sitting practice | Not: theoretical discussion about meditation |
| `eating` | Mindful eating, nutrition, food experiences, weight journey, meals | Not: abstract nutrition science without personal experience |
| `cultivation` | Personal growth, habit formation, discipline, gratitude, kindness, self-improvement | Not: content better categorized elsewhere |
| `governance` | Community policy, events, challenges, platform feedback, coordination | Not: social content without governance angle |
| `harmony` | Community resonance, collective wisdom, relationships, shared experiences | Not: individual experience without collective dimension |

### Edge Cases

| Case | Behavior |
|------|----------|
| **Ambiguous content** | Classify to the *more specific* category. A gratitude journal entry about eating → `cultivation`, not `eating`. |
| **Multi-topic content** | Classify by the dominant theme (> 60% weight). If no theme dominates, classify by the *first substantial topic*. |
| **Empty/meaningless content** | Return `{"category_slug": "", "fragment_type": "fragment"}` with status `failed`. Do not force a category. |
| **Non-English content** | Classify normally — the model handles multilingual input. The category system is language-agnostic. |
| **Image with no text caption** | Use `channel_id` as primary signal. If channel is unknown, mark `failed` with reason `"image_classification_requires_text_or_channel"`. |
| **YouTube link with no description** | Same as image — use channel signal or fail gracefully. |
| **Spam / low-effort content** | If content is < 10 chars and no media_url, mark as `failed` with reason `"insufficient_content"`. |

### Moderation Behavior

**Not implemented yet.** The current workflow has no moderation step. Recommended
future behavior:

1. **Pre-classification moderation check**: If content contains obvious spam,
   hate speech, or advertising, set `status = "failed"` with `error =
   "moderation_blocked"`.
2. **Confidence threshold**: If the LLM's confidence for the top category is
   very low (multi-category split), flag the fragment for manual review rather
   than guessing.

### Fallback Behavior

If either LLM node returns empty or nonsensical output:

| Scenario | Fallback |
|----------|----------|
| LLM returns empty category | Use default slug `"cultivation"` (the broadest category) |
| LLM returns invalid slug | Use default slug `"cultivation"` |
| Embedding node fails | Return empty embedding array — non-fatal |
| HTTP callback fails | Log to `workflow_events` with error details. Fragment remains in `processing` state — a reconciliation job should retry. |

---

## A2. Category Assignment Specification

### Complete Classification Matrix

Mapping from user intent/content → category → channels.

```
Input content/source_type
       │
       ▼
  ┌─────────────────────────────────────────────────────┐
  │              Workflow A — LLM Classify              │
  │  (semantic classification + content analysis)       │
  └─────────────────────────┬───────────────────────────┘
                            │
                            ▼
                    category_slug
                            │
                            ▼
              ┌─────────────────────────────┐
              │  Code: Map to UUID          │
              └─────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
      category_id      channels        fragment_type
```

### Full Category ↔ Channel Mapping

| Category (slug → UUID) | Channels | Example Content |
|------------------------|----------|----------------|
| **learning** `a000...001` | Tao Te Ching, Philosophy, Psychology, Nutrition | "In Dao De Jing Chapter 8, water teaches us..." |
| **meditate** `a000...002` | Daily Meditation, Breathing, Inner Alchemy | "Sat for 20 minutes watching the breath today..." |
| **taomony-eating** `a000...003` | Daily Weight, Meal Journal, Challenges | "Tried intermittent fasting this week..." |
| **cultivation** `a000...004` | Gratitude, Generosity, Accountability, Kindness | "Today I practiced generous listening..." |
| **governance** `a000...005` *(missing from LLM prompt!)* | Community Policy, Events, Challenge | "I propose a new community challenge..." |
| **harmony-resonance** `a000...006` | Member Resonances, Resonance Circle | "I felt a deep connection with everyone during the circle..." |

### Issues Found

1. **Governance category is missing** from Workflow A's LLM prompt and the code
   mapping node. The DB has 6 categories, but the LLM only knows about 5. Any
   governance-related content will be misclassified.

2. **Channel assignment is not done.** Workflow A receives `channel_id` as input
   but does not validate or update it. The LLM classifies into a *category* but
   never assigns a *channel*. Channel is only set at submission time by the
   user, and never refined by Dify.

3. **Category UUID mapping in code node** uses `a0000000-...-000005` gap for
   governance (`a000...005` exists in the DB but not in the mapping dict).

4. **Eating category slug mismatch**: The DB slug is `taomony-eating` but the
   LLM prompt says `eating`. The code mapping expects `eating` as the returned
   slug, which happens to work because the code node does `slug.strip().lower()`
   and the LLM returns `eating` — but the DB slug is `taomony-eating`. The
   callback stores `category_slug` for logging but uses the UUID for the actual
   FK, so this is cosmetic — but confusing.

### Recommended Fixes

| Issue | Fix |
|-------|-----|
| Missing governance category | Add `governance` to LLM prompt and code mapping |
| Eating slug mismatch | Align LLM prompt to use `taomony-eating` or update DB slug to `eating` |
| Channel not assigned | Add a step to derive channel from category (e.g., first channel by sort_order) |
| Channel ID not validated | If submitted channel doesn't match classified category, override channel |

---

## A3. Embedding Strategy Review

### Current Implementation

```
# code-embedding node (Python, placeholder)
hash_bytes = hashlib.sha256(embed_text.encode()).digest()
embedding = [float(b) / 255.0 for b in hash_bytes[:128]]
```

Problems:

| Issue | Severity | Detail |
|-------|----------|--------|
| **Not a real embedding** | Critical | SHA-256 hash is not semantically meaningful. Cosine similarity between any two fragments is effectively random (~0.5 ± 0.1). |
| **Wrong dimensionality** | High | 128-dim instead of the 1536-dim that the DB `extensions.vector(1536)` column expects. |
| **No embedding model** | High | Requires OpenAI `text-embedding-3-small` API call, which needs the same API key as the LLM nodes. |
| **Truncation** | Medium | Input text truncated to 500 chars, losing context for longer fragments. |
| **Tags are primitive** | Low | Tags are just the first 5 words > 4 chars. No lemmatization, no concept extraction. |

### Recommendation

Replace the code-embedding node with one of two approaches:

#### Approach A: Dify Embedding Node (Preferred)

Dify supports embedding nodes directly in workflow graphs. Instead of the
current code-embedding Python node, add a real embedding node:

```
Flow:
  LLM Classify ──► Code Map ──► Embedding Node ──► HTTP Callback
                                     │
                          model: text-embedding-3-small
                          input: {{ code-map-category.category_slug }}:
                                 {{ start.content[:2048] }}
                          dimensions: 1536
```

Advantages:
- No code to maintain
- Uses the same OpenAI provider credentials
- Native 1536-dim output matching the DB schema
- Handles truncation properly

#### Approach B: OpenAI Embeddings API via HTTP Node

If Dify's embedding node is unavailable, replace the code node with an HTTP
Request node that calls OpenAI's embeddings API directly:

```
POST https://api.openai.com/v1/embeddings
Authorization: Bearer {{ OPENAI_API_KEY }}
Body: {
  "model": "text-embedding-3-small",
  "input": "{{ category }}: {{ content[:2048] }}",
  "dimensions": 1536
}
```

#### Tag Generation Recommendation

Replace the current word-splitting approach with a lightweight LLM call:

```
Prompt: "Extract 3-5 key tags from this fragment. Return a JSON array of strings.
         Tags should be single words or short phrases."
Content: "{{ content[:500] }}"
```

This produces meaningful tags rather than random long words.

#### Embedding Strategy Summary

| Aspect | Current | Recommended |
|--------|---------|-------------|
| Model | None (SHA-256 hash) | `text-embedding-3-small` |
| Dimensions | 128 | 1536 |
| Input | 500-char truncation | 2048-char truncation |
| Cost per fragment | Free (but useless) | ~0.0004¢ (negligible) |
| Semantic search | Impossible | Enabled |
| Tags | 5 random long words | LLM-extracted keywords |

### Implementation Priority

1. **High** — Replace embedding with real model (critical for semantic search)
2. **Medium** — Add governance category (missing category breaks taxonomy)
3. **Low** — Replace tag extraction with LLM call (nice to have)
4. **Low** — Add channel assignment (useful but current flow works)
