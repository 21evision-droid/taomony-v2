# Admin Sanctuary — Design Specification

## Overview

The Admin Sanctuary is a private moderation interface where administrators
review, approve, reject, or request rewrites of distilled posts before they
are published to the Harmony Pavilion. It is the governance layer between
the automated Master Agent pipeline and public-facing content.

**Scope:** Design only. No implementation, no migrations, no UI code.

**Guiding principles:**
- Human review is the quality gate for all AI-generated content
- Admin actions are auditable (every action is logged)
- The system should minimize admin burden while maintaining quality

---

## C1. User Stories

### Core Moderation

| ID | Story | Priority |
|----|-------|----------|
| US-01 | **Approve Distilled Post**: As an admin, I want to review a distilled post and approve it so that it becomes visible to the community. | P0 |
| US-02 | **Reject Distilled Post**: As an admin, I want to reject a distilled post that doesn't meet quality standards so that it is not published. | P0 |
| US-03 | **Request Rewrite**: As an admin, I want to request a rewrite with specific feedback so that the Master Agent can improve the post. | P1 |
| US-04 | **Archive Post**: As an admin, I want to archive a previously published post so that it is no longer visible (if it becomes outdated or problematic). | P1 |

### Review & Discovery

| ID | Story | Priority |
|----|-------|----------|
| US-05 | **Review Queue**: As an admin, I want to see a queue of all posts awaiting review, sorted by creation date, so I know what needs my attention. | P0 |
| US-06 | **View Source Fragments**: As an admin, I want to see the source fragments that were distilled into a post so I can evaluate the quality of the synthesis. | P1 |
| US-07 | **Filter by Category**: As an admin, I want to filter the review queue by category so I can focus on areas I'm most familiar with. | P2 |
| US-08 | **View Run History**: As an admin, I want to see the Master Agent run history so I can monitor pipeline health and failure rates. | P2 |

### Quality Management

| ID | Story | Priority |
|----|-------|----------|
| US-09 | **Edit Title/Summary**: As an admin, I want to make minor edits to a post's title or summary before approving so I can fix small issues without a full rewrite. | P1 |
| US-10 | **Publish Immediately vs. Schedule**: As an admin, I want to publish immediately or schedule publication for a future time. | P2 |
| US-11 | **Flag Low Quality Batch**: As an admin, I want to flag a batch of fragments as low quality so that the threshold logic can be improved. | P2 |
| US-12 | **Override Category**: As an admin, I want to change the category assignment of a distilled post before publishing. | P2 |

---

## C2. Conversation Flows

### Flow 1: Standard Approval

```
Admin opens review queue
  → Sees post awaiting review (title, summary, category, created_at, contributor count)
  → Clicks "Review" on a post
    → Sees full post content + source fragments
    → Clicks "Approve"
      → System:
        1. Sets status = "published"
        2. Sets published_at = now()
        3. Posts to Harmony Pavilion (visible to community)
        4. Logs action to master_agent_runs + audit log
      → Shows success confirmation
      → Returns to queue
```

### Flow 2: Rejection with Reason

```
Admin reviews post
  → Decides post does not meet quality standards
  → Clicks "Reject"
    → System prompts: "Reason for rejection (required):"
    → Admin enters reason (e.g., "Generic content, lacks specific insight")
    → Admin confirms
      → System:
        1. Sets status = "rejected"
        2. Records rejection_reason
        3. Does NOT publish (post is hidden)
        4. Source fragments are NOT marked as is_distilled (they can be re-distilled later)
        5. Logs action
      → Shows confirmation
      → Returns to queue
```

### Flow 3: Rewrite Request (Conversational)

```
Admin reviews post
  → Decides content is on the right track but needs improvement
  → Clicks "Request Rewrite"
    → System shows a text input: "Describe what should change:"
    → Admin enters: "The practical application section is too vague.  
       Give specific examples of how to apply this insight to daily  
       meditation practice."
    → System:
      1. Sets status = "rewriting"
      2. Stores the rewrite request (linked to the master_agent_run)
      3. Triggers a re-distillation with the admin's feedback injected
         into the prompt as additional context
      4. On completion, sets status = "awaiting_review" again
      5. Shows the revised post with the admin's original feedback
         visible for comparison
    → Admin reviews the rewrite
      → Can approve, reject, or request another rewrite
```

**Design notes on rewrite:**
- The rewrite should be a *new* LLM call with the admin feedback as a system
  instruction, not a regeneration from scratch
- The source fragments remain the same (no need to re-fetch)
- The admin's feedback text is appended to the LLM prompt:
  ```
  "An admin reviewer has provided this feedback on your previous draft:
   {{feedback}}
   Please revise the post accordingly."
  ```
- Maximum 2 rewrite rounds per post (prevents infinite loops)

### Flow 4: Post-Edit and Publish

