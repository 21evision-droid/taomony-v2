# Phase 3E Report — Validation Fixes & Production Readiness

> Date: 2026-06-07
> Scope: P1–P5 covering all validation findings from Phase 3A–3D

---

## Summary

All 5 priorities completed. The system is now **ready for production deployment**
once infrastructure items (domain, CI/CD, error tracking) are addressed.

| Priority | Description | Status |
|----------|-------------|--------|
| P1 — BLOCKER B1 | Fix distilled_posts RLS | ✅ RESOLVED |
| P2 — HIGH H1 | Fix category denormalization | ✅ RESOLVED |
| P3 — MEDIUM M1 | Add composite index for distillation query | ✅ RESOLVED |
| P4 — Dify Audit | Dify integration readiness audit | ✅ COMPLETE |
| P5 — Checklist | Production readiness checklist | ✅ COMPLETE |

---

## P1 — Blocking RLS Fix (B1)

**Issue:** The `distilled_posts` RLS policy `USING (auth.role() = 'authenticated' AND status = 'published')` required users to be authenticated to read published posts. The frontend uses the anon key, so published posts were invisible. Workaround used `service_role` key in client code — a security risk.

**Fix applied:**
1. Applied migration `20260606120000_fix_distilled_posts_rls.sql` which replaces the policy with `USING (status = 'published')` — allows any role (including anon) to read published posts
2. Removed `window.__taoAdminDb` (service_role client) from `index.html`
3. Reverted `getPublishedDistilledPosts()`, `_startDistilledPostRealtime()`, `_stopDistilledPostRealtime()` to use `window.__taoDb` (anon client)
4. Verified with anon key: 4 published posts returned, 0 drafts — correct

**Verification:** `scripts/verify-rls.mjs` confirmed anon can read published posts but not drafts.

---

## P2 — Category Denormalization (H1)

**Issue:** `raw_fragments.category_id` was always NULL because the ingestion pipeline only set `channel_id` without resolving the channel's `category_id`. This made all fragments appear as "General" in distillation.

**Fix applied — three layers:**

| Layer | What | Where | When |
|-------|------|-------|------|
| 1. Edge Function | Resolves `channels.category_id` before INSERT | `submit-fragment/index.ts` | On `submit-fragment` invocation |
| 2. DB Trigger | `BEFORE INSERT` fills NULL `category_id` from `channels` | `trg_fill_category_id` on `raw_fragments` | Catches ALL insert paths |
| 3. Seed Script | Explicitly sets `category_id` in batch push | `scripts/seed-fragments.mjs` | Test data generation |

**DB trigger (safety net):**
```sql
CREATE OR REPLACE FUNCTION public.fill_category_id()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.category_id IS NULL THEN
    SELECT category_id INTO NEW.category_id FROM channels WHERE id = NEW.channel_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_fill_category_id BEFORE INSERT ON raw_fragments
  FOR EACH ROW EXECUTE FUNCTION public.fill_category_id();
```

**Verification:** `scripts/test-category-trigger.mjs` confirmed:
- Test 1: Insert without `category_id` → trigger fills from channel (Learning)
- Test 2: Insert with explicit `category_id` → preserved (Meditate)

---

## P3 — Composite Index (M1)

**Issue:** The Master Agent distillation query `SELECT ... FROM raw_fragments WHERE status='completed' AND is_distilled=false ORDER BY created_at ASC LIMIT 50` used individual indexes on `status`, `is_distilled`, and `created_at DESC` but no composite index covering all three in the correct order.

**Fix applied:**
```sql
CREATE INDEX IF NOT EXISTS idx_raw_fragments_distillation_pickup
  ON raw_fragments (status, is_distilled, created_at ASC);
```

**Benchmark (5 runs, 6,550 rows):**
```
Run 1: 360ms
Run 2: 399ms
Run 3: 359ms
Run 4: 357ms
Run 5: 350ms
Average: 365ms
Baseline (pre-index): 436ms
Improvement: 16% faster
```

---

