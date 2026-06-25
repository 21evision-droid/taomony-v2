# Distillation Quality Gates — Specification

## Overview

After Workflow B generates a distilled post, a validation layer checks the
output for quality issues before it reaches the admin review queue. This
prevents obviously low-quality posts from wasting admin time and provides
structured feedback for pipeline improvement.

---

## Architecture

```
Workflow B Returns
  { title, content, summary, source_fragment_ids, contributor_count }
       │
       ▼
┌──────────────────────────────────────────────────────┐
│              QUALITY GATE LAYER                      │
│                                                      │
│  Gate 1:  Length Validation         ──→ FAIL → reject│
│  Gate 2:  Structure Parse                              │
│  Gate 3:  Boilerplate Detection    ──→ FAIL → reject  │
│  Gate 4:  Duplicate Detection                         │
│  Gate 5:  Theme Coherence Check                       │
│  Gate 6:  Contributor Threshold    ──→ FAIL → flag    │
│                                                      │
│  Output: { passed, flags[], warnings[] }             │
└──────────────────────┬───────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
    ALL GATES PASSED           ANY GATE FAILED
          │                         │
          ▼                         ▼
  status = "awaiting_review"   status = "rejected"
  (admin reviews)              (auto-rejected, logged)
                                    │
                                    ▼
                           route fragments back to pool
                           log failure in master_agent_runs
```

---

## Gate Specifications

### Gate 1: Length Validation

| Property | Value |
|----------|-------|
| **Gate ID** | `G1_LENGTH` |
| **Type** | Hard fail |
| **Stage** | Post-generation, before any other check |

#### Checks

```text
Check 1.1 — Minimum Length
  Condition:  len(title) < 10 chars OR len(content) < 150 words
  Action:     REJECT
  Reason:     "Post too short: title ({N} chars) or content ({N} words) below minimum"

Check 1.2 — Maximum Length
  Condition:  len(title) > 80 chars OR len(content) > 1500 words
  Action:     REJECT
  Reason:     "Post exceeds maximum length: title ({N} chars) or content ({N} words)"
```

**Rationale for thresholds:**
- Title < 10 chars: Likely a placeholder or error. A meaningful title needs
  at least a few words.
- Title > 80 chars: Truncation risk in UI. Also, a title that long is
  probably trying to summarize rather than evoke.
- Content < 150 words: Too thin to contain meaningful synthesis. The prompt
  requests 300-800 words, so < 150 indicates the LLM failed to execute.
- Content > 1500 words: May ramble or lose focus. Upper bound slightly
  above the 800-word prompt target to allow for well-structured longer posts.

### Gate 2: Structure Parse

| Property | Value |
|----------|-------|
| **Gate ID** | `G2_STRUCTURE` |
| **Type** | Warning only (does not reject) |
| **Stage** | After length validation |

#### Checks

```text
Check 2.1 — Sections Present
  Parse content for expected sections:
    - "Main Insight" or equivalent substantive paragraph
    - "Collective Reflection" or equivalent multi-paragraph body
    - "Practical Application" or a closing that offers actionable guidance
  Action:     WARN for any missing section
  Reason:     "Missing expected section: {section_name}"

Check 2.2 — Paragraph Count
  Condition:  content has < 3 paragraphs
  Action:     WARN
  Reason:     "Only {N} paragraphs — expected 3+ for a cohesive post"

Check 2.3 — No Enumerated Content
  Condition:  content matches /^\s*[\d]+[\.\)]/m OR has explicit "1." "2." "3."
              at the start of 3+ consecutive paragraphs
  Action:     WARN
  Reason:     "Output appears to use numbered structure — expected prose"
```

**Rationale:** Structure warnings do not reject because the LLM may produce
excellent content that diverges from the expected structure. But structural
issues should be logged for prompt improvement.

### Gate 3: Boilerplate Detection

| Property | Value |
|----------|-------|
| **Gate ID** | `G3_BOILERPLATE` |
| **Type** | Hard fail |
| **Stage** | After structure check |

#### Checks

