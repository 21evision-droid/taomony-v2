# Harmony Resonance — Domain Glossary & Architecture

## Canonical Terms

### Fragment
The primary content unit. A small, fast, easy-to-create piece of user-generated content (single sentence is enough). Examples: "Skipped sugary drinks today", "Read Chapter 8 of Tao Te Ching."

### Sub-Agent
A Dify Workflow A invocation (not a persistent per-user agent). Processes one fragment at a time: categorization, embedding generation. Per-user memory is stored in the `user_agents` database table, not in Dify conversations. **Not** a per-user Dify Agent conversation — that is an architectural trap for MVP.

### Master Agent
A separate Dify Workflow B invocation. Runs periodically (not real-time) over the fragment pool. Detects themes, clusters fragments, generates distilled wisdom posts. Single global instance.

### Resonance Engine
The pipeline: Fragment → Embedding → Vector Search → Theme Clustering → Trend Detection → Master Agent Distillation.

### Distilled Post
Output of the Master Agent. A synthesized wisdom post that aggregates insights from many fragments. Displays "Inspired by: N fragments, M contributors."

### Channel / Category
A knowledge domain, not a UI element. Two-level hierarchy: category (e.g. "Learning") contains channels (e.g. "Tao Te Ching", "Philosophy"). Channels participate in Sub-Agent classification, Resonance clustering, and Master Agent distillation.

### Master Agent
A separate Dify Workflow B invocation. Triggered by **threshold** (not cron): when unprocessed fragments since last run reach N, Workflow B fires. Single global instance.

### Governance
The community management layer — policies, events, challenges. A read-only information space. Contains no fragment composer, no Distilled Posts. MVP: static content only.

### All Resonance
The wisdom gallery. Displays Featured Resonance (Distilled Posts) at top, then a chronological fragment stream across all channels. The canonical home of community wisdom.

## Architecture Decisions

### Implementation Phases

| Phase | Focus | Goal | Status |
|---|---|---|---|
| 0 | Taxonomy Lock | Freeze categories + channels, seed Supabase | ✅ Done |
| 1A | Community Skeleton | Viewable, clickable, browseable | ✅ Done |
| 1B | Submission Loop | Submit → Persist → Display (no Realtime) | ✅ Done |
| 1C | Realtime Layer | Postgres Changes per-channel | 🔲 Pending |
| 2 | Dify Workflow A | AI fragment classification + embedding | 🔲 Pending |
| 3 | Master Agent | Distilled Posts + Featured Resonance | 🔲 Pending |

### Key Principles

1. **Fragment first** — Phase 1A+1B with zero AI dependency
2. **Mock before Dify** — FragmentProcessor abstraction decouples development
3. **Realtime last in Phase 1** — First 100 users won't notice polling vs WebSocket
4. **Distilled Post placeholder early** — Prevents team from forgetting this is a Collective Wisdom System
5. **Architecture B-ready, UI A-only** — Pre-define tables, don't expose unfinished features

| Decision | Choice | Rationale |
|---|---|---|
| Frontend → Dify communication | Supabase Edge Function (proxy) | API Key security, user_id injection, audit |
| Fragment submission | Async (submit → pending → Realtime push) | Non-blocking UX, Dify latency tolerance |
| Sub-Agent implementation | Shared Workflow A with `user_id` param | Cost control, avoids per-user Dify conversation trap |
| Personal memory storage | `user_agents` DB table, not Dify conversations | Decoupled, independently migratable |
| fragment_id generation | Backend-only (Edge Function) | Frontend never creates canonical IDs |
| User identity | Derived from Supabase Auth JWT | Never trust client-provided user_id |
| Fragment status flow | pending → processing → completed | Immediate response, async enrichment |
| Channel storage | `channels` + `categories` tables (FK) | Channels are knowledge domains, not UI strings |
| Fragment-channel relation | `raw_fragments.channel_id` FK → `channels.id` | Supports rename, restructure, metadata |
| Master Agent trigger | Threshold-based (N unprocessed fragments) | Faster response than cron, no manual ops |
| Master Agent concurrency | `pg_advisory_xact_lock` | Prevents duplicate runs on concurrent threshold hits |
| Feed loading | Direct Supabase query (RLS), no Edge Function | Lower latency, one less hop |
| Realtime sync | Postgres Changes (not Broadcast) | DB is single source of truth |
| Field selection | Explicit only, never `select('*')` | Performance, contract clarity |
| Subscription scope | Per-channel, not whole table | Focused, efficient |
| Distilled Posts live | Separate Realtime stream | Independent subscription lifecycle |
| Fragment card (MVP) | Read-only: channel, time, content, type | No likes, comments, or engagement metrics |
| Future resonance signals | `fragment_resonances` table pre-defined (not exposed) | B-ready architecture, A-only UI |
| Author identity (MVP) | Hidden — emphasize ideas over personalities | Shifts culture from attention to wisdom |
| Recognition mechanism | "Contributed to Collective Wisdom" (future) | Not likes, not followers |