## P4 — Dify Integration Readiness Audit

**Deliverable:** `docs/dify-integration-readiness.md` — comprehensive audit of all 5 Dify contracts.

**Key findings:**

| Component | Readiness | Action Required |
|-----------|-----------|----------------|
| `dify-callback` Edge Function | ✅ Production-ready | Set `DIFY_WEBHOOK_SECRET` env var |
| `submit-fragment` → Dify call | ❌ Missing | Add Dify API call after insert |
| `difyProcessor.js` (mock Workflow A) | ✅ Works | Keep as fallback |
| `masterAgentProcessor.js` (mock Workflow B) | ✅ 3 integration markers | Implement `difyWorkflowBDistill()` |
| `FragmentComposer.jsx` → Edge Function | ❌ Bypassed | Switch to `supabase.functions.invoke()` |
| Dify instance | ❌ Not deployed | Self-host or Dify Cloud |
| Workflow A (classification) | ❌ Not created | Design + create in Dify |
| Workflow B (distillation) | ❌ Not created | Design + create in Dify |
| Embedding pipeline | ❌ Not started | Add to Workflow A |
| Monitoring & retry | ❌ Not designed | Dead-letter + retry logic |

**Recommended integration sequence:** 5 phases — Foundation → Dify Setup → Wire Workflow A → Wire Workflow B → Embeddings & Discovery. Estimated effort: 3–5 days.

---

## P5 — Production Readiness Checklist

**Deliverable:** `docs/production-readiness-checklist.md` — 60+ criteria across 9 layers.

### Remaining Blockers Before Launch

| # | Issue | Severity |
|---|-------|----------|
| 1 | Migration version mismatch (`20260606`) prevents clean `db push` | 🔴 |
| 2 | No custom domain configured | 🔴 |
| 3 | No CI/CD pipeline | 🔴 |
| 4 | No error tracking (Sentry or equivalent) | 🔴 |

### Remaining High Priority Before Launch

| # | Issue | Severity |
|---|-------|----------|
| 1 | Verify all RLS policies (raw_fragments, channels, categories) | 🟡 |
| 2 | Enable PITR backups | 🟡 |
| 3 | Check DB size + bandwidth projections | 🟡 |
| 4 | React error boundary on main app | 🟡 |
| 5 | Password policy + email confirmation verified | 🟡 |

### Already Resolved (This Phase)

| Issue | Fix |
|-------|-----|
| RLS blocks anon reads | Migration applied, service_role key removed |
| category_id null on insert | DB trigger + Edge Function + seeder |
| No composite index | Created and benchmarked (16% faster) |
| Distillation advisory lock | Applied |
| FIFO ordering verified | Confirmed |
| Seed script sets category_id | Updated |

---

## Files Created / Modified

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/20260606120000_fix_distilled_posts_rls.sql` | Already existed, applied | Fix RLS for anon reads |
| `D:\Documents\Claude\Projects\Taomony App\index.html` | Modified | Remove service_role workaround |
| `supabase/functions/submit-fragment/index.ts` | Modified | Add category_id resolution |
| `supabase/migrations/20260606130000_auto_fill_category_id.sql` | Created | DB trigger for category_id |
| `scripts/seed-fragments.mjs` | Modified | Set category_id in seed data |
| `supabase/migrations/20260606140000_add_distillation_composite_index.sql` | Created | Composite index |
| `docs/dify-integration-readiness.md` | Created | Dify audit |
| `docs/production-readiness-checklist.md` | Created | Production checklist |
| `docs/phase-3e-report.md` | Created | This report |

---

## Recommendations for Next Phase (Phase 4)

1. **Resolve migration version mismatch** — Rename `20260606_add_harmony_resonance_category.sql` to match remote pattern
2. **Set up CI/CD** — GitHub Actions with `supabase db push` on merge to main
3. **Add error tracking** — Sentry for frontend + Edge Function errors
4. **Deploy Dify instance** and begin Workflow A integration
5. **Audit all RLS policies** systematically before opening to public traffic
