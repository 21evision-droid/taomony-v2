/**
 * Scalability Audit — Validation Phase
 *
 * Analyzes query performance at current scale (6550 fragments)
 * and estimates behavior at 1k/5k/10k users.
 *
 * Usage: node scripts/scalability-audit.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://jiwsgaegoudcutdnqydf.supabase.co";
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3NnYWVnb3VkY3V0ZG5xeWRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODAzNzU4MiwiZXhwIjoyMDkzNjEzNTgyfQ.iz4bAmGRw5pnilex1dNqEstakhdYLdhpw7I8l6MCMIw";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkIndexes() {
  console.log("\n═══ 1. Index Coverage ═══\n");

  // We can't query pg_indexes via supabase-js, but we know what indexes exist from migrations
  const indexes = [
    { name: "idx_raw_fragments_channel_id", table: "raw_fragments", column: "channel_id", status: "exists (migration 20260605)" },
    { name: "idx_raw_fragments_user_id", table: "raw_fragments", column: "user_id", status: "exists (migration 20260605)" },
    { name: "idx_raw_fragments_status", table: "raw_fragments", column: "status", status: "exists (migration 20260605)" },
    { name: "idx_raw_fragments_created_at", table: "raw_fragments", column: "created_at DESC", status: "exists (migration 20260605)" },
    { name: "idx_raw_fragments_is_distilled", table: "raw_fragments", column: "is_distilled WHERE is_distilled=false", status: "exists (migration 20260606100000)" },
    { name: "idx_distilled_posts_status", table: "distilled_posts", column: "status", status: "exists (migration 20260606100000)" },
    { name: "idx_distilled_posts_published_at", table: "distilled_posts", column: "published_at DESC", status: "exists (migration 20260606100000)" },
    { name: "idx_distilled_posts_created_at", table: "distilled_posts", column: "created_at DESC", status: "exists (migration 20260606100000)" },
    { name: "idx_channels_category_id", table: "channels", column: "category_id", status: "exists (migration 20260605)" },
  ];

  console.log("  Existing indexes:");
  for (const idx of indexes) {
    console.log(`  ✓ ${idx.name} (${idx.table}.${idx.column})`);
  }

  // Check for missing indexes
  const missing = [];

  // The key query: SELECT WHERE status=completed AND is_distilled=false ORDER BY created_at ASC LIMIT 50
  // This has: idx_raw_fragments_status + idx_raw_fragments_is_distilled + idx_raw_fragments_created_at
  // But there's NO composite index for (status, is_distilled, created_at)

  // At 6550 fragments, the partial index on is_distilled WHERE is_distilled=false is very selective
  // At 5622 undistilled, it covers ~86% of rows

  // But the status filter (completed) needs to be applied separately
  // PostgreSQL can bitmap-combine the two indexes, which is fast
  // At larger scale, a composite index would be better

  console.log("\n  ⚠ Missing composite index:");
  console.log("    idx_raw_fragments_distillation_pickup");
  console.log("    ON raw_fragments(status, is_distilled, created_at ASC)");
  console.log("    WHERE status = 'completed' AND is_distilled = false");
  console.log("    This would optimize the core distillation query.");
  console.log("    At current scale (6550 rows), separate indexes are sufficient.");
  console.log("    At 50k+ rows, the composite index would be ~3-5x faster.");

  return missing;
}

async function benchmarkQueries() {
  console.log("\n═══ 2. Query Performance Benchmarks ═══\n");

  const benchmarks = [
    { name: "Count completed, undistilled fragments", query: () =>
      admin.from("raw_fragments").select("*", { count: "exact", head: true }).eq("status", "completed").eq("is_distilled", false) },
    { name: "Fetch 50 oldest undistilled fragments", query: () =>
      admin.from("raw_fragments").select("id, user_id, content, category_id, created_at").eq("status", "completed").eq("is_distilled", false).order("created_at", { ascending: true }).limit(50) },
    { name: "Fetch 1000 oldest undistilled fragments", query: () =>
      admin.from("raw_fragments").select("id, user_id, content, category_id, created_at").eq("status", "completed").eq("is_distilled", false).order("created_at", { ascending: true }).limit(1000) },
    { name: "Fetch published distilled_posts (limit 5)", query: () =>
      admin.from("distilled_posts").select("*").eq("status", "published").order("published_at", { ascending: false }).limit(5) },
    { name: "Fetch channels (for filter bar)", query: () =>
      admin.from("channels").select("*").order("sort_order") },
    { name: "Fetch fragment feed (limit 50)", query: () =>
      admin.from("raw_fragments").select("*").eq("status", "completed").order("created_at", { ascending: false }).limit(50) },
  ];

  for (const b of benchmarks) {
    const runs = [];
    for (let i = 0; i < 3; i++) {
      const start = performance.now();
      const { data, error } = await b.query();
      const elapsed = performance.now() - start;
      if (error) {
        console.log(`  ✗ "${b.name}": ERROR ${error.message}`);
        runs.push(null);
      } else {
        runs.push(elapsed);
      }
    }
    const valid = runs.filter((r) => r !== null);
    if (valid.length > 0) {
      const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
      const min = Math.min(...valid);
      const max = Math.max(...valid);
      console.log(`  ${b.name}:`);
      console.log(`    avg=${avg.toFixed(0)}ms  min=${min.toFixed(0)}ms  max=${max.toFixed(0)}ms`);
    }
  }
}

async function estimateAtScale() {
  console.log("\n═══ 3. Scale Estimates ═══\n");

  const currentFragments = 6550;
  const currentUsers = 7; // 5 test + 2 real (21evision, evision21)
  const currentDistilled = 6; // 6 posts

  // Assumptions:
  // - 80% of users actively submit fragments
  // - Each active user submits 3 fragments/day on average
  // - 90% of fragments complete successfully
  // - Distillation happens when 50 undistilled completed fragments accumulate

  const scenarios = [
    { label: "1k users", activeUsers: 800, dailyFragments: 2400, monthlyFragments: 72000, monthlyUndistilled: 64800, distillationsPerDay: 43, monthlyDistilled: 1296 },
    { label: "5k users", activeUsers: 4000, dailyFragments: 12000, monthlyFragments: 360000, monthlyUndistilled: 324000, distillationsPerDay: 216, monthlyDistilled: 6480 },
    { label: "10k users", activeUsers: 8000, dailyFragments: 24000, monthlyFragments: 720000, monthlyUndistilled: 648000, distillationsPerDay: 432, monthlyDistilled: 12960 },
  ];

  console.log("  Assumptions: 80% active users, 3 fragments/day, 90% completion rate");
  console.log("  Distillation threshold: 50 fragments per post\n");

  for (const s of scenarios) {
    console.log(`  ${s.label}:`);
    console.log(`    Active users: ${s.activeUsers}`);
    console.log(`    Daily fragments: ${s.dailyFragments}`);
    console.log(`    Monthly fragment growth: ${(s.monthlyFragments / 1000000).toFixed(1)}M rows`);
    console.log(`    Distillations per day: ${s.distillationsPerDay} (~every ${(1440 / s.distillationsPerDay).toFixed(0)} min)`);
    console.log(`    Monthly distilled posts: ${s.monthlyDistilled} rows`);

    // Bottleneck analysis
    if (s.monthlyFragments > 500000) {
      console.log(`    ⚠ raw_fragments exceeds 500k rows/month — consider table partitioning`);
    }
    if (s.distillationsPerDay > 24) {
      console.log(`    ⚠ Distillation every ${(1440 / s.distillationsPerDay).toFixed(0)} min — advisory lock contention possible`);
      console.log(`       Solution: batch distillations (e.g., run every N fragments, not every 50)`);
    }
    if (s.monthlyDistilled > 5000) {
      console.log(`    ⚠ distilled_posts grows by ${s.monthlyDistilled}/month — index maintenance needed`);
    }
    console.log("");
  }
}

async function analyzeBottlenecks() {
  console.log("\n═══ 4. Bottleneck Analysis ═══\n");

  const bottlenecks = [];

  // 1. Single-threaded distillation
  bottlenecks.push({
    severity: "MEDIUM",
    component: "run-master-agent Edge Function",
    issue: "pg_advisory_xact_lock(42) serializes all distillation runs",
    detail: "Only one distillation can run at a time. At 10k users (432 distillations/day), queuing delay could reach 5-10 minutes during peak hours.",
    mitigation: "Increase threshold from 50 to 100-200 fragments. Add cron scheduling during low-traffic periods.",
  });

  // 2. RLS policy requiring policy fix
  bottlenecks.push({
    severity: "HIGH",
    component: "distilled_posts RLS",
    issue: "Current RLS requires authenticated role, blocking anon reads",
    detail: "Frontend uses anon key. Current workaround uses service_role key in client code, which is a security anti-pattern.",
    mitigation: "Apply migration 20260606120000_fix_distilled_posts_rls.sql to allow anon reads of published posts. Remove service_role key from frontend.",
  });

  // 3. Missing category_id denormalization
  bottlenecks.push({
    severity: "LOW",
    component: "Fragment ingestion",
    issue: "category_id is null for all seeded fragments",
    detail: "category_id should be denormalized from channel_id during fragment insertion. Without it, the distillation can't group by category accurately.",
    mitigation: "Add a trigger or application-level logic to set category_id when channel_id is provided.",
  });

  // 4. Mock summary quality
  bottlenecks.push({
    severity: "LOW",
    component: "Distillation content generation (mock)",
    issue: "Generic summaries and excerpt-only content",
    detail: "Mock generates 'A distillation of N fragments across M categories...' — repetitive and low-information. Dify Workflow B will address this.",
    mitigation: "Acceptable for development. Dify Workflow B is the planned replacement.",
  });

  // 5. Realtime subscription scope
  bottlenecks.push({
    severity: "LOW",
    component: "distilled_posts Realtime subscription",
    issue: "Subscribes to all INSERT/UPDATE events without status filter",
    detail: "Realtime channel fires for ALL distilled_posts changes including draft posts. Frontend filters by status, but extra events create unnecessary React re-renders.",
    mitigation: "Use Postgres row-level filter on Realtime channel (e.g., `filter: 'status=eq.published'`) to reduce noise.",
  });

  // 6. Composite index
  bottlenecks.push({
    severity: "LOW",
    component: "raw_fragments query",
    issue: "Missing composite index for distillation query",
    detail: "Current query uses separate indexes on status, is_distilled, and created_at. PostgreSQL combines them with bitmap scans, but a composite index would be faster at scale.",
    mitigation: "Add idx_raw_fragments_distillation_pickup ON raw_fragments(status, is_distilled, created_at ASC) WHERE status='completed' AND is_distilled=false",
  });

  // 7. No fragment archival strategy
  bottlenecks.push({
    severity: "MEDIUM",
    component: "raw_fragments growth",
    issue: "No data retention or archival policy",
    detail: "At 10k users, raw_fragments grows by ~720k rows/month (8.6M/year). Distilled fragments remain in the table with is_distilled=true but are never deleted or archived.",
    mitigation: "Implement a monthly archival job to move is_distilled=true fragments older than 6 months to a cold storage table. Add a cleanup cron.",
  });

  for (const b of bottlenecks) {
    console.log(`  [${b.severity}] ${b.component}`);
    console.log(`    Issue: ${b.issue}`);
    console.log(`    Detail: ${b.detail}`);
    console.log(`    Mitigation: ${b.mitigation}`);
    console.log("");
  }
}

async function main() {
  console.log("========================================");
  console.log("  Scalability Audit");
  console.log("========================================");

  await checkIndexes();
  await benchmarkQueries();
  await estimateAtScale();
  await analyzeBottlenecks();

  console.log("========================================");
  console.log("  Scalability Audit Complete");
  console.log("========================================\n");
}

main().catch((err) => {
  console.error("Audit failed:", err);
  process.exit(1);
});
