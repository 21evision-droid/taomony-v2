# Phase 4 — Dify Integration Configuration

## Overview

This document describes every configuration point required for the Dify
integration. Some values are already set; others require production credentials
from the project owner.

---

## 1. OpenAI API Key (Required for LLM nodes)

| Item | Value |
|------|-------|
| Config file | `D:\Developer\dify\docker\envs\core-services\shared.env` |
| Variable | `OPENAI_API_KEY` |
| Status | ❌ **Waiting for Production Credentials** |
| Where to get | [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys) |

Setting it:

```
OPENAI_API_KEY=sk-your-real-key-here
```

Then restart the API and worker containers:

```bash
cd D:\Developer\dify\docker
docker compose up -d api worker
```

### How to verify

```bash
curl -s http://localhost/v1/workflows/run \
  -H "Authorization: Bearer <DIFY_WORKFLOW_A_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "inputs": {
      "fragment_id": "00000000-0000-0000-0000-000000000000",
      "content": "Test fragment content here"
    },
    "response_mode": "blocking",
    "user": "96c04d6f-dbdc-4c96-819c-de05b0e3a333"
  }'
```

Expected success response:
```json
{
  "workflow_run_id": "...",
  "data": {
    "id": "...",
    "workflow_id": "...",
    "status": "succeeded",
    "outputs": {
      "category_id": "a0000000-...",
      "category_slug": "meditate",
      "fragment_type": "fragment",
      "embedding": [...],
      "tags": [...]
    },
    ...
  }
}
```

---

## 2. Dify Environment Variables (Workflow A Callback)

These variables are already set in the Dify workflow graph (stored in the
workflow draft). The HTTP Request node in Workflow A uses them to POST the
classification result back to Supabase.

| Variable | Current Value | Purpose |
|----------|---------------|---------|
| `DIFY_CALLBACK_URL` | `https://jiwsgaegoudcutdnqydf.supabase.co/functions/v1/dify-callback` | Edge Function that receives classification results |
| `DIFY_WEBHOOK_SECRET` | `7a3f5b8e2c1d4a9f` | HMAC-SHA256 signing key for callback verification |

These are **already configured** in the workflow draft. No action needed.

---

## 3. Supabase Secrets (Edge Functions → Dify)

Set via `supabase secrets set` in the project root.

| Secret | Current Value | Purpose |
|--------|---------------|---------|
| `DIFY_BASE_URL` | `http://host.docker.internal` | URL Supabase Edge Functions use to reach Dify API |
| `DIFY_CALLBACK_URL` | `https://jiwsgaegoudcutdnqydf.supabase.co/functions/v1/dify-callback` | Full URL to the callback Edge Function |
| `DIFY_WORKFLOW_A_API_KEY` | `app-6308602c02af4cd0ea12d0139dc6e33ca1cca67ce1398cd6` | API key for Dify Workflow A |
| `DIFY_WORKFLOW_B_API_KEY` | `app-f32e2560061ba1441aaec710164f39b512d35c3f71a85fa2` | API key for Dify Workflow B |
| `DIFY_WEBHOOK_SECRET` | `7a3f5b8e2c1d4a9f` | HMAC signing key (must match Dify's `DIFY_WEBHOOK_SECRET`) |

**Current status**: All ✅ set.

**⚠️ `DIFY_BASE_URL` caveat**: Currently set to `http://host.docker.internal`
which only works if Supabase Edge Functions are run locally via `supabase
functions serve`. For cloud-deployed Edge Functions, this needs a tunnel.

See **[docs/dify-connectivity-plan.md](./dify-connectivity-plan.md)** for a
detailed comparison of Cloudflare Tunnel, ngrok, and VPS deployment options,
with step-by-step setup instructions for each environment.

---

## 4. Dify Container Plugin Configuration

The following docker-compose environment variables were added/modified for
Dify v1.14.2 plugin system compatibility:

| Variable | File | Purpose |
|----------|------|---------|
| `PLUGIN_DAEMON_URL` | `docker-compose.yaml` (api service) | Set to `http://plugin_daemon:5002` (was `localhost:5002`) |
| `PLUGIN_DAEMON_KEY` | `docker-compose.yaml` (api service) | Set to match plugin daemon's `SERVER_KEY` |

These are **already configured** in `D:\Developer\dify\docker\docker-compose.yaml`.

---

## 5. Installed Plugins

The **OpenAI** plugin (`langgenius/openai` v0.4.2) is installed in Dify's
plugin daemon. It is **waiting for a valid API key** (see Section 1).

To verify installation:

```bash
curl -s -b /tmp/dify_cookies.txt \
  "http://localhost/console/api/workspaces/current/plugin/list?page=1&page_size=50" \
  -H "X-CSRF-Token: <csrf_token>"
```

Expected: OpenAI appears in the plugin list.

---

## 6. Workflow Status Summary

| Workflow | App ID | API Key | Published | Status |
|----------|--------|---------|-----------|--------|
| A — Fragment Classification | `51afea35-4f1f-45af-ba85-7d8360af6421` | `app-6308602c02...` | ✅ Published | ✅ Ready |
| B — Fragment Distillation | `cc5ad940-555b-479f-9ae7-952e63504da5` | `app-f32e256006...` | ✅ Published | ✅ Ready |

Both workflows are imported, published, and have valid API tokens. They will
execute LLM nodes once a valid OpenAI API key is configured.

---

## 7. Quick Start — First-Time Setup

```bash
# 0. (If using cloud Edge Functions) Set up tunnel first
#    See docs/dify-connectivity-plan.md for options
#    Quickest dev option (ngrok, no payment method):
#    1. Sign up: https://dashboard.ngrok.com/signup
#    2. Install: winget install ngrok
#    3. Auth:    ngrok config add-authtoken <token>
#    4. Tunnel:  ngrok http http://localhost:80
#    5. Set URL: supabase secrets set DIFY_BASE_URL=https://<id>.ngrok.io

# 1. Set your OpenAI API key
echo "OPENAI_API_KEY=sk-..." > D:\Developer\dify\docker\envs\core-services\shared.env

# 2. Restart Dify services
cd D:\Developer\dify\docker
docker compose up -d api worker

# 3. Set the OpenAI provider credentials via Dify console API
#    (login first to get CSRF token)
B64_PW=$(echo -n "admin@taomony.com:Taomony2024!" | base64 -w 0)
#    then POST to /console/api/workspaces/current/model-providers/openai/credentials

# 4. Run verification
node scripts/verify-phase4.mjs
```

---

## 8. Verification Script

The verification script at `scripts/verify-phase4.mjs` tests the complete
pipeline. It handles partial configuration gracefully.

```bash
node scripts/verify-phase4.mjs
```

Steps:
1. Submit a fragment → `raw_fragments` insert
2. Call `trigger-workflow-a` Edge Function
3. Poll for callback (needs OpenAI key in Dify)
4. Check threshold (50 fragments needed)
5. Call `trigger-workflow-b` Edge Function (skipped if threshold not met)
6. Verify distilled post (skipped)
7. Check Featured Resonance (skipped)
