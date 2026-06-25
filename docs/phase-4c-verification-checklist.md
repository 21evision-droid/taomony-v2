# Phase 4C — Verification Checklist

## Overview

After deployment, run all checks in order. Each check has a pass/fail
criterion, a command to execute, and a recovery action if it fails.

**Run with:**
```bash
node scripts/verify-phase4.mjs
```
Or execute individual checks below.

---

## V1 — Dify Reachable from Supabase

| Property | Value |
|----------|-------|
| **Check** | DIFY_BASE_URL resolves and Dify returns HTTP 401 for invalid auth |
| **Command** | |
```bash
DIFY_URL=$(npx supabase secrets list | grep DIFY_BASE_URL | awk '{print $NF}')
curl -s -o /dev/null -w "%{http_code}" "$DIFY_URL/v1/workflows/run" \
  -H "Authorization: Bearer invalid-key" \
  -H "Content-Type: application/json" \
  -d '{"inputs":{"test":true},"response_mode":"blocking","user":"test"}'
```
| **Pass** | HTTP 401 |
| **Fail** | Connection timeout, DNS resolution failure, HTTP 5xx |
| **Recovery** | Check tunnel/VPS is running. Verify `DIFY_BASE_URL` Supabase secret. |
| | If tunnel: restart `cloudflared tunnel`. If VPS: check `docker compose ps` on VPS. |

## V2 — Workflow A Executes Successfully

| Property | Value |
|----------|-------|
| **Check** | Submit a fragment, trigger Workflow A, verify completion |
| **Command** | |
```bash
# Insert test fragment via API
FRAGMENT_ID=$(curl -s -X POST "https://jiwsgaegoudcutdnqydf.supabase.co/rest/v1/raw_fragments" \
  -H "apikey: <anon_key>" \
  -H "Authorization: Bearer <anon_key>" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"96c04d6f-dbdc-4c96-819c-de05b0e3a333","content":"Test fragment for verification. The morning light filters through bamboo outside my window.","channel_id":"b0000000-0000-4000-8000-000000000001","source_type":"fragment","status":"pending"}' \
  -H "Prefer: return=representation" | jq -r '.[0].id')

# Trigger Workflow A
curl -s -X POST "https://jiwsgaegoudcutdnqydf.supabase.co/functions/v1/trigger-workflow-a" \
  -H "Authorization: Bearer <anon_key>" \
  -H "Content-Type: application/json" \
  -d "{\"fragment_id\":\"$FRAGMENT_ID\"}"

# Poll for status change (up to 30s)
for i in $(seq 1 30); do
  STATUS=$(curl -s "https://jiwsgaegoudcutdnqydf.supabase.co/rest/v1/raw_fragments?id=eq.$FRAGMENT_ID&select=status" \
    -H "apikey: <anon_key>" | jq -r '.[0].status')
  if [ "$STATUS" != "pending" ]; then break; fi
  sleep 1
done
echo "Final status: $STATUS"
```
| **Pass** | Fragment status changes from `pending` to `completed` |
| **Fail** | Status stays `pending` (callback not received), changes to `failed` |
| **Recovery** | Check `workflow_events` table for error messages. |
| | Verify DIFY_WORKFLOW_A_API_KEY is valid. Check Dify workflow run logs. |

## V3 — category_id Populated Correctly

| Property | Value |
|----------|-------|
| **Check** | Fragment has a valid category_id matching one of 6 DB categories |
| **Command** | |
```bash
curl -s "https://jiwsgaegoudcutdnqydf.supabase.co/rest/v1/raw_fragments?id=eq.$FRAGMENT_ID&select=category_id,category_slug" \
  -H "apikey: <anon_key>" | jq '.[0]'
```
| **Pass** | `category_id` is a non-null UUID matching categories table |
| **Fail** | `category_id` is null, empty string, or UUID not in categories table |
| **Recovery** | Check Workflow A Node 3 (code mapping) for missing/all category UUIDs. |
| | Verify governance (`a000...005`) is in the mapping dict. |

### Coverage Verification

```sql
-- Verify all 6 categories are represented in recent fragments
SELECT c.name AS category, COUNT(rf.id) AS fragment_count
FROM categories c
LEFT JOIN raw_fragments rf ON rf.category_id = c.id
GROUP BY c.name
ORDER BY c.sort_order;
```

**Pass:** All 6 categories have at least 1 recent fragment.
**Fail:** Any category has 0 fragments in the last batch.

## V4 — Content Type Values Accepted by DB

| Property | Value |
|----------|-------|
| **Check** | fragment_type column stores canonical values without constraint violation |
| **Command** | |
```bash
curl -s "https://jiwsgaegoudcutdnqydf.supabase.co/rest/v1/raw_fragments?id=eq.$FRAGMENT_ID&select=fragment_type" \
  -H "apikey: <anon_key>" | jq '.[0]'
```
| **Pass** | `fragment_type` is one of: `fragment`, `short_article`, `long_article`, `image`, `youtube_link` |
| **Fail** | `fragment_type` is `reflection`, `extended_fragment`, or null |
| **Recovery** | Check DB migration was applied (Step 3 in runbook). |
| | Check Workflow A Node 4 prompt outputs canonical values. |

