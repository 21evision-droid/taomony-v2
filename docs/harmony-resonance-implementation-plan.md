# Harmony Resonance — Implementation Plan

## Core Principle

> 优先验证 Fragment → Feed → Persistence 的闭环，然后再验证 AI。

如果用户不愿意持续贡献 Fragment，Master Agent 没有东西可以蒸馏。
真正的产品风险不是 AI 能不能工作，而是用户是否愿意把"一句话的智慧种子"持续投入这个系统。

---

## Phase 0 — Taxonomy Lock

**目标：冻结 Categories + Channels 结构，后续所有环节依赖这些 ID**

- [x] 定义 `categories` 表结构：`id, name, slug, sort_order`
- [x] 定义 `channels` 表结构：`id, category_id, name, slug, sort_order`
- [x] 锁定 MVP 分类树（与侧边栏一致）：
- [x] Seed 数据写入 Supabase
- [x] 前端 `categories` 硬编码数组替换为 Supabase 查询

```
Learning            Meditate         Taomony Eating      Cultivation          Governance
├── Tao Te Ching    ├── Daily        ├── Daily Weight    ├── Gratitude        ├── Community Policy
├── Philosophy        Meditation     ├── Meal Journal    ├── Generosity       ├── Events
├── Psychology      ├── Breathing    ├── Challenges      ├── Accountability   ├── Challenge
├── Nutrition       ├── Inner                            └── Kindness
                        Alchemy
```

> **为什么 Phase 0 单独存在？** Workflow A、Workflow B、Channel Routing、Analytics 全部依赖这些 ID。越早锁定，后期返工越少。

---

## Phase 1A — Community Skeleton

**目标：看得见、点得动、能浏览**

- [x] Supabase Schema: `raw_fragments` 表 + RLS
  - `id, user_id, content, channel_id, source_type, status, created_at`
  - channel_id FK → channels.id
  - status: 'pending' | 'processing' | 'completed' | 'failed'
- [x] Fragment Composer Card（频道视图顶部输入区）
  - Placeholder 轮播："Today I skipped sugary drinks" / "Read Chapter 8 of Tao Te Ching"
  - 强调短贡献，不显示字数限制
- [x] Fragment Card（只读展示组件）
  - 显示：频道标签、时间戳、内容、类型标签
  - 无点赞、无评论、无互动
  - 作者匿名
- [x] 频道 Feed 替换：硬编码 placeholder → Supabase 查询
  - `SELECT id, content, channel_id, created_at FROM raw_fragments WHERE channel_id = ? AND status = 'completed' ORDER BY created_at DESC`
- [x] All Resonance 视图
  - 顶部：✨ Featured Resonance — "Coming Soon" 占位
  - 下方：全频道 fragment 流（`WHERE status = 'completed'`，无 channel_id 过滤）
- [x] 前端 `categories` 数组替换为实时 Supabase 查询（Phase 0）

---

## Phase 1B — Fragment Submission Loop

**目标：真正发出 Fragment，完成提交→持久化→展示闭环**

- [x] Edge Function: `submit-fragment`（MVP: 前端直接 Supabase insert，架构预留 Edge Function 接口）
  - 从 JWT 获取 user_id
  - 生成 fragment_id（后端）
  - 写入 `raw_fragments` 表，status = 'pending'
  - 返回 fragment_id 给前端
- [x] `FragmentProcessor` 抽象接口定义（`src/lib/fragmentProcessor.js`）
  - `process(fragmentId: string): Promise<void>`
- [x] `MockProcessor` 实现
  - 等待 1-2 秒（模拟 Dify 延迟）
  - 更新 status = 'completed'
- [x] 前端提交流程
  - 提交后 fragment 显示在 feed 中（status = 'pending'，灰色样式 + 动画脉冲）
  - 提交成功后：**重新查询当前频道**（非 Realtime）
  - Pending → Completed 状态卡片更新
- [x] Governance 视图保持不变（纯阅读，无 composer）

---

## Phase 1C — Realtime Layer ✅

**目标：Discord 级别的实时体验**

- [x] Supabase Realtime: Postgres Changes channel on `raw_fragments` (INSERT + UPDATE)
- [x] 前端订阅：全局 `fragments-realtime` channel
  ```js
  supabase.channel('fragments-realtime')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'raw_fragments' }, handler)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'raw_fragments' }, handler)
    .subscribe()
  ```
