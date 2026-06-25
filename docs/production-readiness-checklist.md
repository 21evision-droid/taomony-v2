# Production Readiness Checklist

> Phase 3E — Priority 5
> Date: 2026-06-07
> Scope: Pre-launch verification for Taomony v2

---

## Instructions

For each item, check the box when the criterion is verified. Leave unchecked and note
the issue if not yet satisfied. The checklist is organized by layer and severity.

**Legend:** 🔴 BLOCKER | 🟡 HIGH | 🟢 MEDIUM | 🔵 LOW

---

## 1. Security

### 1.1 Row-Level Security (RLS)

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 🔴 | `distilled_posts` — anon can SELECT published posts | ✅ FIXED | Migration `20260606120000` applied. Policy: `USING (status = 'published')` |
| 🔴 | Service role key removed from client code | ✅ FIXED | `window.__taoAdminDb` removed from `index.html` |
| 🟡 | `raw_fragments` — users can only SELECT/INSERT own fragments | ⚠️ VERIFY | Check RLS policies: should filter by `auth.uid() = user_id` |
| 🟡 | `raw_fragments` — UPDATE only allowed for own pending fragments | ⚠️ VERIFY | Prevent users from modifying others' fragments |
| 🟡 | `channels` — anon can SELECT published channels | ⚠️ VERIFY | Frontend loads channels — must be readable |
| 🟡 | `categories` — anon can SELECT categories | ⚠️ VERIFY | Frontend loads categories — must be readable |
| 🟢 | `distilled_posts` — authenticated users can SELECT drafts | ✅ ACCEPTABLE | Only admins need draft access. Anon sees published only. |
| 🔵 | Realtime channels filtered to avoid processing extra events | 🔲 OPTIONAL | Add `filter: 'status=eq.published'` to `distilled-posts-realtime` |

### 1.2 Authentication

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 🔴 | Auth session validation on all Edge Functions | ✅ DONE | `submit-fragment` validates via `withSupabase({ auth: ["publishable", "secret"] })` |
| 🟡 | Password strength policy configured | ⚠️ VERIFY | Check Supabase Auth settings — min 8 chars, rate limiting |
| 🟡 | Email confirmation enabled for new sign-ups | ⚠️ VERIFY | Important to prevent bot sign-ups |
| 🟢 | Rate limiting on auth endpoints | ⚠️ VERIFY | Supabase Auth has built-in rate limiting — confirm enabled |

### 1.3 Edge Functions

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 🔴 | JWT verification disabled for `submit-fragment` | ⚠️ NOTE | `verify_jwt = false` in `config.toml` because `withSupabase` handles auth manually. Intentional, but verify. |
| 🟡 | `dify-callback` has webhook secret validation | ✅ DONE | Validates `x-webhook-secret` against `DIFY_WEBHOOK_SECRET` |
| 🟡 | `DIFY_WEBHOOK_SECRET` env var set | ❌ NOT SET | Must be configured before Dify integration |
| 🟡 | No secrets leak in function responses | ⚠️ VERIFY | Check error messages don't reveal internal details |
| 🟢 | CORS policy restricts origins | ⚠️ VERIFY | Default Supabase allows all — restrict if needed |

