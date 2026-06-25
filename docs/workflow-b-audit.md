# Workflow B — Fragment Distillation Audit

## Overview

Workflow B distills a batch of ~50 classified fragments into a single wisdom
post. It is the core of the Master Agent's output — the distilled post appears
as content in the Harmony Pavilion.

**Current pipeline:**
```
threshold check (50+ undistilled completed fragments)
  → trigger-workflow-b Edge Function
    → Dify Workflow B
      1. Code: analyze batch (dominant category, contributors, excerpts)
      2. LLM: generate title
      3. LLM: write distilled content
      4. Code: extract summary (first 1-2 sentences)
      → Returns { title, content, summary, source_fragment_ids, contributor_count }
        → Supabase: insert distilled_posts, mark fragments as is_distilled=true
```

---

## B1. Distillation Principles

### What the Master Agent Should Do (Normative)

| Principle | Description |
|-----------|-------------|
| **Discover patterns** | Identify recurring themes, concerns, and insights across the fragment batch. Look for what *emerges* from the collective, not what any single person said. |
| **Identify emerging themes** | Surface themes that appear in multiple fragments but may not be explicitly named by any single contributor. Name the unnamed pattern. |
| **Synthesize collective wisdom** | Weave fragments together into a coherent whole that is greater than the sum of its parts. The output should reflect the group's shared understanding, not a summary of individual statements. |
| **Elevate signal, filter noise** | Give more weight to fragments that express original insights, emotional depth, or practical experience. Downweight fragments that are purely observational, generic, or repetitive. |
| **Maintain voice** | Write in a warm, contemplative, non-academic tone. The post should feel like a wise community member reflecting, not an AI report. |

### What the Master Agent Should NOT Do (Proscriptive)

| Anti-pattern | Why |
|-------------|-----|
| **Summarize every fragment** | Produces a list-like, mechanical post. Readers can read individual fragments themselves. |
| **Create numbered lists** | Lists feel like a report, not wisdom. Use prose, bullet insights, or narrative. |
| **Repeat user wording verbatim** | Direct quotes should be occasional and impactful, not the default structure. Paraphrase and synthesize. |
| **Fabricate details** | Do not add claims, statistics, or concepts not present in the fragments. |
| **Flatten contradictions** | If fragments disagree, surface the tension rather than smoothing it over. Collective wisdom includes productive disagreement. |
| **Use AI boilerplate** | No phrases like "as an AI," "I don't have personal experiences," or "it's important to note." |

### Current State vs. Principles

| Aspect | Current Prompt | Gap |
|--------|---------------|-----|
| Pattern discovery | Not mentioned | Prompt asks to "synthesize" and "capture" but doesn't instruct to discover latent patterns. |
| Emerging themes | "Key themes and insights" section | This is a structural instruction, not a quality principle. The model may summarize rather than synthesize. |
| Collective wisdom | "Synthesize the following community fragments into a cohesive wisdom post" | Vague — doesn't distinguish between summary and synthesis. |
| Signal vs. noise | Not addressed | All fragments are treated equally regardless of quality. |
| Voice | "Warm, insightful, and contemplative tone" | Good direction. |
| Anti-list | Current structure includes "3-5 bullet points" | Contradiction: the prompt asks for bullet points while the principles say avoid lists. |

### Recommended Prompt Rewrite (Direction Only)

The system prompt should be restructured to emphasize:

1. **Role**: "You are a wisdom curator synthesizing a community's collective insights."
2. **Task**: "Read all fragments, identify the 2-3 deepest patterns, and write a
   cohesive reflection that reveals what the community is collectively learning."
3. **Anti-patterns**: Explicitly list what NOT to do (see table above).
4. **Tone**: "Warm, humble, insightful. Write as a wise elder reflecting on the
   group's shared journey — not as an analyst writing a report."

---

## B2. Distilled Post Structure

### Current Structure

```
1. Summary paragraph (2-3 sentences)
2. Key themes and insights (3-5 bullet points)
3. Notable fragments (3-4 quotes)
4. Closing reflection (1-2 sentences)
```

### Recommended Structure

The current structure is reasonable but has two problems:
- Bullet points for "Key themes" feels mechanical
- Quotes section encourages verbatim repetition rather than synthesis

**Proposed structure:**