- [x] Pending → Completed 实时切换（patch local state, no refetch）
- [x] 新 fragment 实时出现在 feed 顶部（prepend to local state）
- [x] Channel filter bar: 按 channel 过滤 feed
- [x] Submit form with Edge Function invocation
- [x] CSS styling matching existing app design language

**实现位置**: `D:\Documents\Claude\Projects\Taomony App\index.html` inline

---

## Phase 2 — Workflow A / Sub-Agent (Code Complete)

**目标：AI 驱动的 Fragment 分类、embedding、标签**

- [x] `FragmentProcessor` 接口 + `DifyProcessor` 实现
- [ ] Dify Workflow A 配置 — **需要 Dify 平台访问**
  - 输入：`user_id, content, channel_id, source_type, fragment_id`
  - 输出：`category_id, fragment_type, embedding, tags, confidence`
  - 单次 LLM 调用 + embedding
- [x] Edge Function: `dify-callback` — **已创建，未部署**
- [ ] ngrok 隧道（开发环境 callback 接收）— **需要 Dify 集成时设置**
- [ ] 完整端到端联调 — **需要上述项目完成**
- [ ] 环境切换：`ENV=mock` → `ENV=dify` — **待 Dify 就绪**

---

## Phase 3A — Database Foundation ✅

**目标：AI 驱动的集体智慧蒸馏 — 数据库层**

- [x] Schema: `distilled_posts` 表
  - `id, title, content, summary, source_fragment_ids, contributor_count, status, published_at, created_at`
  - Indexes: status, published_at DESC, created_at DESC
  - RLS: published posts readable by authenticated users
- [x] Schema: `master_agent_runs` 表
  - `id, status, fragment_count, started_at, completed_at, distilled_post_id, error_message`
  - RLS: authenticated users can read
- [x] `raw_fragments.is_distilled` boolean default false
  - Partial index: `WHERE is_distilled = false`
- [x] Migration: `20260606100000_phase_3a_foundation.sql`

---

## Phase 3B — Master Agent Processor Foundation ✅

**目标：Master Agent 处理器层 — 无 AI/无 Dify**

- [x] `src/lib/masterAgentProcessor.js` — 公共合约：`generateDistilledPost()`
- [x] MockMasterAgentProcessor
  - 阈值：50 个 undistilled completed fragments
  - 低于阈值返回 null
  - 确定性聚合（dominant category vote + 片段摘录）
- [x] 输出合约直接映射到 `distilled_posts` 字段
- [x] 未来 Dify Workflow B 集成点（3 处标注）
  - `useWorkflowB()` 切换
  - `mockDistill()` → `difyWorkflowBDistill()` 替换点
  - 调用者无需变更

---

## Phase 3C — run-master-agent Edge Function + Advisory Lock ✅

**目标：Master Agent 执行层 — 隔离的 Edge Function**

- [x] `supabase/functions/run-master-agent/index.ts` — 完整实现
  - `withSupabase({ auth: ["secret"] })` — 仅 service_role key 可调用
  - 事务级 advisory lock (ID 42) 防并发 — `rpc("acquire_distillation_lock")`
  - 完整蒸馏管道：count → fetch → classify → insert distilled_post → mark is_distilled
  - Error recovery: 失败时更新 master_agent_runs 记录
- [x] `supabase/migrations/20260606110000_add_distillation_lock.sql`
  - `acquire_distillation_lock()` 包装函数
  - 供 Edge Function 通过 `.rpc()` 调用
  - SECURITY DEFINER, 仅执行 `pg_advisory_xact_lock(42)`

---

## Phase 3D — Featured Resonance UI + Realtime (Not Started)
- [ ] All Resonance：Featured Resonance 展示区
  - Distilled Post Card 组件（显示标题、摘要、贡献者数、fragment 数、来源频道）
  - 最新的 5-10 篇展示在 All Resonance 顶部
  - "Coming Soon" 占位 → 真实数据
- [ ] Distilled Post Realtime 订阅
  - 独立的 `postgres_changes` 订阅

---

## Key Principles