### 1.4 Secrets Management

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 🟡 | `.env.local` contains anon key only (not service_role key) | ✅ DONE | Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` |
| 🟡 | No hardcoded secrets in source code | ⚠️ VERIFY | `scripts/verify-index.mjs` and test scripts contain SRK — dev-only files |
| 🟢 | `SUPABASE_SERVICE_ROLE_KEY` only used in Edge Functions | ✅ DONE | Only in `dify-callback` and `submit-fragment` server-side code |

---

## 2. Database

### 2.1 Migrations

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 🔴 | All migrations applied to production database | ⚠️ BLOCKED | `20260606` version mismatch prevents clean `db push`. Workaround: repair before each push. |
| 🟡 | Migration rollback procedure documented | ❌ NOT DONE | Need strategy for reverting failed migrations |
| 🟢 | Old-named migrations (`create_profiles.sql`, etc.) reconciled | ⚠️ ONGOING | These are skipped by CLI but affect version comparison |
| 🔵 | Migration `20260606` version mismatch resolved | ⚠️ KNOWN | Local file `20260606_add_harmony_resonance_category.sql` vs remote `20260606` entry. Needs permanent fix. |

### 2.2 Indexes

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 🟡 | Composite index for distillation query | ✅ DONE | `idx_raw_fragments_distillation_pickup` on `(status, is_distilled, created_at ASC)` |
| 🟡 | Index coverage for fragment feed queries | ✅ ACCEPTABLE | `channel_id`, `user_id`, `status`, `created_at DESC` exist |
| 🟡 | Index coverage for distilled_posts queries | ✅ ACCEPTABLE | `status`, `published_at DESC`, `created_at DESC` exist |
| 🔵 | Index usage verified via `EXPLAIN ANALYZE` | ⚠️ RECOMMENDED | Should verify at scale before production |

### 2.3 Data Integrity

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 🔴 | `category_id` auto-populated on fragment INSERT | ✅ FIXED | DB trigger `trg_fill_category_id` catches all insert paths |
| 🔴 | `category_id` also set explicitly in Edge Function | ✅ DONE | `submit-fragment` resolves from `channels.category_id` |
| 🟡 | Seed script sets `category_id` correctly | ✅ FIXED | Updated to resolve from channel→category mapping |
| 🟡 | No orphan fragments referencing deleted channels | ⚠️ VERIFY | Check FK constraints or add cleanup policy |
| 🟢 | `is_distilled` flag properly maintained | ✅ DONE | Set to true during distillation pipeline |

### 2.4 Backup & Recovery

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 🔴 | Daily automated backups configured | ⚠️ VERIFY | Check Supabase Project Settings > Database > Backups |
| 🟡 | Point-in-time recovery (PITR) enabled | ⚠️ VERIFY | Recommended for production (additional cost) |
| 🟡 | Backup restoration tested | ❌ NOT DONE | Should verify backup can be restored |
| 🟢 | Backup retention period configured | ⚠️ VERIFY | Default 7 days — adjust based on compliance needs |

---

## 3. Application

### 3.1 Frontend — Build & Deploy

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 🟡 | Vite production build passes | ⚠️ VERIFY | Run `npm run build`, check for errors |
| 🟡 | Bundle size within acceptable limits | ⚠️ VERIFY | Check `dist/` size; consider code splitting |
| 🟢 | Source maps disabled in production | ⚠️ VERIFY | `sourcemap: false` in vite config |
| 🟢 | CDN cache headers configured | ⚠️ VERIFY | If served via CDN, set appropriate `Cache-Control` headers |
| 🔵 | CSP headers set | ❌ NOT DONE | Content-Security-Policy headers for XSS protection |

### 3.2 Frontend — Error Handling

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 🟡 | React error boundary implemented | ❌ NOT DONE | Should wrap app to prevent blank screen on crash |
| 🟡 | Supabase query errors handled gracefully | ⚠️ PARTIAL | Errors logged to console but not shown to user |
| 🟡 | Network offline state handled | ❌ NOT DONE | No offline fallback or retry logic |
| 🟢 | Loading states for all async operations | ✅ DONE | Fragment feed, channel list have loading states |
| 🟢 | Empty states for all lists | ✅ DONE | "No wisdom yet", "Community wisdom is still forming" |

### 3.3 Fragment Processing

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 🟡 | Distillation advisory lock prevents concurrent runs | ✅ DONE | `pg_advisory_xact_lock(20260606)` applied |
| 🟡 | Threshold check before distillation | ✅ DONE | Requires 50 fragments minimum |
| 🟢 | Fragment batch is FIFO ordered | ✅ DONE | `ORDER BY created_at ASC` |
| 🟢 | No fragment appears in multiple distilled posts | ✅ DONE | `is_distilled` flag prevents reuse |
| 🔵 | Idempotent distillation — safe to re-run | ⚠️ VERIFY | What happens if same batch is processed twice? |

### 3.4 Realtime Subscriptions

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 🟡 | Realtime channels cleaned up on unmount | ✅ DONE | `_stopDistilledPostRealtime()` on router change |
| 🟡 | Realtime filters minimize unnecessary events | ⚠️ OPTIMIZE | Currently processes all INSERT/UPDATE on `distilled_posts` — should filter by `status=eq.published` |
| 🟢 | Subscription limit (max 10) respected | ✅ DONE | Only 2 Realtime channels in use |

---

## 4. Infrastructure

### 4.1 Supabase Project

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 🟡 | Project on paid plan (Pro or Team) | ⚠️ VERIFY | Free plan has limits: 2 GB DB, 50k monthly active users |
| 🟡 | Database size within plan limits | ⚠️ VERIFY | Current ~6,550 fragments — estimate growth rate |
| 🟡 | Bandwidth limits understood | ⚠️ VERIFY | Free: 2 GB, Pro: 50 GB egress |
| 🟢 | Compute add-on needed for scale | ⚠️ ASSESS | Micro (default) may be sufficient for <10k users |

### 4.2 Edge Functions

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 🟡 | Function timeout sufficient | ⚠️ VERIFY | Default 10s. `submit-fragment` is fast. Dify-callback should be under 5s. |
| 🟡 | Function memory allocation adequate | ⚠️ VERIFY | Default 256 MB |
| 🟢 | Function invocation limits understood | ⚠️ VERIFY | Pro: 500k invocations/month included |
| 🟢 | No synchronous Dify calls blocking response | ⚠️ DESIGN CHOICE | Current: client-side processing. Future: async via callback. ✅ Decoupled. |

### 4.3 Domain & DNS

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 🟡 | Custom domain configured | ⚠️ VERIFY | Currently: `file://` and localhost. Production needs a domain. |
| 🟡 | SSL/TLS certificate valid | ⚠️ VERIFY | Automatic with Supabase + CDN |
| 🟢 | DNS records configured (A, CNAME, etc.) | ⚠️ VERIFY | For custom domain |