### Full Distribution Check

```sql
SELECT fragment_type, COUNT(*) FROM raw_fragments GROUP BY fragment_type;
```

**Pass:** No rows with `reflection` or `extended_fragment`.
**Fail:** Any row still has old values.

## V5 — Embedding Vector Stored with Dimension 1536

| Property | Value |
|----------|-------|
| **Check** | embedding column contains a 1536-dim float array |
| **Command** | |
```sql
SELECT id,
       length(embedding) AS vector_dimensions,
       embedding[1:3] AS sample_values
FROM raw_fragments
WHERE embedding IS NOT NULL
LIMIT 1;
```
| **Pass** | `vector_dimensions` = 1536, `sample_values` are non-zero floats (not hash bytes) |
| **Fail** | `vector_dimensions` = 128 (old placeholder), or NULL, or zero values |
| **Recovery** | Check Workflow A Node 5 (HTTP embedding node) configuration. |
| | Verify `dimensions: 1536` in the request body. |
| | Check OpenAI API key has `text-embedding-3-small` access. |

### Semantic Utility Check

```sql
-- Two similar-topic fragments should have cosine similarity > 0.5
SELECT
  f1.id AS fragment_a,
  f2.id AS fragment_b,
  1 - (f1.embedding <=> f2.embedding) AS cosine_similarity
FROM raw_fragments f1, raw_fragments f2
WHERE f1.id < f2.id
  AND f1.category_id = f2.category_id
  AND f1.embedding IS NOT NULL
  AND f2.embedding IS NOT NULL
LIMIT 1;
```

**Pass:** Cosine similarity > 0.5 for same-category fragments.
**Fail:** Cosine similarity ~0.5 for all pairs (random — indicates bad embeddings).

## V6 — Master Agent Trigger Works at Threshold

| Property | Value |
|----------|-------|
| **Check** | trigger-workflow-b runs successfully when threshold met |
| **Command** | |
```bash
# Check fragment count first
COUNT=$(curl -s "https://jiwsgaegoudcutdnqydf.supabase.co/rest/v1/raw_fragments?status=eq.completed&is_distilled=eq.false&select=count" \
  -H "apikey: <anon_key>" -H "Prefer: count=exact" | jq -r '.[0].count // 0')
echo "Undistilled completed fragments: $COUNT"

if [ "$COUNT" -ge 50 ]; then
  # Trigger Workflow B
  curl -s -X POST "https://jiwsgaegoudcutdnqydf.supabase.co/functions/v1/trigger-workflow-b" \
    -H "Authorization: Bearer <anon_key>" \
    -H "Content-Type: application/json" \
    -d '{"threshold": 50}' | jq .
fi
```
| **Pass** | Returns `{"success": true, "distilled_post_id": "uuid", "title": "..."}` |
| **Fail-HTTP** | HTTP 502 (Dify connectivity failure), HTTP 503 (missing config) |
| **Fail-Threshold** | `{"success": false, "message": "Threshold not reached: N < 50"}` |
| **Recovery** | If 502: Check DIFY_BASE_URL and DIFY_WORKFLOW_B_API_KEY secrets. |
| | If 503: Run `npx supabase secrets list` — all 5 Dify secrets must be present. |
| | If threshold: Wait for more fragments, or reduce threshold for testing. |

## V7 — Workflow B Generates Structured Output

| Property | Value |
|----------|-------|
| **Check** | Distilled post follows the production output structure |
| **Command** | |
```bash
curl -s "https://jiwsgaegoudcutdnqydf.supabase.co/rest/v1/distilled_posts?order=created_at.desc&limit=1&select=title,content,summary" \
  -H "apikey: <anon_key>" | jq '.[0]'
```
| **Pass** | Content contains all expected sections without bullet points |
| **Fail** | Content contains bullet points (lines starting with `- `, `* `, or `1.`) |
| **Fail** | Title is generic ("Reflections on...") |
| **Fail** | Content mentions "as an AI" or "language model" |
| **Fail** | Content < 150 words or > 1500 words |

### Automated Content Checks

| Rule | Pass | Fail |
|------|------|------|
| Title length | 10-80 chars | < 10 or > 80 |
| Word count | 300-800 words | < 150 or > 1500 |
| No bullet points | 0 occurrences | ≥ 1 occurrence |
| No numbered lists | 0 occurrences | ≥ 1 occurrence |
| No AI boilerplate | 0 occurrences | "as an AI", "language model", etc. |
| Title is specific | Does not start with "Reflections on" or "Thoughts about" | Starts with generic template |

## V8 — Distilled Post Appears in Featured Resonance