1. **Fragment 优先** — Phase 1A+1B 不依赖任何 AI 能力
2. **Mock before Dify** — FragmentProcessor 抽象确保开发阶段不阻塞
3. **Realtime last in Phase 1** — 前 100 个用户感受不到 polling vs WebSocket 的区别
4. **Distilled Post placeholder early** — 防止团队在开发中忘记这是在构建 Collective Wisdom System
5. **Architecture B-ready, UI A-only** — 预埋表结构，不暴露未完成功能

---

## Phase 2 Execution Report

### Files Created

| File | Purpose |
|------|---------|
| `src/lib/difyProcessor.js` | DifyProcessor — mock classification (weighted random categories, 2s latency). Production-ready contract: when real Dify is wired, this becomes a thin call to Dify Workflow A. |
| `supabase/functions/submit-fragment/index.ts` | Edge Function — validates JWT, inserts fragment as `pending`, returns `{success, fragment_id}`. Uses `withSupabase` pattern. |
| `supabase/functions/submit-fragment/deno.json` | Import map for `@supabase/functions-js`, `@supabase/server` |
| `supabase/functions/dify-callback/index.ts` | Edge Function — webhook endpoint for Dify callback. Validates `x-webhook-secret`, updates `raw_fragments` with category/embedding/tags/status. |
| `supabase/functions/dify-callback/deno.json` | Import map for `@supabase/functions-js`, `@supabase/supabase-js` |
| `supabase/migrations/20260606083000_update_source_type.sql` | Migration: source_type CHECK constraint updated to new values |

### Files Modified

| File | Change |
|------|--------|
| `src/lib/fragmentProcessor.js` | Now abstraction layer: delegates to DifyProcessor by default, `useMockFallback()` for legacy |
| `supabase/migrations/20260605_create_harmony_resonance_schema.sql` | Updated seed data + source_type CHECK in original migration |
| `docs/harmony-resonance-implementation-plan.md` | Marked Phase 1C + Phase 2 items as completed |
| `D:\Documents\Claude\Projects\Taomony App\index.html` | Added: Fragment store (Realtime), HarmonyPavilion component, BottomNav tab, route, CSS |

### Database Migrations Applied

| Migration | Status |
|-----------|--------|
| `20260605_create_harmony_resonance_schema.sql` | Applied — raw_fragments table + seed data |
| `20260606_add_harmony_resonance_category.sql` | Applied — Harmony Resonance category + channels |
| `20260606082000_reorder_categories.sql` | Applied — Harmony Resonance above Governance |
| `20260606083000_update_source_type.sql` | Applied — updated CHECK constraint |

### Edge Functions

| Function | Status | Endpoint |
|----------|--------|----------|
| `submit-fragment` | Created (not deployed) | `POST /functions/v1/submit-fragment` |
| `dify-callback` | Created (not deployed) | `POST /functions/v1/dify-callback` |

**To deploy:**
```bash
npx supabase functions deploy submit-fragment
npx supabase functions deploy dify-callback
npx supabase secrets set DIFY_WEBHOOK_SECRET=<your-secret>
```

### Realtime Layer Status

| Feature | Status |
|---------|--------|
| Initial history load (completed fragments) | ✅ |
| INSERT subscription → prepend to feed | ✅ |
| UPDATE subscription → patch in place | ✅ |
| No full refetch on changes | ✅ |
| Channel filter bar | ✅ |
| Submit form (via Edge Function) | ✅ |
| CSS styling (matching app design) | ✅ |

### Schema Audit

**raw_fragments** — all required fields present:
- `id, user_id, content, channel_id, source_type` ✅
- `category_id, fragment_type, embedding, tags` ✅ (populated by DifyProcessor)
- `status` (pending → processing → completed/failed) ✅
- `created_at, updated_at` ✅
- RLS: completed-readable, owner-ins/upd ✅
- Indexes: channel_id, user_id, status, created_at DESC ✅

**Optimization note:** A composite index on `(status, created_at DESC)` would benefit the feed query `WHERE status = 'completed' ORDER BY created_at DESC` at scale. Optional — can be added later as a non-breaking migration.

### Remaining Blockers Before Real Dify Integration

1. **Dify Workflow A not configured** — needs Dify platform access, Workflow A definition
2. **ngrok tunnel** — Dify needs a public URL for callback; ngrok required for local dev
3. **DIFY_WEBHOOK_SECRET** — must be set via `supabase secrets set`
4. **Edge Functions not deployed** — `submit-fragment` and `dify-callback` need deployment
5. **End-to-end test** — needs all above items complete

