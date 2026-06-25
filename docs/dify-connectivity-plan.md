# Dify Connectivity Plan

## Status Update

> **2026-06-12:** Cloudflare Tunnel blocked by Zero Trust payment method
> verification. ngrok (free tier) is now the primary development path. No
> payment method required — just an email-based ngrok account.

---

## Architecture Analysis

### Current Topology

```
                          Cloud (Supabase)
               ┌──────────────────────────────┐
               │  Edge Functions              │
               │  trigger-workflow-a          │
               │  trigger-workflow-b          │
               │  dify-callback (inbound)     │
               └──────────┬───────────────────┘
                          │  DIFY_BASE_URL=http://host.docker.internal
                          │  ⛔ UNREACHABLE from cloud
                          ▼
               ┌──────────────────────────────┐
               │  Your Machine (Windows)      │
               │  192.168.1.7 (LAN)           │
               │                              │
               │  Docker                      │
               │  ┌─── nginx:80/443 ───┐      │
               │  │   (0.0.0.0 bind)  │      │
               │  └────────┬───────────┘      │
               │           │                  │
               │  ┌────────▼───────────┐      │
               │  │  Dify API:5001     │      │
               │  │  Worker            │      │
               │  └────────────────────┘      │
               └──────────────────────────────┘
```

**The problem:** Supabase Cloud Edge Functions need to make HTTP requests to Dify. Dify lives on a Windows machine behind a residential NAT gateway with no public IP. `host.docker.internal` is a Docker-for-Windows loopback alias that only resolves inside the Docker network — it is unreachable from the public internet.

---

## Option Comparison

### Option 1: Cloudflare Tunnel (`cloudflared`)

| Property | Detail |
|----------|--------|
| **Mechanism** | Outbound-only tunnel via `cloudflared` agent → Cloudflare Edge. No open ports required on the host. |
| **Pricing** | Free tier: unlimited tunnels, 50 MB/s bandwidth, no connection limits |
| **Domain** | `*.trycloudflare.com` (ephemeral, free) or your own domain via Cloudflare DNS (requires zone in Cloudflare) |
| **Auth** | Cloudflare Access policies, HMAC tokens, or IP-based restrictions |
| **Setup** | Single binary (`cloudflared`), one command to start tunnel |
| **Latency** | ~5-15ms added (routes through nearest Cloudflare edge PoP) |
| **Reliability** | Auto-reconnects on connection loss. WebSocket-based keepalive. |
| **Termination** | Better (can set service token, JWT validation on tunnel) |
| **Data exposure** | Traffic flows through Cloudflare network (TLS-terminated at edge). Cloudflare sees plaintext if not using E2EE. |
| **Windows support** | Native Windows binary, runs as a service |

**How it works:**
```
User Machine          Cloudflare Edge         Supabase Cloud
┌──────────┐         ┌──────────────┐        ┌──────────────┐
│ cloudflared ├──────►│  CF Network  ├───────►│  Edge Fn     │
│           │  out   │  tunnel end  │  public │  DIFY_BASE   │
│ Dify:80   │  only  │  URL         │  URL    │  _URL =      │
└──────────┘         └──────────────┘        │ tunnel URL   │
                                             └──────────────┘
```

### Option 2: ngrok

| Property | Detail |
|----------|--------|
| **Mechanism** | Outbound tunnel agent → ngrok SaaS edge. No open ports. |
| **Pricing** | Free: random URLs, 40 connections/min, 4 tunnels/min, 1 GB/month traffic |
| | Paid ($10-25/mo): static domains, 200-500 connections/min, reserved subdomains |
| **Domain** | `*.ngrok.io` (free, random) or `*.ngrok.app` (paid, custom) |
| **Auth** | Basic auth, OAuth, JWT, IP whitelist (paid tiers) |
| **Setup** | Single binary, auth token required (free signup) |
| **Latency** | ~10-30ms added (routes through ngrok SaaS edge) |
| **Reliability** | Free tier: connection limits cause 429 errors under load. Paid: more reliable. |
| **Termination** | Good — paid tiers support OAuth, IP whitelist, mTLS |
| **Data exposure** | ngrok terminates TLS at their edge, sees plaintext |
| **Windows support** | Native Windows binary, also available via `winget` or `scoop` |