```
Admin reviews post
  → Clicks "Edit"
    → System shows editable title, summary, and content fields
    → Admin makes changes (e.g., improves the title)
    → Clicks "Save & Approve"
      → System:
        1. Merges admin edits into the post
        2. Sets status = "published"
        3. Records edited_by = admin_id
        4. Publishes
      → Shows confirmation
```

### Flow 5: Archive Existing Post

```
Admin views published posts list
  → Finds a post that needs removal
  → Clicks "Archive"
    → System confirms: "Archive this post? It will be hidden from the community."
    → Admin confirms
      → System: sets status = "archived"
      → Post disappears from Harmony Pavilion
```

### Flow 6: Review Source Fragments

```
Admin reviews post
  → Clicks "View Source Fragments"
    → System shows a panel/list of the source fragments:
      - Fragment content (truncated, expandable)
      - User (anonymous, just user_id)
      - Category
      - Created date
      - Tags (if any)
    → Admin can scroll through all source fragments
    → Admin can close panel and return to review
```

---

## C3. Data Requirements

### Current Schema (as of Phase 3A)

```sql
-- distilled_posts
id                  UUID PRIMARY KEY
title               TEXT NOT NULL
content             TEXT NOT NULL
summary             TEXT
source_fragment_ids UUID[] NOT NULL
contributor_count   INTEGER DEFAULT 0
status              TEXT DEFAULT 'draft'
                    CHECK (status IN ('draft', 'published', 'archived'))
published_at        TIMESTAMPTZ
created_at          TIMESTAMPTZ DEFAULT now()

-- master_agent_runs
id                  UUID PRIMARY KEY
status              TEXT DEFAULT 'running'
                    CHECK (status IN ('running', 'completed', 'failed'))
started_at          TIMESTAMPTZ DEFAULT now()
completed_at        TIMESTAMPTZ
fragment_count      INTEGER
distilled_post_id   UUID REFERENCES distilled_posts(id)
error_message       TEXT
created_at          TIMESTAMPTZ DEFAULT now()
```

### Recommended Additional Fields

#### distilled_posts

| Field | Type | Purpose | Required for |
|-------|------|---------|-------------|
| `review_status` | `TEXT` | Moderation state: `awaiting_review`, `approved`, `rejected`, `rewriting` | US-01, US-02, US-03 |
| `reviewed_by` | `UUID REFERENCES auth.users(id)` | Admin who performed the review | Audit trail |
| `reviewed_at` | `TIMESTAMPTZ` | When the review decision was made | Audit trail |
| `rejection_reason` | `TEXT` | Why the post was rejected | US-02 |
| `edit_history` | `JSONB` | Array of { edited_by, edited_at, changes } tracking admin edits | US-09 |
| `rewrite_request` | `TEXT` | Admin's rewrite feedback (null if not in rewrite cycle) | US-03 |
| `rewrite_round` | `INTEGER DEFAULT 0` | How many times this post has been rewritten (max 2) | US-03 |
| `scheduled_at` | `TIMESTAMPTZ` | If not publishing immediately, the scheduled publish time | US-10 |
| `original_content` | `TEXT` | Snapshot of the AI-generated content before admin edits | Audit trail |

**Design alternatives for status:**

Option A (single status field):
```sql
status TEXT DEFAULT 'draft'
  CHECK (status IN ('draft', 'awaiting_review', 'rewriting', 'published',
                    'rejected', 'archived'))
```
Simpler but loses information about *who* did what.

Option B (split moderation + publication):
```sql
review_status TEXT DEFAULT 'pending'
  CHECK (review_status IN ('pending', 'approved', 'rejected', 'rewriting'))
pub_status TEXT DEFAULT 'draft'
  CHECK (pub_status IN ('draft', 'published', 'archived'))
```
More flexible — can have a post that is "approved but not yet published."

**Recommendation:** Option B. It cleanly separates "has this been reviewed?"
from "is it visible?" — which matters for scheduled publishing and the rewrite
flow.

#### master_agent_runs

| Field | Type | Purpose | Required for |
|-------|------|---------|-------------|
| `dominant_category_id` | `UUID REFERENCES categories(id)` | Which category the batch was dominated by | US-07, quality analytics |
| `category_diversity` | `INTEGER` | How many categories were represented in the batch | Quality analytics (B2) |
| `avg_fragment_length` | `INTEGER` | Average character length of input fragments | Quality analytics (B4) |
| `duplicate_count` | `INTEGER DEFAULT 0` | Number of duplicate fragments detected and removed | B4 failure case logging |
| `noise_skip_count` | `INTEGER DEFAULT 0` | Number of fragments skipped due to noise/low quality | B4 failure case logging |
| `quality_flags` | `JSONB` | Array of quality issues detected (e.g., `["small_sample", "topic_mixing"]`) | B4 structured logging |
| `llm_model` | `TEXT` | Which model was used for generation | Cost tracking |
| `prompt_version` | `TEXT` | Version identifier for the prompt template | Prompt iteration tracking |
| `input_tokens` | `INTEGER` | Token count for input (cost tracking) | Cost monitoring |
| `output_tokens` | `INTEGER` | Token count for output (cost tracking) | Cost monitoring |
| `total_cost` | `NUMERIC(10,6)` | Estimated cost of this run in USD | Cost monitoring |
| `admin_feedback` | `TEXT` | Admin's rewrite request (if this run was a rewrite) | US-03 |

