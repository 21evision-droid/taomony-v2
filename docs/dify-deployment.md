# Dify Deployment Guide

> Phase 4 — Real Dify Integration
> Date: 2026-06-08

---

## 1. Deployment Options

### Option A: Dify Cloud (Recommended for Start)

Dify Cloud is fully managed, requires no infrastructure, and provides public API
endpoints that Supabase Edge Functions can reach directly.

| Factor | Detail |
|--------|--------|
| URL | https://cloud.dify.ai |
| Setup | Sign up, create organization, create apps |
| Free tier | Sufficient for development and testing |
| Public API | ✅ Reachable from Supabase Edge Functions |
| Callback to Supabase | ✅ Dify HTTP node can POST to any public URL |

### Option B: Self-Hosted with Docker

For full control, Dify can be self-hosted. The Docker Compose deployment is at
`/d/Developer/dify/docker/` (cloned during Phase 4).

```bash
cd /d/Developer/dify/docker
docker compose up -d
# Access at http://localhost
```

If self-hosting, the instance MUST have a public URL (or use ngrok/Cloudflare Tunnel)
so Supabase Edge Functions can reach the Dify API.

---

## 2. Installation Steps (Dify Cloud)

### 2.1 Create Account

1. Go to https://cloud.dify.ai
2. Sign up with email or GitHub
3. Verify email
4. Create a workspace (name: "Taomony")

### 2.2 Configure Model Provider

Dify needs at least one LLM provider configured:

1. Navigate to Settings → Model Provider
2. Add **OpenAI**:
   - API Key: `sk-proxy-be2c7f2665715a2918eb90afecfaca10`
   - Base URL: `https://api.openai.com/v1`
3. Models required:
   - `gpt-4o-mini` — classification and title generation (Workflow A + B)
   - `text-embedding-3-small` — embedding generation (Workflow A)

### 2.3 Create Workflow A — Fragment Classification

1. Click "Create App"
2. Name: `Fragment Classification (Workflow A)`
3. Type: **Workflow** (not Chatbot or Agent)
4. Icon: 🧩
5. Click "Create"

**Import workflow definition:**
1. In the app, click the three-dot menu → "Import DSL"
2. Select `dify-workflows/workflow-a-fragment-classification.yml`
3. Review the imported nodes
4. Click "Publish"

**Configure environment variables:**
1. Navigate to Workflow → Environment Variables
2. Set:
   - `DIFY_CALLBACK_URL`: `https://jiwsgaegoudcutdnqydf.supabase.co/functions/v1/dify-callback`
   - `DIFY_WEBHOOK_SECRET`: (generate a random UUID — see Section 4)
3. Click "Save"

**Get API key:**
1. Navigate to "API Access" in the left sidebar
2. Click "Create API Key"
3. Copy the key — this becomes `DIFY_WORKFLOW_A_API_KEY`
4. Label: `taomony-workflow-a`

### 2.4 Create Workflow B — Distillation

1. Click "Create App"
2. Name: `Fragment Distillation (Workflow B)`
3. Type: **Workflow**
4. Icon: ✨
5. Click "Create"

**Import workflow definition:**
1. Three-dot menu → "Import DSL"
2. Select `dify-workflows/workflow-b-distillation.yml`
3. Review nodes
4. Click "Publish"

**Get API key:**
1. Navigate to "API Access"
2. Click "Create API Key"
3. Label: `taomony-workflow-b`
4. Copy the key — this becomes `DIFY_WORKFLOW_B_API_KEY`

---

## 3. Environment Variables

### 3.1 Supabase Secrets

Set these via the Supabase CLI:

```bash
supabase secrets set DIFY_BASE_URL=https://cloud.dify.ai
supabase secrets set DIFY_CALLBACK_URL=https://jiwsgaegoudcutdnqydf.supabase.co/functions/v1/dify-callback
supabase secrets set DIFY_WORKFLOW_A_API_KEY=<from Section 2.3>
supabase secrets set DIFY_WORKFLOW_B_API_KEY=<from Section 2.4>
supabase secrets set DIFY_WEBHOOK_SECRET=<from Section 4>
```