### 4.4 Deployment Pipeline

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 🟡 | CI/CD configured (GitHub Actions or similar) | ❌ NOT DONE | Manual deployment currently |
| 🟡 | Automated migration run on deploy | ❌ NOT DONE | `supabase db push` should be part of pipeline |
| 🟢 | Rollback strategy defined | ❌ NOT DONE | How to revert a bad deploy? |
| 🟢 | Staging environment for pre-production testing | ❌ NOT DONE | Highly recommended |

---

## 5. Monitoring & Observability

### 5.1 Logging

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 🟡 | Edge Function logs accessible | ✅ DONE | Supabase Logs dashboard available |
| 🟡 | Error tracking service configured (Sentry, etc.) | ❌ NOT DONE | Console errors are invisible in production |
| 🟢 | Fragment processing failures logged with context | ✅ DONE | `[DifyProcessor]`, `[MasterAgent]`, `[submit-fragment]` log prefixes |
| 🔵 | Log retention configured | ⚠️ VERIFY | Supabase retains logs for 1 hour on free, 7 days on Pro |

### 5.2 Alerting

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 🟡 | Database connection pool alerts | ❌ NOT DONE | Supabase can alert on connections >80% |
| 🟡 | High error rate alerts for Edge Functions | ❌ NOT DONE | Manual monitoring currently |
| 🟢 | Disk space monitoring | ⚠️ VERIFY | Supabase dashboard shows storage metrics |
| 🟢 | Monthly active user threshold alert | ❌ NOT DONE | To avoid surprise billing |

### 5.3 Performance Monitoring

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 🟡 | Query performance baseline established | ✅ DONE | Benchmark data in `docs/validation-report.md` |
| 🟢 | Regular query performance review cadence | ❌ NOT DONE | Set monthly review especially as data grows |
| 🔵 | pg_stat_statements enabled for query analysis | ⚠️ VERIFY | Useful for identifying slow queries |

---

## 6. Dependencies

### 6.1 External Services

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 🟡 | Supabase as single dependency — no other hard deps | ✅ DONE | All services from Supabase (DB, Auth, Functions, Realtime) |
| 🟢 | CDN dependencies version-pinned | ✅ DONE | React 18.2.0, Supabase JS 2.39.0 — explicit versions |
| 🔵 | Tailwind CDN replaced with build-time | ⚠️ RECOMMENDED | CDN version is 2MB+ — build-time Tailwind is ~10KB |

