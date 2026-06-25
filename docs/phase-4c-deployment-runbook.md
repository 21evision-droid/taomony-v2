# Phase 4C — Deployment Runbook

## Overview

This runbook defines the exact execution order for deploying all Phase 4
changes to production. Each step lists the action, expected state before
the step, the command(s) to run, and verification.

**Prerequisites before starting Step 1:**
- Cloudflare Tunnel (or VPS) active and Dify publicly reachable
- Valid OpenAI API key available
- This repo cloned locally: `C:\Users\Admin\taomony-v2`
- Dify Docker Compose at: `D:\Developer\dify\docker`
- Supabase CLI authenticated: `npx supabase --version`

---

## Execution Order

### Step 1 — Enable Public Dify URL

**Before:** Dify is running on localhost:80 only.
**After:** Dify is reachable at a public URL from Supabase Cloud.

#### Option A: ngrok (Development — no payment method)

```powershell
# 1. Sign up for free ngrok account (email + password, no credit card)
#    https://dashboard.ngrok.com/signup

# 2. Install ngrok
winget install ngrok

# 3. Authenticate (get token from https://dashboard.ngrok.com/get-started/your-authtoken)
ngrok config add-authtoken <your-auth-token>

# 4. Start tunnel (leave this terminal open)
ngrok http http://localhost:80
# Output: Forwarding  https://<random-id>.ngrok.io -> http://localhost:80

# 5. In a second terminal, update Supabase secret
cd C:\Users\Admin\taomony-v2
npx supabase secrets set DIFY_BASE_URL=https://<random-id>.ngrok.io
```

#### Option B: VPS (Production)

```bash
# On VPS (Ubuntu 24.04):
apt update && apt install -y docker.io docker-compose-v2 nginx certbot python3-certbot-nginx

# Copy Dify configs
rsync -avz "D:\Developer\dify\docker" root@<vps-ip>:/opt/dify

# Configure environment
cd /opt/dify/docker
nano envs/core-services/shared.env
# Set OPENAI_API_KEY

# Start Dify
docker compose up -d

# Configure nginx
cat > /etc/nginx/sites-available/dify << 'EOF'
server {
    listen 443 ssl;
    server_name dify.yourdomain.com;
    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
    }
}
EOF
ln -s /etc/nginx/sites-available/dify /etc/nginx/sites-enabled/
certbot --nginx -d dify.yourdomain.com

# Update Supabase secret
npx supabase secrets set DIFY_BASE_URL=https://dify.yourdomain.com
```

**Verify:**
```bash
curl -s "<DIFY_BASE_URL>/v1/workflows/run" \
  -H "Authorization: Bearer app-xxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{"inputs":{"test":true},"response_mode":"blocking","user":"test"}'
# Expected: 401 (unauthorized — means Dify is reachable)
```

---

### Step 2 — Configure OpenAI Credentials in Dify

**Before:** `shared.env` has placeholder API key. Dify provider credentials
not set.
**After:** OpenAI provider configured in Dify with valid API key.

#### 2a — Set API key in shared.env

```powershell
# Edit the shared.env file
notepad D:\Developer\dify\docker\envs\core-services\shared.env
# Replace: OPENAI_API_KEY=sk-proxy-...
# With:    OPENAI_API_KEY=sk-your-real-key-here

# If on VPS:
# ssh root@vps-ip
# nano /opt/dify/docker/envs/core-services/shared.env
```

#### 2b — Restart Dify services

```powershell
cd D:\Developer\dify\docker
docker compose up -d api worker
# If on VPS:
# ssh root@vps-ip && cd /opt/dify/docker && docker compose up -d api worker
```

#### 2c — Set provider credentials via Dify API

```powershell
# 1. Login to Dify console to get CSRF token and session cookie
# (Open http://localhost in browser, login as admin@taomony.com:Taomony2024!)

# 2. Get CSRF token from cookie
# Open DevTools → Application → Cookies → csrf_token

# 3. POST OpenAI credentials
curl -s -b /tmp/dify_cookies.txt "http://localhost/console/api/workspaces/current/model-providers/openai/credentials" `
  -H "Content-Type: application/json" `
  -H "X-CSRF-Token: <csrf_token>" `
  -X POST `
  -d '{"credentials":{"openai_api_key":"sk-your-real-key-here"}}'
# Expected: {"result":"success"}
```