For self-hosted Dify:

```bash
supabase secrets set DIFY_BASE_URL=http://<your-dify-host>
supabase secrets set DIFY_CALLBACK_URL=https://jiwsgaegoudcutdnqydf.supabase.co/functions/v1/dify-callback
```

### 3.2 Secret Reference

| Secret | Required | Used By | Purpose |
|--------|----------|---------|---------|
| `DIFY_BASE_URL` | Yes | trigger-workflow-a, trigger-workflow-b | Dify instance base URL |
| `DIFY_CALLBACK_URL` | Yes | Dify Workflow A env var | Where Dify POSTs classification results |
| `DIFY_WORKFLOW_A_API_KEY` | Yes | trigger-workflow-a | API key for Workflow A |
| `DIFY_WORKFLOW_B_API_KEY` | Yes | trigger-workflow-b | API key for Workflow B |
| `DIFY_WEBHOOK_SECRET` | Yes | dify-callback | HMAC-SHA256 signing key for webhook verification |

---

## 4. Webhook Security

### 4.1 Generate Webhook Secret

```bash
# Generate a random UUID as the webhook secret
python -c "import uuid; print(uuid.uuid4().hex)"
# Output: 7a3f5b8e... (64 hex chars)
```

### 4.2 Signature Calculation

The `dify-callback` Edge Function uses HMAC-SHA256 for request verification.

**Signature format:**
```
payload = timestamp + "." + raw_body
signature = HMAC_SHA256(webhook_secret, payload)
```

**HTTP headers the Dify workflow must include:**
| Header | Value |
|--------|-------|
| `x-webhook-signature` | Hex digest of HMAC-SHA256 |
| `x-webhook-timestamp` | Current Unix time in milliseconds |
| `x-webhook-nonce` | Unique UUID (never reused) |

### 4.3 Verification Flow

```
Incoming request
    │
    ▼
1. Check x-webhook-signature present?        ──NO──→ 401
    │
    YES
    ▼
2. Check x-webhook-timestamp present?         ──NO──→ 401
    │
    YES
    ▼
3. Check timestamp within ±5 minutes?         ──NO──→ 401 (replay)
    │
    YES
    ▼
4. Recompute HMAC and compare?               ──NO──→ 403
    │
    YES
    ▼
5. Check nonce in workflow_events?           ──FOUND──→ 409 (replay)
    │
    NOT FOUND
    ▼
   Process request
```

### 4.4 Configuring in Dify Workflow A

The HTTP Request node in Workflow A must be configured to send these headers.
The DSL file `dify-workflows/workflow-a-fragment-classification.yml` includes
the `x-webhook-secret` header configuration.

**Required changes after import:**

Due to Dify's environment variable system, the HTTP Request node needs:

1. Set the `x-webhook-secret` header to your generated secret value
2. Add `x-webhook-timestamp` with the current timestamp
3. Add `x-webhook-nonce` with a random UUID

The HTTP node URL should be set via the `DIFY_CALLBACK_URL` environment variable.

> **Note**: Dify's HTTP Request node may not support dynamic header values
> (timestamp, nonce) natively. In that case, the Edge Function accepts requests
> with only the `x-webhook-secret` header for backward compatibility.
> Full HMAC verification is enabled when all three security headers are present.

---

## 5. API Contracts

### 5.1 Workflow A — Fragment Classification

**Trigger endpoint (Edge Function):**
```
POST https://jiwsgaegoudcutdnqydf.supabase.co/functions/v1/trigger-workflow-a
Body: { "fragment_id": "uuid" }
Auth: Supabase anon key (frontend) or service_role key (backend)
```

**Dify Workflow A input:**
```json
{
  "inputs": {
    "fragment_id": "uuid",
    "content": "fragment text content",
    "channel_id": "uuid (optional)"
  },
  "response_mode": "blocking",
  "user": "taomony-system"
}
```