### Recommended Next Phase: Phase 3 (Master Agent / Distillation)

When ready:
1. Create `distilled_posts` table
2. Create `master_agent_runs` table
3. Implement Master Agent threshold detection logic
4. Configure Dify Workflow B
5. Build Distilled Post Card + Featured Resonance area
6. Wire Realtime for distilled_posts

Items explicitly deferred (not Phase 3 scope):
- Resonance Discovery
- Circle Code
- Recommendation/Matching
- Direct frontend→Dify calls

---

## Phase 3A Schema Report

### Migration File

`supabase/migrations/20260606100000_phase_3a_foundation.sql`

### 1. distilled_posts

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, default gen_random_uuid() |
| title | TEXT | NOT NULL |
| content | TEXT | NOT NULL |
| summary | TEXT | nullable |
| source_fragment_ids | UUID[] | NOT NULL |
| contributor_count | INTEGER | default 0 |
| status | TEXT | default 'draft', CHECK IN ('draft','published','archived') |
| published_at | TIMESTAMPTZ | nullable |
| created_at | TIMESTAMPTZ | default now() |

**Indexes:**
- `idx_distilled_posts_status` ON status
- `idx_distilled_posts_published_at` ON published_at DESC
- `idx_distilled_posts_created_at` ON created_at DESC

**RLS:** SELECT for authenticated users WHERE status = 'published'. No INSERT/UPDATE/DELETE policies — writes handled by Edge Function (service_role bypasses RLS).

### 2. master_agent_runs

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, default gen_random_uuid() |
| status | TEXT | default 'running', CHECK IN ('running','completed','failed') |
| started_at | TIMESTAMPTZ | default now() |
| completed_at | TIMESTAMPTZ | nullable |
| fragment_count | INTEGER | nullable |
| distilled_post_id | UUID | FK → distilled_posts(id), nullable |
| error_message | TEXT | nullable |
| created_at | TIMESTAMPTZ | default now() |

**Indexes:** None required (small table, queried by latest run).

**RLS:** SELECT for authenticated users. No INSERT/UPDATE/DELETE policies — writes handled by Edge Function.

### 3. raw_fragments — Modified

| Addition | Details |
|----------|---------|
| is_distilled | BOOLEAN NOT NULL DEFAULT false |

**Index:** `idx_raw_fragments_is_distilled` ON is_distilled WHERE is_distilled = false (partial index for efficient lookup of undistilled fragments).

### Complete raw_fragments Schema (for reference)

```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID NOT NULL REFERENCES auth.users(id)
content         TEXT NOT NULL
channel_id      UUID NOT NULL REFERENCES channels(id)
source_type     TEXT NOT NULL DEFAULT 'fragment'
media_url       TEXT DEFAULT NULL
category_id     UUID REFERENCES categories(id)
fragment_type   TEXT DEFAULT NULL
embedding       extensions.vector(1536) DEFAULT NULL
tags            JSONB DEFAULT NULL
status          TEXT NOT NULL DEFAULT 'pending'
is_distilled    BOOLEAN NOT NULL DEFAULT false
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

Indexes: channel_id, user_id, status, created_at DESC, is_distilled (partial)

### Apply to Remote

```bash
npx supabase db push --include-all
```

---

## Phase 3B Deliverables Report

### Files Created

| File | Purpose |
|------|---------|
| `src/lib/masterAgentProcessor.js` | Master Agent Processor — public contract, MockMasterAgentProcessor, future DifyWorkflowBProcessor integration points |

### Architecture

```
src/lib/masterAgentProcessor.js
│
├── generateDistilledPost()          ← public API
├── isDistillationReady()            ← public API (polling)
│
├── mockDistill()                    ← MockMasterAgentProcessor (current)
│   ├── fetchUndistilledBatch()      ← WHERE status=completed AND is_distilled=false, limit 50
│   ├── findDominantCategory()       ← category vote → dominant category
│   ├── fetchCategoryName()          ← categories lookup for title
│   └── generateDistilledContent()   ← title, summary, content, contributor_count
│
└── difyWorkflowBDistill()           ← placeholder (future)
    • 3 integration points marked in source
    • Identical return contract
    • Caller unchanged on swap