**How it works:**
```
User Machine              ngrok Cloud           Supabase Cloud
┌──────────┐         ┌──────────────┐        ┌──────────────┐
│ ngrok    ├───────► │  ngrok Edge  ├───────►│  Edge Fn     │
│ Dify:80  │  out    │  public URL  │ public │  DIFY_BASE   │
└──────────┘         └──────────────┘        │ _URL =       │
                                             │ ngrok URL    │
                                             └──────────────┘
```

### Option 3: VPS Deployment (Move Dify to Cloud VM)

| Property | Detail |
|----------|--------|
| **Mechanism** | Deploy Dify Docker Compose on a cloud VM with a public IP |
| **Pricing** | $5-50/mo depending on specs (1-4 vCPU, 2-8 GB RAM) |
| **Domain** | Static public IP (use a DNS A record) |
| **Auth** | Full control — nginx reverse proxy with IP whitelist, mTLS, VPN |
| **Setup** | Provision VM → install Docker → copy Dify configs → `docker compose up` |
| **Latency** | ~1-5ms (same-region cloud) |
| **Reliability** | Highest — cloud VMs have SLAs (99.9%+), no dependency on home internet |
| **Termination** | Full control — can lock down with security groups, nginx allow-lists |
| **Data exposure** | Traffic stays within cloud provider network (if Supabase + VPS same region) |
| **Windows support** | N/A (Linux VM, but Dify Docker setup transfers easily) |

**How it works:**
```
Cloud Provider          VPS (Linux)            Supabase Cloud
┌────────────────┐     ┌──────────────┐        ┌──────────────┐
│ Public IP      │────►│  nginx:443   │───────►│  Edge Fn     │
│ 203.0.113.x   │     │  Dify API    │ public │  DIFY_BASE   │
└────────────────┘     │  Workers     │  URL   │ _URL =       │
                        └──────────────┘        │ vps IP/URL  │
                                                 └──────────────┘
```

---

## Comparison Matrix

| Criterion | Cloudflare Tunnel | ngrok | VPS |
|-----------|:-:|:-:|:-:|
| **Cost** | Free | Free/$10-25mo | $5-50/mo |
| **Setup time** | 30 min | 15 min | 2-4 hours |
| **No open ports** | ✅ | ✅ | ❌ (public IP) |
| **Custom domain** | ✅ (free) | 💰 (paid) | ✅ |
| **Rate limits** | None (free) | 40/min (free) | None |
| **Bandwidth** | 50 MB/s | 1 GB/mo (free) | VM-dependent |
| **Home internet dependency** | ✅ (required) | ✅ (required) | ❌ |
| **Power loss resilience** | ❌ (goes down) | ❌ (goes down) | ✅ (always on) |
| **DDoS protection** | ✅ (built-in) | 💰 (paid) | ❌ (manual) |
| **Auth middleware** | ✅ Access policies | 💰 (paid tiers) | ✅ (manual config) |
| **Data at rest** | Cloudflare edge | ngrok edge | Your VM |
| **Operational burden** | Very low | Very low | Medium |
| **Production readiness** | Moderate | Low | High |

> 💰 = Feature requires paid plan

---

## Recommended Architecture by Environment

### Development (Local machine, your Windows PC)

**Recommendation: ngrok (free tier)**

No payment method required. Email signup only.

Rationale:
- ngrok free tier requires zero payment method — just a free account
- Setup takes 5 minutes from start to running tunnel
- Acceptable rate limits for development: Dify API calls are ~1-2 per fragment
  submission. With 40 connections/min, this handles ~20-40 fragments/minute
  which is far more than development needs
- Auto-reconnects if the agent crashes
- No open ports on your firewall

```
Workflow:
1. Sign up:          https://dashboard.ngrok.com/signup (email + password)
2. Install:          winget install ngrok
3. Auth:             ngrok config add-authtoken <your-token-from-dashboard>
4. Start tunnel:     ngrok http http://localhost:80
5. Get URL:          https://<random>.ngrok.io  (shown in terminal)
6. Set secret:       cd C:\Users\Admin\taomony-v2
                     npx supabase secrets set DIFY_BASE_URL=https://<random>.ngrok.io
7. Test:             node scripts/verify-phase4.mjs
```

**Traffic analysis for dev:**

| Call type | Frequency | Connections per call | Total at 40/min limit |
|-----------|-----------|:-------------------:|:---------------------:|
| Workflow A trigger | Per fragment | 1 POST | ~40 fragments/min |
| Workflow B trigger | Per batch (50 frags) | 1 POST | ~2000 fragments/min |
| Dify verify | Manual | 1 GET | N/A |