### 6.2 Dify (Future)

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 🟡 | Dify deployment plan documented | ✅ DONE | See `docs/dify-integration-readiness.md` |
| 🟡 | Mock processors work as fallback | ✅ DONE | System functions without Dify |
| 🟢 | Graceful degradation if Dify is unavailable | ⚠️ DESIGNED | Async callback pattern handles failures |

---

## 7. Testing

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 🔴 | RLS policy tests (anon vs authenticated vs service_role) | ⚠️ PARTIAL | `scripts/test-rls.mjs` exists but only for distilled_posts |
| 🟡 | Edge Function unit tests | ❌ NOT DONE | `submit-fragment`, `dify-callback` untested |
| 🟡 | Fragment submission e2e test | ⚠️ PARTIAL | Manual only — `scripts/test-category-trigger.mjs` tests DB trigger |
| 🟢 | Distillation pipeline test (batch → publish) | ✅ DONE | Verified via stress test + quality audit |
| 🟢 | Seed data integration test | ✅ DONE | `scripts/seed-fragments.mjs` at 50/500/1k/5k scales |
| 🔵 | Load test beyond 10k fragments | ❌ NOT DONE | Current max tested: 6,550 |

---

## 8. Compliance & Data Governance

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 🟡 | User data retention policy defined | ❌ NOT DONE | How long are fragments kept? |
| 🟡 | User deletion / data export capability | ❌ NOT DONE | GDPR / privacy requirements |
| 🟢 | Fragments are pseudonymous by default | ✅ DONE | Stored by UUID user_id, not PII |
| 🟢 | No PII in fragment content (design assumption) | ⚠️ USER-DRIVEN | Content is user-generated — terms of service should prohibit PII |
| 🟢 | Terms of Service and Privacy Policy available | ❌ NOT DONE | Required for production launch |
| 🔵 | Cookie/analytics consent mechanism | ❌ NOT DONE | If using analytics |

---

## 9. Summary

### Blockers Before Launch

| ID | Issue | Owner | Fix |
|----|-------|-------|-----|
| 🔴 | Migration version mismatch prevents clean db push | Dev | Rename local migration to `20260606000000` to match remote version pattern |
| 🔴 | No custom domain configured | Dev | Purchase domain, configure DNS + Supabase custom domain |
| 🔴 | No CI/CD pipeline | Dev | Set up GitHub Actions for auto-deploy |
| 🔴 | No error tracking | Dev | Integrate Sentry or equivalent |

### High Priority Before Launch

| ID | Issue | Owner | Fix |
|----|-------|-------|-----|
| 🟡 | Verify all RLS policies (raw_fragments, channels, categories) | Dev | Audit via Supabase SQL editor |
| 🟡 | Enable PITR backups | Dev | Supabase Project Settings |
| 🟡 | Check DB size + bandwidth projections | Dev | Estimate based on expected users |
| 🟡 | Password policy + email confirmation verified | Dev | Check Supabase Auth settings |
| 🟡 | React error boundary on main app | Dev | Wrap root component in `<ErrorBoundary>` |

### Already Resolved (This Phase)

| ID | Issue | Fix |
|----|-------|-----|
| 🔴 B1 | RLS blocks anon reads of published distilled_posts | Migration applied, service_role key removed from client |
| 🟡 H1 | category_id null on fragment insertion | DB trigger + Edge Function fix |
| 🟡 M1 | No composite index for distillation query | Index created and benchmarked (16% faster) |
| 🟡 | Seal script sets category_id | Seed script updated |
| 🟢 | Distillation advisory lock | Migration applied |
| 🟢 | FIFO ordering of fragments | Verified via stress test |

### Recommended Post-Launch

| Issue | Timeline |
|-------|----------|
| Dify integration (Workflow A + B) | Phase 4 |
| Embedding pipeline for Resonance Discovery | Phase 5 |
| Table partitioning at 500k fragments | 3-6 months post-launch |
| Data archival policy | 3 months post-launch |
| Load testing beyond 10k fragments | Pre-scale |
| Tailwind build-time migration | Before public launch |
| Staging environment | Before public launch |
