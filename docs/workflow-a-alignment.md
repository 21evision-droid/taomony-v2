# Workflow A — Alignment Specification

## Overview

Two alignment issues were identified in the audit and are resolved here:

1. **Category coverage**: Governance category (slug: `governance`, UUID:
   `a000...005`) exists in the database taxonomy but is missing from Workflow
   A's LLM prompt and code mapping. All 6 DB categories must be covered.
2. **Vocabulary unification**: `source_type` and `fragment_type` represent
   the same concept using different vocabularies. Unify to the canonical set.

---

## Task 1: Category Coverage Matrix

### Current State

| DB Category | Slug | UUID | In LLM Prompt? | In Code Mapping? |
|-------------|------|------|:-:|:-:|
| Learning | `learning` | `a000...001` | ✅ | ✅ |
| Meditate | `meditate` | `a000...002` | ✅ | ✅ |
| Taomony Eating | `taomony-eating` | `a000...003` | ✅ (as `eating`) | ✅ (as `eating`) |
| Cultivation | `cultivation` | `a000...004` | ✅ | ✅ |
| Governance | `governance` | `a000...005` | ❌ **Missing** | ❌ **Missing** |
| Harmony Resonance | `harmony-resonance` | `a000...006` | ✅ (as `harmony`) | ✅ (as `harmony`) |

**Coverage: 5/6 (83%)**

### Target State

| DB Category | Slug | UUID | LLM Prompt Slug | Code Mapping | Callback `category_slug` |
|-------------|------|------|:-:|:-:|:-:|
| Learning | `learning` | `a000...001` | `learning` | ✅ | `learning` |
| Meditate | `meditate` | `a000...002` | `meditate` | ✅ | `meditate` |
| Taomony Eating | `taomony-eating` | `a000...003` | `taomony-eating` | ✅ | `taomony-eating` |
| Cultivation | `cultivation` | `a000...004` | `cultivation` | ✅ | `cultivation` |
| Governance | `governance` | `a000...005` | `governance` | ✅ | `governance` |
| Harmony Resonance | `harmony-resonance` | `a000...006` | `harmony-resonance` | ✅ | `harmony-resonance` |

**Coverage: 6/6 (100%)**

### Changes Required

#### A. LLM Prompt — System Message (Node 2)

Replace the current categories section with:

```
Categories:
- learning           → Educational content, book insights, study notes, intellectual growth
- meditate           → Meditation experiences, mindfulness practices, inner stillness
- taomony-eating     → Mindful eating, nutrition, food experiences, weight journey
- cultivation        → Personal growth, habit formation, discipline, gratitude, self-improvement
- governance         → Community policy, events, challenges, platform feedback, coordination
- harmony-resonance  → Community resonance, collective wisdom, relationships, shared experiences
```

Key changes:
- `eating` → `taomony-eating` (matches DB slug)
- `harmony` → `harmony-resonance` (matches DB slug)
- Added `governance` with description and examples

#### B. Code Mapping Dictionary (Node 3)

Replace the mapping dict:

```python
mapping = {
    "learning":          "a0000000-0000-4000-8000-000000000001",
    "meditate":          "a0000000-0000-4000-8000-000000000002",
    "taomony-eating":    "a0000000-0000-4000-8000-000000000003",
    "cultivation":       "a0000000-0000-4000-8000-000000000004",
    "governance":        "a0000000-0000-4000-8000-000000000005",
    "harmony-resonance": "a0000000-0000-4000-8000-000000000006",
}
```

#### C. HTTP Callback Body (Node 6)

No change needed — the callback sends `category_id` (UUID) and `category_slug`
from the code node. The `category_slug` value for callbacks will now use the
new canonical slugs.

#### D. Governance Classification Examples

Add to the system prompt to guide classification of governance content:

```
  governance examples:
  - "I propose a new community challenge for mindful eating."
  - "Can we add a weekly check-in thread?"
  - "The community guidelines should clarify anonymous posting."
  - "When is the next Resonance Circle?"
```

---

## Task 2: Unified Content Type Contract

### Current Dual Vocabulary

| Concept | DB Column | Current Values | Set by |
|---------|-----------|---------------|--------|
| User's claim about content form | `source_type` | `fragment`, `short_article`, `long_article`, `image`, `youtube_link` | Client at submission |
| Dify's determination of content form | `fragment_type` | `fragment`, `reflection`, `extended_fragment` | Workflow A Node 4 |

These columns overlap semantically. The different vocabularies create
confusion: a `reflection` in `fragment_type` could map to either a `fragment`
or `short_article` in `source_type`.

### Canonical Set

All content types use these five values:

| Value | Definition | Length Threshold | Metadata Signals |
|-------|-----------|----------------|------------------|
| `fragment` | Brief observation, insight, or daily moment | < 300 chars | No media_url |
| `short_article` | Structured thought, moderate depth | 300–2000 chars | No media_url |
| `long_article` | Lengthy composition, detailed exploration | > 2000 chars | No media_url |
| `image` | Photo, screenshot, or visual | N/A | `source_type = "image"` OR `media_url` is image |
| `youtube_link` | YouTube video link | N/A | `source_type = "youtube_link"` OR content contains youtube.com |