#### New Table: admin_audit_log (optional)

If fine-grained audit is needed (beyond what `master_agent_runs` provides):

```sql
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
    -- 'approve' | 'reject' | 'rewrite_request' | 'edit' | 'archive' | 'unarchive'
  distilled_post_id UUID REFERENCES distilled_posts(id),
  details JSONB,
    -- { rejection_reason, edit_summary, previous_status, etc. }
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

This is optional — the review fields on `distilled_posts` + the run data on
`master_agent_runs` cover most audit needs. Add this table only if:
- Multiple admins will be active simultaneously
- Regulatory or compliance requirements demand it
- You need the ability to "undo" admin actions

### Schema Evolution Strategy

Do not create migrations now. When implementing:

1. Add new columns as nullable (or with safe defaults)
2. Backfill existing rows with sensible defaults
3. Add CHECK constraints in a subsequent migration
4. Create RLS policies after columns exist

The current `status` column (`draft`/`published`/`archived`) should be
migrated in two steps:

```
Step 1: Add review_status column (nullable)
Step 2: Backfill: all 'draft' → 'awaiting_review', all 'published' → 'approved'
Step 3: Add NOT NULL constraint
Step 4: Eventually deprecate old status column (or rename to pub_status)
```

---

## UI Mockups (Text-Only)

### Review Queue Page

```
┌──────────────────────────────────────────────────────────────┐
│  Admin Sanctuary  │  Queue (12)  │  History  │  Settings    │
├──────────────────────────────────────────────────────────────┤
│  Filter: [All Categories ▾]  [Awaiting Review ▾]            │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Reflections on Daily Meditation                        │ │
│  │  Meditate · 52 fragments · 18 contributors              │ │
│  │  Created 2 hours ago                                    │ │
│  │  [Review]                                               │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │  The Wisdom of Morning Practice                         │ │
│  │  Cultivation · 48 fragments · 12 contributors           │ │
│  │  Created 5 hours ago                                    │ │
│  │  [Review]  [Request Rewrite (1)]                        │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │  ...                                                    │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Review Detail Page

```
┌──────────────────────────────────────────────────────────────┐
│  ← Back to Queue                                            │
├──────────────────────────────────────────────────────────────┤
│  Title:  [Reflections on Daily Meditation         ]         │
│  Summary:[2-3 sentence summary...                 ]         │
│  Category: Meditate ▾                                       │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Content Preview                                       │ │
│  │                                                        │ │
│  │  ## Reflections on Daily Meditation                    │ │
│  │                                                        │ │
│  │  The community's morning practice fragments reveal...   │ │
│  │  ...                                                   │ │
│  └────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│  Source Fragments (52) [Show ▾]                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  "Sat for 20 minutes watching the sunrise today..."     │ │
│  │  "My breath practice has deepened this week..."         │ │
│  │  ...                                                    │ │
│  └────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│  [Approve]  [Request Rewrite ▸]  [Reject]  [Edit]          │
└──────────────────────────────────────────────────────────────┘
```

---

## Implementation Sequence

| Phase | What | Depends on |
|-------|------|-----------|
| **Phase 1** (P0) | Add `review_status`, `reviewed_by`, `reviewed_at`, `rejection_reason` to distilled_posts. Implement Review Queue + Approve/Reject flows. | Core distilled_posts schema |
| **Phase 2** (P1) | Add `rewrite_request`, `rewrite_round` fields. Implement Request Rewrite flow (conversational). | Phase 1 + Dify Workflow B rewrite prompt |
| **Phase 3** (P1) | Add `edit_history`, `original_content`. Implement Edit & Publish flow. | Phase 1 |
| **Phase 4** (P2) | Add all quality-tracking fields to `master_agent_runs`. Implement quality dashboard. | Phase 1 |
| **Phase 5** (P2) | Add scheduled publishing. Admin audit log table. | Phase 1 |

---

## Risks and Considerations

| Risk | Mitigation |
|------|-----------|
| **Admin becomes bottleneck** | Start with notifications when queue exceeds 5 items. Consider auto-publishing low-risk posts after 24 hours. |
| **Rewrite loop** | Hard cap of 2 rewrite rounds per post. If still not acceptable, reject and route fragments back to pool. |
| **Admin makes harmful edit** | Edit history tracks all changes. Original content is preserved. Can revert. |
| **Too many rejected posts** | Analytics on rejection reasons will indicate if the Master Agent prompts need improvement or the threshold is too low. |
| **Collusion / bias** | Audit log tracks all admin actions. Add peer review for sensitive content (optional). |