| Property | Value |
|----------|-------|
| **Check** | Published posts appear in the Harmony Pavilion feed |
| **Command** | |
```bash
# Check last 5 published posts
curl -s "https://jiwsgaegoudcutdnqydf.supabase.co/rest/v1/distilled_posts?status=eq.published&order=published_at.desc&limit=5&select=id,title,published_at" \
  -H "apikey: <anon_key>" | jq .
```
| **Pass** | At least 1 post with `status = "published"` and non-null `published_at` |
| **Fail** | No published posts, or `published_at` is null |
| **Recovery** | Check admin review queue — post may be awaiting approval. |
| | Check distilled_posts status: if "draft", run approval flow first. |

### Frontend Verification

Open `http://localhost:5173/harmony-pavilion` (or production URL) and confirm:

| Check | Pass | Fail |
|------|------|------|
| Title visible in feed | ✅ | ❌ |
| Summary visible | ✅ | ❌ |
| Click through to full post | ✅ | ❌ |
| Source metadata visible (N fragments, M contributors) | ✅ | ❌ |

## V9 — Realtime Updates Function Correctly

| Property | Value |
|----------|-------|
| **Check** | New published posts appear in realtime without page refresh |
| **Command** | Open browser DevTools Console, subscribe to channel: |
```javascript
const channel = supabase
  .channel('distilled-posts-changes')
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'distilled_posts',
      filter: 'status=eq.published' },
    (payload) => console.log('New post:', payload.new.title)
  )
  .subscribe()
```
| **Pass** | Console logs the new post title within 5 seconds of insertion |
| **Fail** | No event received after 30 seconds |
| **Recovery** | Check Supabase Realtime is enabled for `distilled_posts` table. |
| | Check RLS policy allows reading published posts: `auth.role() = 'authenticated'`. |

### Realtime Subscription Check

```sql
-- Verify Realtime is enabled
SELECT * FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename = 'distilled_posts';
```

**Pass:** Row returned.
**Fail:** No row — enable Realtime for `distilled_posts` in Supabase dashboard.

## V10 — No RLS Violations for Anonymous Users

| Property | Value |
|----------|-------|
| **Check** | Anonymous (unauthenticated) users cannot access unpublished/raw data |
| **Command** | |
```bash
# Attempt to read raw_fragments as anonymous
curl -s -o /dev/null -w "%{http_code}" \
  "https://jiwsgaegoudcutdnqydf.supabase.co/rest/v1/raw_fragments?limit=1" \
  -H "apikey: <anon_key>"
# Should return 401 or empty array (not fragment data)

# Attempt to read unpublished distilled posts
curl -s \
  "https://jiwsgaegoudcutdnqydf.supabase.co/rest/v1/distilled_posts?status=eq.draft&select=id,title" \
  -H "apikey: <anon_key>" | jq 'length'
# Should return 0 or error
```
| **Pass** | Anonymous requests return 401 or empty arrays for protected tables |
| **Fail** | Anonymous requests return data from `raw_fragments`, or draft `distilled_posts` |
| **Recovery** | Check RLS policies on `raw_fragments` and `distilled_posts`. |
| | Raw fragments: only `status = 'completed'` visible. |
| | Distilled posts: only `status = 'published'` visible. |

### RLS Policy Audit

```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename IN ('raw_fragments', 'distilled_posts', 'categories', 'channels');

-- Verify policies
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('raw_fragments', 'distilled_posts')
ORDER BY tablename, policyname;
```

**Pass:** RLS is enabled on both tables. Policies restrict SELECT to
`status = 'completed'` (raw_fragments) and `status = 'published'`
(distilled_posts).
**Fail:** RLS disabled, or policies missing, or policies too permissive.

---

## Summary Table

| ID | Check | Pass | Fail | Depends On |
|:--:|-------|:----:|:----:|:----------:|
| V1 | Dify reachable from Supabase | HTTP 401 | Timeout/5xx | Tunnel/VPS active |
| V2 | Workflow A executes | `completed` | `pending`/`failed` | V1 + OpenAI key |
| V3 | category_id correct | UUID in categories | Null/wrong UUID | V2 |
| V4 | fragment_type canonical | Valid enum value | Old vocabulary | V2 + DB migration |
| V5 | Embedding 1536-dim | 1536 non-zero | 128/null/zero | V2 + OpenAI key |
| V6 | Master Agent triggers | `success: true` | 502/503 | V1 + V2 + threshold |
| V7 | Workflow B structured | Prose, no lists | Bullet points/AI boilerplate | V6 |
| V8 | Featured Resonance | Published post visible | No published posts | V7 + approval flow |
| V9 | Realtime updates | Event within 5s | No event | V8 + Supabase config |
| V10 | RLS for anonymous | 401/empty | Data leaked | Schema policies |

---

## Quick Reference

### Pass = Continue
```
V1  ✅ → V2  ✅ → V3  ✅ → V4  ✅ → V5  ✅
                                    → V6  ✅ → V7  ✅ → V8  ✅ → V9  ✅
                                                    → V10 ✅
```

### Fail = Stop and Recover
```
Any V1-V5 fail     → Pipeline cannot function. Fix and retry.
V6-V7 fail         → Distillation broken. Roll back Workflow B.
V8-V9 fail         → UI/Realtime issue. Non-blocking for pipeline.
V10 fail           → Security issue. Fix before exposing to users.
```