### Unification Strategy

**Step 1 — Update Workflow A Node 4 prompt** to output from the canonical set:

```
Classify the content type. Return exactly one word:
- fragment        → A brief observation, insight, or daily moment (under 300 chars)
- short_article   → A moderately structured thought, reflection, or insight (300-2000 chars)
- long_article    → A lengthy composition, story, or detailed exploration (over 2000 chars)
- image           → A photo, screenshot, or visual (media_url is present)
- youtube_link    → A YouTube video link (URL is present)
```

**Step 2 — Update DB CHECK constraint** (requires migration, do not execute now):

```sql
-- Remove old constraint
ALTER TABLE raw_fragments DROP CONSTRAINT IF EXISTS raw_fragments_fragment_type_check;

-- Add new constraint with canonical values
ALTER TABLE raw_fragments ADD CONSTRAINT raw_fragments_fragment_type_check
  CHECK (fragment_type IN ('fragment', 'short_article', 'long_article', 'image', 'youtube_link'));

-- Backfill existing rows: 'reflection' → 'short_article', 'extended_fragment' → 'long_article'
UPDATE raw_fragments
SET fragment_type = CASE
  WHEN fragment_type = 'reflection' THEN 'short_article'
  WHEN fragment_type = 'extended_fragment' THEN 'long_article'
  ELSE fragment_type
END
WHERE fragment_type IN ('reflection', 'extended_fragment');
```

**Step 3 — Update HTTP Callback Body** (Node 6):

The callback sends `fragment_type` from Node 4 output. No code change needed
since the LLM will now output the canonical values directly.

**Step 4 — Future: deprecate `source_type`**:

The `source_type` column at submission time is redundant once Dify determines
`fragment_type` with higher accuracy. Keep both columns for now for backward
compatibility, but the application should read `fragment_type` (authoritative)
and ignore `source_type` going forward.

### Content Type Determination Logic

The LLM (Node 4) should determine the type based on:

1. **Media presence first**: If `media_url` contains an image URL → `image`.
   If content contains `youtube.com/watch` → `youtube_link`.
2. **Length heuristic**: If no media signals, use character count thresholds
   (see table above).
3. **Structure signals**: Presence of headers, multiple paragraphs, or
   structured formatting can override length heuristics. A 250-char post with
   clear section headers is `short_article`, not `fragment`.

### Edge Cases

| Input | Classification | Rationale |
|-------|---------------|-----------|
| 50 chars with `media_url` pointing to image | `image` | Media presence takes priority |
| 5000 chars with no structure, stream-of-consciousness | `long_article` | Length threshold met |
| 150 chars: "Thank you all for the wonderful session tonight." | `fragment` | Short, social, no depth |
| 400 chars with bullet points and a heading | `short_article` | Structure signals intent |
| Content contains both text and a youtube.com link | `youtube_link` | Link presence takes priority |
| 280 chars with markdown formatting (bold, quote) | `short_article` | Formatting indicates structured thought |

---

## Workflow A — Node Change Summary

| Node | Change | Impact |
|------|--------|--------|
| 2 — LLM Classify | Update category list in system prompt | Backward compatible (slugs change) |
| 3 — Code Map | Update mapping dict | Must match new slugs |
| 4 — LLM Fragment Type | Replace prompt with canonical values | Output vocabulary changes |
| 5 — Code Embedding | No change (placeholder remains) | No impact |
| 6 — HTTP Callback | No change needed | Values flow from upstream nodes |
| 7 — End | No change | No impact |

### Database Migration Required (do not execute)

One migration needed when implementing:

```sql
-- 1. Update CHECK constraint on fragment_type
ALTER TABLE raw_fragments DROP CONSTRAINT IF EXISTS raw_fragments_fragment_type_check;
ALTER TABLE raw_fragments ADD CONSTRAINT raw_fragments_fragment_type_check
  CHECK (fragment_type IN ('fragment', 'short_article', 'long_article', 'image', 'youtube_link'));

-- 2. Backfill existing values
UPDATE raw_fragments SET fragment_type = 'short_article' WHERE fragment_type = 'reflection';
UPDATE raw_fragments SET fragment_type = 'long_article' WHERE fragment_type = 'extended_fragment';
```

---

## Verification

After implementing these changes, verify with:

```
1. Submit a governance-related fragment (e.g., "I propose a new event format")
   → Expect: category_slug = "governance", category_id = a000...005

2. Submit a short_article-length fragment (400 chars, structured)
   → Expect: fragment_type = "short_article"

3. Submit a long_article-length fragment (2500 chars)
   → Expect: fragment_type = "long_article"

4. Submit a fragment with youtube.com link
   → Expect: fragment_type = "youtube_link"

5. Submit a fragment with image media_url
   → Expect: fragment_type = "image"
```