The 40 conn/min limit is not a bottleneck for development.

**Zero-signup fallback: localtunnel (if ngrok signup is also blocked)**

If even an email-based ngrok account is not possible, use localtunnel —
zero signup, runs from npx directly:

```
1. Start tunnel:     npx localtunnel --port 80
2. Get URL:          https://<random-id>.loca.lt  (shown in terminal)
3. Set secret:       supabase secrets set DIFY_BASE_URL=https://<random-id>.loca.lt

Caveats:
- Unreliable for sustained use (tunnel drops after ~2 hours)
- No HTTPS for the tunnel endpoint itself
- Bandwidth limited
- Use only for a single verification test
```

### Staging (Pre-production, shared team testing)

**Recommendation: ngrok paid ($10-25/mo) or VPS**

Without Cloudflare, staging options are:

| Option | Payment required | Setup | Reliability |
|--------|:----------------:|:-----:|:-----------:|
| ngrok paid ($10/mo) | ✅ Credit card | 10 min | Good (static domain, 200 conn/min) |
| VPS ($5/mo) | ✅ Credit card | 2-4 hours | Best |

If no payment method is available for staging, continue using ngrok free
tier on the same machine. The only limitation is that the URL changes on
each restart, requiring a Supabase secret update each time.

### Production

#### Tier 1 — Light Production (Low traffic, hobby/early launch)

**Recommendation: ngrok paid ($10/mo) or VPS migration**

If a payment method is available:
- **ngrok paid** ($10/mo): Static domain, 200 connections/min, OAuth/IP
  restrictions, reliable for hobby traffic. The domain stays fixed.
- **VPS** ($5/mo): More work but truly production-ready.

If no payment method is available for production, the current dev setup
(ngrok free) is acceptable for proof-of-concept only. Do not rely on it
for real users.

**Limitation of tunnel approaches:** The Windows machine must stay on and
connected to the internet. Power outages or ISP downtime take Dify offline.

#### Tier 2 — Reliable Production

**Recommendation: VPS (Vultr / Hetzner / DigitalOcean)**

Move Dify Docker Compose to a Linux VPS:

```
Specs:
  Provider:     Hetzner CX22 (2 vCPU, 4 GB RAM, 40 GB SSD)
  Cost:         ~€4.50/mo (~$5/mo)
  Location:     Same region as Supabase project (US/EU)

Setup:
  1. Provision VPS with Docker pre-installed
  2. rsync D:\Developer\dify\docker → /opt/dify on VPS
  3. Set OPENAI_API_KEY in shared.env
  4. docker compose up -d
  5. Configure nginx reverse proxy with SSL (certbot)
  6. Set DIFY_BASE_URL = https://dify.yourdomain.com

Security:
  - UFW: allow 443 only from Supabase IP range (or any for web UI)
  - Fail2ban on nginx
  - Regular Docker image updates (scripted)
```

**Why not a higher-tier option?** Dify is a Docker workload that doesn't need Kubernetes. A single $5-10 VPS handles it comfortably. Kubernetes or dedicated Dify Cloud ($59/mo at the time of writing) only adds cost without benefit for this traffic profile.

---

## Implementation Walkthrough

### A. Development Setup — ngrok (5 minutes, no payment method)

```powershell
# 1. Sign up for a free ngrok account
#    Go to https://dashboard.ngrok.com/signup
#    Enter email + password (no credit card required)

# 2. Install ngrok
winget install ngrok

# 3. Authenticate with your auth token
#    Get your token from: https://dashboard.ngrok.com/get-started/your-authtoken
ngrok config add-authtoken <your-auth-token>

# 4. Start tunnel (leave this terminal open)
ngrok http http://localhost:80
# Output: Forwarding  https://<random-id>.ngrok.io -> http://localhost:80

# 5. In a NEW terminal, set the Supabase secret
cd C:\Users\Admin\taomony-v2
npx supabase secrets set DIFY_BASE_URL=https://<random-id>.ngrok.io

# 6. Verify connectivity
curl -s "https://<random-id>.ngrok.io/v1/workflows/run" ^
  -H "Authorization: Bearer app-6308602c02af4cd0ea12d0139dc6e33ca1cca67ce1398cd6" ^
  -H "Content-Type: application/json" ^
  -d "{\"inputs\":{\"fragment_id\":\"test\",\"content\":\"test\"},\"response_mode\":\"blocking\",\"user\":\"test\"}"
# Expected: HTTP 401 (unauthorized — confirms Dify is reachable)

# 7. Run pipeline verification
node scripts/verify-phase4.mjs
```