```text
Check 3.1 — AI Disclosure Phrases
  Triggers on any of:
    - "as an AI"
    - "as a language model"
    - "I don't have personal experiences"
    - "I cannot" (in context of lacking capability)
    - "from an AI perspective"
    - "it is important to note" (unsupported by fragment content)
  Action:     REJECT
  Reason:     "AI boilerplate detected: '{phrase}'"

Check 3.2 — Generic Filler Phrases
  Triggers on any of:
    - "it's worth noting that"
    - "it goes without saying"
    - "in today's fast-paced world"
    - "at the end of the day"
  Action:     REJECT
  Reason:     "Generic filler detected: '{phrase}'"
```

**Rationale:** Hard fail because boilerplate indicates the LLM fell back to
its training data rather than working from the fragments. A post with AI
language is immediately recognizable as low-quality and cannot be published.

### Gate 4: Duplicate Detection

| Property | Value |
|----------|-------|
| **Gate ID** | `G4_DUPLICATE` |
| **Type** | Soft fail (flag + reject if severe) |
| **Stage** | After boilerplate check |

#### Checks

```text
Check 4.1 — Internal Repetition
  Compare each paragraph against every other paragraph using character trigram overlap.
  Condition:  > 60% trigram overlap between any two paragraphs
  Action:     REJECT
  Reason:     "Internal duplication detected: paragraph {N} repeats paragraph {M}"

Check 4.2 — Near-Duplicate Title (against last 5 published posts)
  Fetch last 5 published titles from distilled_posts.
  Compare new title using character-level similarity (Levenshtein ratio).
  Condition:  similarity > 0.85 with any recent title
  Action:     WARN, allow with flag
  Reason:     "Title similar to recently published: '{existing_title}'"
```

**Implementation note:** Check 4.2 requires querying Supabase from the
quality gate layer. If the quality gate runs in the Edge Function, this is
straightforward. If it runs in Dify, use an HTTP node to query Supabase.

### Gate 5: Theme Coherence

| Property | Value |
|----------|-------|
| **Gate ID** | `G5_COHERENCE` |
| **Type** | Warning only (informational) |
| **Stage** | After duplicate check |

#### Checks

```text
Check 5.1 — Category-Content Alignment
  Does the title or first paragraph mention the dominant category or a closely
  related theme? Simple keyword match against category name and related terms.
  Condition:  No mention of category name or semantic keywords in title + first 200 chars
  Action:     WARN
  Reason:     "Post may not align with dominant category '{category}'"

Check 5.2 — Source Fragment Coverage
  Compare the number of distinct fragment ids in source_fragment_ids against the
  diversity of ideas visible in the post. (Heuristic: count unique named concepts
  or topics in the post. If < 2 for a batch of 50, warn.)
  Condition:  Post appears to draw from ≤ 2 distinct ideas, but batch has 50 fragments
  Action:     WARN
  Reason:     "Post may not reflect the full diversity of source fragments"
```

**Rationale:** Theme coherence is hard to automate precisely. These checks
are coarse and serve as warning flags for the admin reviewer rather than
hard reject gates.

### Gate 6: Contributor Threshold

| Property | Value |
|----------|-------|
| **Gate ID** | `G6_CONTRIBUTORS` |
| **Type** | Soft fail (flag + allow) |
| **Stage** | Last check |

#### Checks

```text
Check 6.1 — Minimum Contributors
  Condition:  contributor_count < 5
  Action:     FLAG, allow with meta annotation
  Reason:     "Small sample: only {N} contributors"

Check 6.2 — Very Small Sample
  Condition:  contributor_count < 3
  Action:     REJECT (if the batch passes other gates, raise threshold concern)
  Reason:     "Insufficient contributors ({N}) for meaningful collective insight"
```

**Rationale:** A distilled post from 1-2 people is not collective wisdom.
It's just paraphrasing a conversation. Minimum 3 contributors for a valid
post. Posts with 3-4 contributors are flagged for the admin to review with
this context.

---

## Implementation

### Where to Implement

There are two viable approaches:

#### Option A: Edge Function Quality Gate (Recommended)

After `trigger-workflow-b` receives the Dify response, run quality checks
in the Edge Function before inserting the `distilled_posts` row.