**Verify:**
```bash
# Check that the plugin daemon has OpenAI available
curl -s -b /tmp/dify_cookies.txt \
  "http://localhost/console/api/workspaces/current/plugin/list?page=1&page_size=50" \
  -H "X-CSRF-Token: <csrf_token>"
# Expected: OpenAI plugin appears with status "ready"
```

---

### Step 3 — Apply DB Migration for fragment_type Alignment

**Before:** `fragment_type` CHECK constraint allows `fragment`, `reflection`,
`extended_fragment`.
**After:** CHECK constraint allows `fragment`, `short_article`, `long_article`,
`image`, `youtube_link`. Existing rows backfilled.

```powershell
# Connect to Supabase SQL editor or run via psql
# Navigate to: https://supabase.com/dashboard/project/jiwsgaegoudcutdnqydf/sql/new

-- Migration: Update fragment_type CHECK constraint
BEGIN;

-- 1. Backfill existing values
UPDATE raw_fragments
SET fragment_type = CASE
  WHEN fragment_type = 'reflection' THEN 'short_article'
  WHEN fragment_type = 'extended_fragment' THEN 'long_article'
  ELSE fragment_type
END
WHERE fragment_type IN ('reflection', 'extended_fragment');

-- 2. Drop old constraint
ALTER TABLE raw_fragments DROP CONSTRAINT IF EXISTS raw_fragments_fragment_type_check;

-- 3. Add new constraint
ALTER TABLE raw_fragments ADD CONSTRAINT raw_fragments_fragment_type_check
  CHECK (fragment_type IN ('fragment', 'short_article', 'long_article', 'image', 'youtube_link'));

COMMIT;
```

**Verify:**
```sql
-- Check that constraint accepts new values
SELECT fragment_type, COUNT(*) FROM raw_fragments GROUP BY fragment_type;
-- Expected: only 'fragment', 'short_article', 'long_article', 'image', 'youtube_link'

-- Check no 'reflection' or 'extended_fragment' remain
SELECT COUNT(*) FROM raw_fragments WHERE fragment_type IN ('reflection', 'extended_fragment');
-- Expected: 0

-- Verify constraint enforcement
INSERT INTO raw_fragments (id, user_id, content, channel_id, source_type, fragment_type, status)
VALUES (gen_random_uuid(), (SELECT id FROM auth.users LIMIT 1), 'test', 
        (SELECT id FROM channels LIMIT 1), 'fragment', 'invalid_type', 'pending');
-- Expected: ERROR — new row violates check constraint
```

---

### Step 4 — Update Workflow A Prompt and Mapping

**Before:** Workflow A Node 2 prompt has 5 categories (missing governance).
Node 3 mapping has 5 entries (missing governance). Node 4 prompt uses
`reflection`/`extended_fragment` vocabulary.
**After:** All 6 categories in prompt + mapping. Canonical content types.

This step uses the Dify Python API script approach (same method used during
initial import).

#### 4a — Update Workflow A via Python API

```powershell
# Read the fix script to Docker container
type D:\Developer\dify-workflows\update_workflow_a.py | docker exec -i docker-api-1 python3
```

The script should:

1. **Node 2 (LLM Classify) — Update system prompt:**
   - Add `governance` category with description
   - Change `eating` → `taomony-eating`
   - Change `harmony` → `harmony-resonance`

2. **Node 3 (Code Map) — Update mapping dict:**
   - Add `"governance": "a0000000-0000-4000-8000-000000000005"`
   - Change `"eating"` → `"taomony-eating"`
   - Change `"harmony"` → `"harmony-resonance"`

3. **Node 4 (LLM Fragment Type) — Update prompt:**
   - Replace `reflection`/`extended_fragment` with `short_article`/`long_article`