```

### Public Contract

```
generateDistilledPost()
  → { title, content, summary, source_fragment_ids, contributor_count }
  → null  (if < 50 undistilled fragments)

isDistillationReady()
  → boolean
```

Output fields map 1:1 to `distilled_posts` columns — no transformation needed.

### Mock Logic

| Step | Method |
|------|--------|
| Filter | `status = 'completed' AND is_distilled = false` |
| Threshold | 50 fragments minimum (`DISTILLATION_THRESHOLD`) |
| Dominant topic | Category with most votes among batch |
| Title | `"Reflections on {categoryName}"` |
| Summary | Count-based: `"N fragments across M categories, focusing on {name}"` |
| Content | Title + summary + top-10 excerpts (numbered, 120-char trimmed) |
| source_fragment_ids | UUID array of all 50 fragments |
| contributor_count | Distinct `user_id` count |

### Future Integration Points (3 marked in source)

1. **`useWorkflowB(true)`** — toggle from mock to Dify Workflow B
2. **`mockDistill()` body** — replace entire function with `difyWorkflowBDistill()`
3. **`difyWorkflowBDistill()` placeholder** — commented stub with implementation guide

Swap guarantee: callers of `generateDistilledPost()` require zero changes when switching to Dify Workflow B.

### Not Implemented (per constraints)

- Edge Functions
- Advisory locks (`pg_advisory_xact_lock`)
- Database triggers
- UI components (Featured Resonance, Distilled Post Card)
- Realtime subscriptions
- Dify Workflow B API calls

---

## Phase 3C Deliverables Report

### Files Created

| File | Purpose |
|------|---------|
| `supabase/functions/run-master-agent/index.ts` | Edge Function — full distillation pipeline with advisory lock |
| `supabase/functions/run-master-agent/deno.json` | Import map |
| `supabase/migrations/20260606110000_add_distillation_lock.sql` | Wrapper function for `pg_advisory_xact_lock(42)` |

### Edge Function Flow

```
POST /functions/v1/run-master-agent
  │
  ├─ 1. Auth check (service_role key only) ───── auth: ["secret"]
  ├─ 2. Acquire advisory lock ────────────────── pg_advisory_xact_lock(42)
  │     Blocks concurrent runs; auto-released on connection close
  ├─ 3. Create master_agent_runs record ──────── status: "running"
  ├─ 4. Count undistilled fragments ──────────── status=completed, is_distilled=false
  │     └─ < 50 → mark run completed, return { action: "insufficient_fragments" }
  ├─ 5. Fetch batch (FIFO, oldest first) ─────── limit 50
  ├─ 6. Determine dominant category ──────────── category vote
  ├─ 7. Generate content ────────────────────── title, summary, excerpts
  ├─ 8. Insert distilled_post ───────────────── status: "draft"
  ├─ 9. Mark fragments as distilled ──────────── is_distilled = true
  ├─10. Update run record ───────────────────── status: "completed"
  └─11. Return ──────────────────────────────── { action: "distilled", distilled_post_id }
```

### Advisory Lock Design

| Aspect | Detail |
|--------|--------|
| Lock ID | `42` (well-known constant, distillation-only) |
| Mechanism | `pg_advisory_xact_lock(42)` via wrapper function |
| Wrapper | `acquire_distillation_lock()` — SECURITY DEFINER, callable via `.rpc()` |
| Scope | Transaction-level — auto-released when connection closes |
| Purpose | Prevents concurrent Edge Function invocations from duplicating distillation |
| Concurrent behavior | Second caller blocks until first completes or times out |

### Error Recovery

| Failure Point | Behavior |
|---------------|----------|
| Lock acquisition | Return 500, no run record created |
| Run record creation | Return 500, no partial state |
| Count/fetch query | Run record updated to `status: "failed"` with `error_message` |
| Insert distilled_post | Run record updated to `status: "failed"` (no orphan data) |
| Mark fragments | Run record updated to `status: "failed"` (partial mark possible — acceptable for mock) |

### Not Implemented (deferred to Phase 3D)

- Featured Resonance UI (Distilled Post Card)
- All Resonance view integration
- distilled_posts Realtime subscription
- "Coming Soon" placeholder removal