```
Title: A compelling, non-generic title (< 80 chars)

━ Summary ━
2-3 sentences capturing the *collective insight* — what the group as a whole
is learning or experiencing right now. This is not an abstract of the post;
it's the core teaching.

━ Main Insight ━
The single deepest pattern or realization that emerges from the fragments.
One paragraph (3-5 sentences). This is the "heart" of the post — what makes
it worth reading. Readers should feel "aha" here.

━ Collective Reflection ━
2-3 paragraphs weaving together the threads. Each paragraph develops one
theme, supported by paraphrased fragments (occasional direct quotes for
particularly powerful statements). This section demonstrates pattern
discovery — show how different fragments from different people point to the
same underlying truth.

━ Practical Application ━
1-2 sentences on how this insight applies to daily life. Bridges from
contemplation to practice. Optional — omit if the content is purely
philosophical.

━ Meta ━
Synthesized from N fragments by M contributors across K categories.
```

**Rationale:**
- Replaces bullet points with prose, eliminating the "report" feel
- Adds "Main Insight" as the centerpiece — forces the LLM to identify the
  single most important signal
- Keeps quotes optional and occasional, not structural
- "Practical Application" grounds the wisdom in everyday life (aligns with
  Taomony's values)

### Alternative: Minimalist Structure

If the above feels too prescriptive, a simpler alternative:

```
Title

Summary (2-3 sentences)

Body (free-form, 300-800 words)

Source: N fragments · M contributors
```

This gives the LLM maximum creative freedom but risks inconsistent quality.
The structured version is recommended for initial deployment.

---

## B3. Quality Criteria

Define measurable criteria for evaluating distilled post quality. Each criterion
includes a description and a way to assess it.

### Criterion 1: Relevance

| Aspect | Detail |
|--------|--------|
| **Definition** | The post should be clearly about the dominant category and themes present in the source fragments. |
| **Measured by** | Does the post's title + summary align with the dominant category? (Audit: read title + summary, compare to category name) |
| **Threshold** | Title and summary must unambiguously reference the dominant category or theme. |
| **Current status** | Title is generated with category context — generally good alignment expected. |

### Criterion 2: Novelty

| Aspect | Detail |
|--------|--------|
| **Definition** | The post should offer insight beyond what any single fragment contains. It must synthesize, not repeat. |
| **Measured by** | Does the post contain at least one insight or connection that is not explicitly stated in any single source fragment? (Audit: read 5 source fragments, then read the post — is there an "aha" you didn't get from the fragments alone?) |
| **Threshold** | At least one novel synthesis must be present. A post that only paraphrases individual fragments fails this criterion. |
| **Current status** | The current prompt does not explicitly request novel synthesis. Risk of shallow summaries. |

### Criterion 3: Coherence

| Aspect | Detail |
|--------|--------|
| **Definition** | The post should flow naturally, with clear transitions between sections. It should read as a single essay, not a concatenation of fragments. |
| **Measured by** | Does the post have a clear narrative arc: opening → development → closing? (Audit: read for flow — does each paragraph follow logically from the previous?) |
| **Threshold** | Readability score (e.g., Flesch-Kincaid) in the 60-80 range (accessible but not simplistic). No abrupt topic switches. |
| **Current status** | Current structure (summary → bullets → quotes → closing) is coherent but formulaic. Risk of mechanical feel. |

### Criterion 4: Practical Value

| Aspect | Detail |
|--------|--------|
| **Definition** | The post should leave the reader with something actionable or applicable to their life. |
| **Measured by** | Does the post include a practical takeaway? (Not every post needs this — philosophical posts may be purely reflective.) |
| **Threshold** | At least 60% of posts should have a practical application element. |
| **Current status** | No practical application element in current structure. |

### Criterion 5: Cross-fragment Synthesis

| Aspect | Detail |
|--------|--------|
| **Definition** | The post should weave together multiple fragments, showing how different contributors contribute to a shared understanding. |
| **Measured by** | Does the post reference multiple distinct ideas that clearly come from different source fragments? (No quantification needed — qualitative audit.) |
| **Threshold** | At least 3 distinct source fragments should be visibly represented in the post's ideas. A post based on a single dominant fragment fails this criterion. |
| **Current status** | Current structure includes "Notable fragments" section which ensures some multi-source representation. But if that section is removed, the criterion must be enforced in the main body. |

### Automated Quality Checks

For production, consider adding a post-generation quality gate:

```
After Workflow B returns:
  1. Parse the response
  2. Run automated checks:
     a. Title length < 80 chars?
     b. Content length between 300-800 words?
     c. Contains at least 3 paragraphs?
     d. No AI boilerplate phrases?
  3. If any check fails → flag for review, do not auto-publish
```

---

## B4. Failure Cases

### Case 1: Fragment Noise

| Aspect | Detail |
|--------|--------|
| **Scenario** | A batch contains several off-topic, low-effort, or gibberish fragments. |
| **Effect** | The LLM dilutes the signal by trying to incorporate noise. The post becomes unfocused. |
| **Detection** | Run quality check after generation. If post scores low on coherence or novelty, check source fragments for noise. |
| **Current behavior** | Not handled. All fragments are treated equally. |
| **Recommended behavior** | Pre-filter noise in the `code-analyze` node: skip fragments with < 20 chars, no meaningful content, or detected spam patterns. Add a `noise_score` metric to the batch analysis. |

### Case 2: Topic Mixing

| Aspect | Detail |
|--------|--------|
| **Scenario** | Fragments in the batch come from very different categories (e.g., 40% meditate, 30% learning, 30% eating). The dominant category barely wins. |
| **Effect** | The post tries to cover too many topics and ends up shallow in all of them. |
| **Detection** | `category_diversity` metric from `code-analyze`. If the top category has < 60% share, flag as mixed batch. |
| **Current behavior** | The code-analyze node calculates `category_diversity` but it is not used to make decisions. The LLM receives the dominant category name but not the distribution. |
| **Recommended behavior** | |
| | **If dominant category > 60%**: Proceed normally. Post should focus on the dominant theme. |
| | **If dominant category 40-60%**: Add a note to the LLM prompt: "This batch has significant topic diversity across [categories]. Acknowledge this range in the post." |
| | **If dominant category < 40%**: Add a note to the LLM prompt: "This batch is highly diverse. Write a post that explores the connection between these themes, or flag that no single theme dominates." |

### Case 3: Low Quality Batches

| Aspect | Detail |
|--------|--------|
| **Scenario** | Most fragments are short, shallow, or generic. The batch has no strong signal. |
| **Effect** | The LLM produces a vague, generic post that reads like filler. |
| **Detection** | Average fragment length < 100 chars, or > 50% of fragments have no tags. |
| **Current behavior** | Not detected. |
| **Recommended behavior** | If average quality is too low, skip distillation for this batch and wait for more/better fragments. Log: `"Batch skipped: insufficient quality (avg length: X chars)"`. |

### Case 4: Duplicate Content

| Aspect | Detail |
|--------|--------|
| **Scenario** | Multiple fragments express the same idea in very similar words. Could be same user posting similar content across days, or multiple users echoing each other. |
| **Effect** | The post overweights a single idea because it appears many times. |
| **Detection** | Simple cosine similarity between fragments (once real embeddings exist): if any pair has similarity > 0.92, flag as duplicate. |
| **Current behavior** | Not detected. |
| **Recommended behavior** | De-duplicate before distillation: if fragments are near-identical, include only the most expressive one. Log the de-duplication count. |

### Case 5: Small Sample Size

| Aspect | Detail |
|--------|--------|
| **Scenario** | Only 50-60 fragments available (just above the threshold). Few contributors (e.g., 3-5 unique users). |
| **Effect** | The post reflects a very small group's perspective, potentially creating a false sense of collective wisdom. |
| **Detection** | `contributor_count` < 10, or `total_fragments` < 60. |
| **Current behavior** | The minimum threshold is 50 fragments. Contributor count is calculated but not used as a gate. |
| **Recommended behavior** | Add a secondary threshold: require at least 10 unique contributors OR at least 60 fragments. Small sample posts should be flagged in the post meta: "Synthesized from a small group (N contributors)." |

### Summary Table

| Failure Case | Detection | Current Handling | Recommended |
|-------------|-----------|----------------|-------------|
| Fragment noise | Avg length, spam patterns | None | Pre-filter, add noise_score |
| Topic mixing | category_diversity < 60% | category_diversity logged but unused | Conditional prompt by diversity level |
| Low quality | Avg length < 100 chars | None | Skip batch, log reason |
| Duplicate content | Cosine similarity > 0.92 | None | De-duplicate before LLM |
| Small sample | contributor_count < 10 | None | Add secondary threshold + flag |