#### 4b — Publish and verify

```python
# The script calls:
svc.sync_draft_workflow(app_model=app, graph=new_graph, ...)
svc.publish_workflow(...)
```

**Verify:**
```bash
# Submit test fragments via trigger-workflow-a
# and check raw_fragments for correct category_id and fragment_type
```

---

### Step 5 — Replace Embedding Node (Code Node → OpenAI HTTP Node)

**Before:** Workflow A Node 5 is a Python code node generating SHA-256 hash.
**After:** Node 5 is an HTTP Request node calling OpenAI embeddings API.

#### 5a — Remove old code-embedding node

In the Dify workflow editor:
1. Delete Node 5 (Prepare Embedding — code node)
2. Disconnect edges from Node 5

#### 5b — Add HTTP Request node

Add a new node with these settings:

| Field | Value |
|-------|-------|
| **Type** | `http_request` |
| **Method** | `POST` |
| **URL** | `https://api.openai.com/v1/embeddings` |
| **Authorization** | API Key → Bearer |
| **API Key** | `{{#env.OPENAI_API_KEY#}}` |
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

**Response variable:** `embedding` → extract from `result.data[0].embedding`

#### 5c — Wire edges

```
code-map-category ──► HTTP Embedding ──► http-callback
                              ▲
start ──► llm-fragment-type ──┘
```

The embedding node receives:
- `category_slug` from code-map-category
- `content` from start
- `OPENAI_API_KEY` from Dify environment variables

#### 5d — Update HTTP Callback body

Ensure Node 6 (http-callback) body includes the new embedding variable:
```json
{
  "fragment_id": "{{#start.fragment_id#}}",
  "category_id": "{{#code-map-category.category_id#}}",
  "fragment_type": "{{#llm-fragment-type.text#}}",
  "embedding": {{#http-embedding.embedding#}},
  "tags": {{#code-embedding.tags#}},
  "status": "completed"
}
```

Note: If tags are no longer generated (old tags node removed), drop `tags`
from the callback body or replace with an empty array.

**Verify:**
```bash
# Run a test fragment through the pipeline
# Check raw_fragments:
#   SELECT id, length(embedding) AS dims,
#          embedding[1:5] AS sample_values
#   FROM raw_fragments
#   WHERE embedding IS NOT NULL
#   LIMIT 1;
# Expected: dims = 1536, sample_values = non-zero floats
```

---

### Step 6 — Update Workflow B Prompt

**Before:** Workflow B Node 4 uses old prompt with bullet-point structure.
**After:** Node 4 uses the production prompt (pattern discovery, prose-only).

#### 6a — Update via Python API

```powershell
type D:\Developer\dify-workflows\update_workflow_b.py | docker exec -i docker-api-1 python3
```

The script updates:

1. **Node 3 (LLM Title) — System prompt:**
   - Replace with production title prompt (specific titles, no templates)

2. **Node 4 (LLM Content) — System prompt:**
   - Replace with complete production prompt
   - New structure: Title → Summary → Main Insight → Collective Reflection → Practical Application

#### 6b — Publish and verify

**Verify:**
```bash
# Trigger workflow-b with a batch of fragments
# Check distilled_posts for:
#   - No bullet points in content
#   - Main Insight paragraph present
#   - Word count between 300-800
#   - No AI boilerplate phrases
```

---

### Step 7 — Deploy Updated Edge Functions

**Before:** Edge Functions have no changes yet.
**After:** Edge Functions are deployed with any needed updates.

#### 7a — Deploy functions

```powershell
cd C:\Users\Admin\taomony-v2

# Deploy all functions
npx supabase functions deploy trigger-workflow-a
npx supabase functions deploy trigger-workflow-b
npx supabase functions deploy dify-callback
npx supabase functions deploy submit-fragment
```

#### 7b — Verify secrets

```powershell
npx supabase secrets list
# Confirm all 5 Dify secrets are present:
#   DIFY_BASE_URL
#   DIFY_CALLBACK_URL
#   DIFY_WORKFLOW_A_API_KEY
#   DIFY_WORKFLOW_B_API_KEY
#   DIFY_WEBHOOK_SECRET
```