### B. Production Setup — VPS Migration (2-4 hours)

```bash
# 1. Provision VPS (e.g., Hetzner CX22, Ubuntu 24.04)
# 2. Install Docker
apt update && apt install -y docker.io docker-compose-v2

# 3. Copy Dify configs from Windows
# On Windows:
rsync -avz "D:\Developer\dify\docker" root@vps-ip:/opt/dify

# 4. Set environment variables (especially OPENAI_API_KEY)
cd /opt/dify/docker
nano envs/core-services/shared.env

# 5. Start Dify
docker compose up -d

# 6. Set up nginx + SSL
apt install -y nginx certbot python3-certbot-nginx
# Configure /etc/nginx/sites-available/dify with reverse proxy to localhost:80
certbot --nginx -d dify.yourdomain.com

# 7. Verify local
curl -s http://localhost/v1/workflows/run -H "Authorization: Bearer <key>" ...

# 8. Update Supabase secret
npx supabase secrets set DIFY_BASE_URL=https://dify.yourdomain.com

# 9. Run verification
node scripts/verify-phase4.mjs
```

---

## Risk Assessment

| Risk | ngrok (free) | ngrok (paid) | VPS | localtunnel |
|------|:------------:|:------------:|:---:|:-----------:|
| Home internet outage | ✅ Possible | ✅ Possible | ❌ Immune | ✅ Possible |
| Payment method needed | ❌ Email only | 💰 Credit card | 💰 Credit card | ❌ None |
| Rate limiting | ✅ 40/min | ✅ 200/min | ❌ None | ✅ Unreliable drops |
| Tunnel agent crash | ✅ Auto-reconnect | ✅ Auto-reconnect | ❌ N/A | ❌ Manual restart |
| TLS exposure | ✅ yes | ✅ yes | ✅ Full control | ❌ No HTTPS |
| Cost | ✅ Free | $10-25/mo | $5/mo | ✅ Free |
| Setup time | 5 min | 10 min | 2-4 hours | 1 min |

---

## Verification Script Enhancements

The verification script at `scripts/verify-phase4.mjs` has been updated with:

1. **Connectivity check step** — Tests if DIFY_BASE_URL is reachable before running pipeline
2. **Tunnel detection** — Reports whether using Cloudflare Tunnel, ngrok, or direct URL
3. **Dify API liveness probe** — Calls `/v1/workflows/run` with invalid auth to verify Dify is running (expects 401, which confirms Dify is reachable)
4. **Secret validation** — Verifies all 5 Dify-related secrets are set
5. **Environment detection** — Identifies dev/staging/production based on DIFY_BASE_URL pattern

See `scripts/verify-phase4.mjs` for the implementation.

---

## Final Recommendation

### Current path (no payment method available):

```
Development:            ngrok free tier (5 min setup)
                        ↓
Staging:                ngrok free tier OR paid tier when available
                        ↓
Production:             VPS ($5/mo, needs payment method)
                        or ngrok paid ($10/mo)
```

### Verdict:

| Phase | Option | Payment | Why |
|-------|--------|:-------:|-----|
| **Development** (now) | ngrok (free) | ❌ None — just email | Ready immediately. 5 min setup. Rate limit fine for dev. |
| **Staging** | ngrok (free) or paid | Depends | If no payment method, use same free tier setup. URL changes on restart. |
| **Production** | VPS (Hetzner $5/mo) | 💰 Needs card | Home machine dependency not acceptable for real users. |

Do not use localtunnel beyond a single smoke test — it drops connections
unpredictably.

### What to do right now:

```powershell
# 1. Sign up at https://dashboard.ngrok.com/signup (email + password)
# 2. Install and auth
winget install ngrok
ngrok config add-authtoken <token-from-dashboard>

# 3. Start tunnel
ngrok http http://localhost:80

# 4. Update Supabase secret (in another terminal)
cd C:\Users\Admin\taomony-v2
npx supabase secrets set DIFY_BASE_URL=https://<id>.ngrok.io

# 5. Verify
node scripts/verify-phase4.mjs
```

### Future (when payment method is available):

1. Upgrade to ngrok paid ($10/mo) for a static domain and higher limits
2. Or migrate Dify to a $5/mo VPS for production reliability

**Migration timeline:**
- ngrok free (dev): ~5 minutes, available now
- VPS (production): ~2-4 hours, blocked until payment method