**Dify Workflow A callback:**
```
POST https://jiwsgaegoudcutdnqydf.supabase.co/functions/v1/dify-callback
Headers:
  x-webhook-signature: <HMAC-SHA256 hex digest>
  x-webhook-timestamp: <unix ms>
  x-webhook-nonce: <UUID>
Body: { "fragment_id", "category_id", "fragment_type", "embedding", "tags", "status" }
```

### 5.2 Workflow B — Distillation

**Trigger endpoint (Edge Function):**
```
POST https://jiwsgaegoudcutdnqydf.supabase.co/functions/v1/trigger-workflow-b
Body: { "threshold": 50 }  (optional, defaults to 50)
Auth: Service role key (backend only)
```

**Dify Workflow B input:**
```json
{
  "inputs": {
    "fragments": [
      {
        "id": "uuid",
        "content": "fragment text",
        "category_id": "uuid",
        "user_id": "uuid"
      }
    ]
  },
  "response_mode": "blocking",
  "user": "taomony-system"
}
```

---

## 6. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (unchanged)                     │
│  FragmentComposer ──→ supabase.from('raw_fragments').insert()   │
│  HarmonyResonance ──→ processFragment(id)                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    difyProcessor.js (client)                     │
│  supabase.functions.invoke('trigger-workflow-a', { fragment_id })│
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│          SUPABASE EDGE FUNCTION: trigger-workflow-a             │
│  1. Fetch fragment from DB                                      │
│  2. Log workflow_event (status: started)                        │
│  3. POST to Dify Workflow A API                                 │
│  4. Return workflow_run_id                                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │ DIFY WORKFLOW A
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  DIFY WORKFLOW A — Fragment Classification                     │
│  1. LLM: Classify content → category_slug                      │
│  2. Code: Map slug → UUID                                      │
│  3. LLM: Determine fragment_type                               │
│  4. Code: Generate embedding                                   │
│  5. HTTP: POST callback to dify-callback                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │ CALLBACK
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│          SUPABASE EDGE FUNCTION: dify-callback                  │
│  1. Verify HMAC signature                                       │
│  2. Check timestamp (±5 min)                                   │
│  3. Check nonce (replay protection)                             │
│  4. Update raw_fragments: status, category_id, fragment_type,   │
│     embedding, tags                                            │
└─────────────────────────────────────────────────────────────────┘

                      [accumulate 50 completed fragments]
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│          SUPABASE EDGE FUNCTION: trigger-workflow-b             │
│  1. Query 50 oldest undistilled completed fragments             │
│  2. Log workflow_event (status: started)                        │
│  3. POST batch to Dify Workflow B API                          │
│  4. Insert result into distilled_posts                          │
│  5. Mark fragments is_distilled = true                         │
│  6. Log master_agent_logs                                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │ DIFY WORKFLOW B
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  DIFY WORKFLOW B — Fragment Distillation                       │
│  1. Code: Analyze batch (dominant category, contributor count)  │
│  2. LLM: Generate title                                         │
│  3. LLM: Write distilled content                               │
│  4. Code: Extract summary                                       │
│  5. Return { title, content, summary, source_fragment_ids }    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. File Reference

| File | Purpose |
|------|---------|
| `dify-workflows/workflow-a-fragment-classification.yml` | Dify DSL — Workflow A definition |
| `dify-workflows/workflow-b-distillation.yml` | Dify DSL — Workflow B definition |
| `supabase/functions/trigger-workflow-a/index.ts` | Edge Function — calls Dify Workflow A |
| `supabase/functions/trigger-workflow-b/index.ts` | Edge Function — calls Dify Workflow B |
| `supabase/functions/dify-callback/index.ts` | Edge Function — receives Dify callback |
| `src/lib/difyProcessor.js` | Client — calls trigger-workflow-a |
| `src/lib/masterAgentProcessor.js` | Client — calls trigger-workflow-b |
| `src/lib/mockCategories.js` | Mock data for fallback mode |
| `supabase/migrations/20260608000000_create_observability_tables.sql` | Observability tables |
| `docs/dify-integration-readiness.md` | Phase 3E audit (pre-deployment) |