---

### Step 8 — Run End-to-End Verification

```powershell
cd C:\Users\Admin\taomony-v2
node scripts/verify-phase4.mjs
```

The script runs all 10 verification steps (see
`phase-4c-verification-checklist.md` for detailed pass/fail criteria).

---

### Step 9 — Rollback Procedures

#### Rollback Trigger Conditions

Execute rollback if any of these occur:

| Condition | Severity |
|-----------|----------|
| Step 2c fails (OpenAI credentials rejected) | High — block all LLM/embedding calls |
| Step 3 migration causes existing fragment reads to fail | Critical |
| Step 4 publish causes Workflow A API to return errors | High |
| Step 5 embedding requests fail or return wrong dimensions | Medium |
| Step 6 publish causes Workflow B API to return errors | High |
| Step 8 shows any Step 2-6 verification failures | High |

#### Rollback Step 1: Workflow A — Restore previous published version

```python
# In Dify API Python shell:
from models.workflow import Workflow

# Find the previous version (before update)
previous = db.session.query(Workflow).filter(
    Workflow.app_id == "51afea35-4f1f-45af-ba85-7d8360af6421",
    Workflow.version != Workflow.VERSION_DRAFT,
).order_by(Workflow.created_at.desc()).offset(1).first()

if previous:
    # Restore app.workflow_id to previous version
    app = db.session.query(App).filter(App.id == "51afea35-4f1f-45af-ba85-7d8360af6421").first()
    app.workflow_id = previous.id
    db.session.commit()
```

#### Rollback Step 2: Workflow B — Restore previous published version

```python
# Same as Step 1 but for Workflow B app ID: "cc5ad940-555b-479f-9ae7-952e63504da5"
```

#### Rollback Step 3: DB Migration (reverse)

```sql
-- Undo migration
BEGIN;
ALTER TABLE raw_fragments DROP CONSTRAINT IF EXISTS raw_fragments_fragment_type_check;
ALTER TABLE raw_fragments ADD CONSTRAINT raw_fragments_fragment_type_check
  CHECK (fragment_type IN ('fragment', 'extended_fragment', 'reflection'));
-- Backfill to old values
UPDATE raw_fragments SET fragment_type = 'reflection' WHERE fragment_type = 'short_article';
UPDATE raw_fragments SET fragment_type = 'extended_fragment' WHERE fragment_type = 'long_article';
COMMIT;
```

#### Rollback Step 4: Supabase secrets

```powershell
# Restore DIFY_BASE_URL to previous value (e.g., if ngrok tunnel changed)
npx supabase secrets set DIFY_BASE_URL=<previous-working-url>
```

#### Rollback Step 5: Edge Functions

```powershell
# Deploy previous version from git
git checkout HEAD~1 -- supabase/functions/
npx supabase functions deploy trigger-workflow-a
npx supabase functions deploy trigger-workflow-b
npx supabase functions deploy dify-callback
npx supabase functions deploy submit-fragment
```

#### Rollback Timing

| Step | Expected duration |
|------|-----------------|
| Workflow A rollback | ~2 minutes |
| Workflow B rollback | ~2 minutes |
| DB migration rollback | ~1 minute |
| Supabase secrets | ~1 minute |
| Edge Functions rollback | ~3 minutes |
| **Total worst case** | **~9 minutes** |

---

## Pipeline State Diagram

```
Step 1: Tunnel active ──► Dify reachable at public URL
         │
Step 2: OpenAI key set ──► LLM + embedding calls work
         │
Step 3: DB migration ──► fragment_type accepts canonical values
         │
Step 4: Workflow A update ──► 6 categories, canonical types
         │
Step 5: Embedding node ──► Real 1536-dim vectors
         │
Step 6: Workflow B update ──► Production prompt, prose output
         │
Step 7: Edge Functions ──► Latest code deployed
         │
Step 8: Verification ──► All checks pass
```

Each step depends on the previous one. Do not skip steps.