```typescript
// In trigger-workflow-b/index.ts, after receiving Dify response:

const gates = new QualityGates(difyResult.data.outputs);
const result = gates.runAll();

if (result.failed.length > 0) {
  // Log failure, do NOT create distilled post
  await logQualityFailure(requestId, result.failed);
  // Mark fragments as NOT distilled (they'll be retried)
  return new Response(JSON.stringify({
    success: false,
    error: "Quality gates failed",
    failures: result.failed,
  }), { status: 422 });
}

// If warnings only, still create the post but annotate
const metaAnnotations = result.warnings.map(w => w.reason);
// Store in master_agent_runs.quality_flags or distilled_posts meta field
```

#### Option B: Dify Workflow Quality Gate

Add nodes at the end of Workflow B (after LLM content generation) that:
1. Code node: check length, detect boilerplate
2. Conditional routing: pass → continue to end; fail → return error

This is more complex and less flexible. Option A is preferred.

### Quality Gate Output Format

```typescript
interface QualityGateResult {
  passed: boolean;
  failed: GateFailure[];
  warnings: GateWarning[];
  metrics: QualityMetrics;
}

interface GateFailure {
  gate_id: string;       // "G1_LENGTH", "G3_BOILERPLATE", etc.
  reason: string;        // Human-readable description
  severity: "reject";    // All failures are reject-level
}

interface GateWarning {
  gate_id: string;       // "G2_STRUCTURE", "G5_COHERENCE", etc.
  reason: string;        // Human-readable description
  severity: "warn";
}

interface QualityMetrics {
  word_count: number;
  paragraph_count: number;
  title_length: number;
  contributor_count: number;
  fragment_count: number;
  category_diversity: number;
  has_practical_application: boolean;
}
```

### Storage in master_agent_runs

Add a `quality_flags` JSONB column to `master_agent_runs`:

```json
{
  "failed": [
    {"gate_id": "G3_BOILERPLATE", "reason": "AI boilerplate detected: 'as an AI'"}
  ],
  "warnings": [
    {"gate_id": "G2_STRUCTURE", "reason": "Missing expected section: Practical Application"}
  ],
  "metrics": {
    "word_count": 450,
    "paragraph_count": 4,
    "title_length": 52,
    "contributor_count": 18,
    "fragment_count": 50,
    "category_diversity": 3,
    "has_practical_application": false
  }
}
```

---

## Gate Decision Matrix

| Gate | Fail Type | Post Status | Fragments Status | Admin Notification |
|------|-----------|-------------|-----------------|-------------------|
| G1 Length | Hard | Not created | Remain undistilled | Log only |
| G2 Structure | Warning | Created (flagged) | Marked distilled | Show flag in review |
| G3 Boilerplate | Hard | Not created | Remain undistilled | Log only |
| G4 Duplicate | Hard/Soft | Depends | Depends | Log + show flag |
| G5 Coherence | Warning | Created (flagged) | Marked distilled | Show flag in review |
| G6 Contributors | Hard (< 3) / Soft (3-4) | Depends | Depends | Log + show flag |

**Design principle:** Hard failures protect the admin's time. Soft failures
inform the admin's judgment. No post reaches the community without human
review (until auto-publish is explicitly enabled).

---

## Verification

| Test | Input | Expected Gate Outcome |
|------|-------|----------------------|
| Empty title | No title returned | G1_LENGTH → REJECT |
| 3000-word ramble | Very long content | G1_LENGTH → REJECT |
| "As an AI, I think..." | Boilerplate detected | G3_BOILERPLATE → REJECT |
| 3 contributors | Small sample | G6_CONTRIBUTORS → FLAG |
| 2 contributors | Very small sample | G6_CONTRIBUTORS → REJECT |
| Same paragraph twice | Duplicate content | G4_DUPLICATE → REJECT |
| Single sentence post | 12 words | G1_LENGTH + G2_STRUCTURE → REJECT |
| Well-formed post | Normal output | ALL GATES → PASS |
| Missing Practical Application | Good prose, no app section | G2_STRUCTURE → WARN only |
