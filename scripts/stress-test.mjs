/**
 * Master Agent Stress Test — Validation Phase
 *
 * Runs mock distillation at multiple thresholds, records timing/quality.
 *
 * Usage:
 *   node scripts/stress-test.mjs              # runs all thresholds
 *   node scripts/stress-test.mjs 50           # single threshold
 *   node scripts/stress-test.mjs --check      # dry-run: check counts only
 *
 * Environment:
 *   SUPABASE_URL  (default: configured below)
 *   SUPABASE_SERVICE_ROLE_KEY (default: configured below)
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://jiwsgaegoudcutdnqydf.supabase.co";
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3NnYWVnb3VkY3V0ZG5xeWRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODAzNzU4MiwiZXhwIjoyMDkzNjEzNTgyfQ.iz4bAmGRw5pnilex1dNqEstakhdYLdhpw7I8l6MCMIw";

const DISTILLATION_THRESHOLD = 50;
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ── Mock distillation pipeline (mirrors masterAgentProcessor.js + run-master-agent/index.ts) ──

async function fetchUndistilledBatch(limit = 50) {
  const { data, error } = await admin
    .from("raw_fragments")
    .select("id, user_id, content, category_id, created_at")
    .eq("status", "completed")
    .eq("is_distilled", false)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

function findDominantCategory(batch) {
  const counts = {};
  for (const f of batch) {
    if (f.category_id) {
      counts[f.category_id] = (counts[f.category_id] || 0) + 1;
    }
  }
  let dominantId = null;
  let maxCount = 0;
  for (const [id, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantId = id;
    }
  }
  return { dominantId, categoryCount: Object.keys(counts).length };
}

async function fetchCategoryName(categoryId) {
  if (!categoryId) return "General";
  const { data } = await admin
    .from("categories")
    .select("name")
    .eq("id", categoryId)
    .single();
  return data?.name || "General";
}

function generateDistilledContent(batch, categoryName, categoryCount) {
  const uniqueUsers = new Set(batch.map((f) => f.user_id));
  const contributorCount = uniqueUsers.size;

  const title = `Reflections on ${categoryName}`;
  const summary =
    `A distillation of ${batch.length} fragments across ${categoryCount} categories, ` +
    `with a focus on ${categoryName}.`;

  const excerpts = batch
    .slice(0, 10)
    .map((f, i) => {
      const trimmed =
        f.content.length > 120 ? f.content.slice(0, 120) + "…" : f.content;
      return `${i + 1}. "${trimmed}"`;
    })
    .join("\n\n");

  const content =
    `## ${title}\n\n` +
    `${summary}\n\n` +
    `### Key Fragments\n\n${excerpts}\n\n` +
    `---\n` +
    `*Distilled from ${batch.length} community fragments by ${contributorCount} contributors.*`;

  return { title, content, summary, contributorCount };
}

async function runMockDistillation(threshold = 50) {
  // Fetch enough to potentially cover the threshold
  const batch = await fetchUndistilledBatch(Math.max(threshold, 50));
  if (batch.length < threshold) {
    return { skipped: true, reason: `Only ${batch.length} undistilled completed fragments (need ${threshold})` };
  }

  const usable = batch.slice(0, threshold);
  const { dominantId, categoryCount } = findDominantCategory(usable);
  const categoryName = await fetchCategoryName(dominantId);
  const { title, content, summary, contributorCount } = generateDistilledContent(usable, categoryName, categoryCount);

  return {
    skipped: false,
    result: {
      title,
      content,
      summary,
      source_fragment_ids: usable.map((f) => f.id),
      contributor_count: contributorCount,
      batch_size: usable.length,
      category_count: categoryCount,
      category_name: categoryName,
    },
  };
}

// ── Metrics ──

async function recordRunMetrics(threshold, timing, result) {
  console.log(`\n  ── Batch Size ${threshold} ──`);
  console.log(`  Duration: ${timing.toFixed(0)}ms`);
  if (result.skipped) {
    console.log(`  SKIPPED: ${result.reason}`);
    return;
  }
  const r = result.result;
  console.log(`  Batch size: ${r.batch_size}`);
  console.log(`  Contributors: ${r.contributor_count}`);
  console.log(`  Categories: ${r.category_count}`);
  console.log(`  Dominant category: ${r.category_name}`);
  console.log(`  Title: "${r.title}"`);
  console.log(`  Summary length: ${r.summary.length} chars`);
  console.log(`  Content length: ${r.content.length} chars`);
  console.log(`  Source fragment IDs: ${r.source_fragment_ids.length}`);
  console.log(`  Source fragment IDs are UUIDs: ${r.source_fragment_ids.every((id) => /^[0-9a-f-]{36}$/.test(id))}`);
}

// ── Check available fragments ──

async function checkCounts() {
  console.log("\n=== Current Fragment Counts ===\n");

  // Total
  const { count: total } = await admin
    .from("raw_fragments")
    .select("*", { count: "exact", head: true });
  console.log(`Total fragments: ${total}`);

  // By status
  for (const s of ["completed", "pending", "processing", "failed"]) {
    const { count: c } = await admin
      .from("raw_fragments")
      .select("*", { count: "exact", head: true })
      .eq("status", s);
    console.log(`  ${s}: ${c || 0}`);
  }

  // Undistilled completed
  const { count: undistilled } = await admin
    .from("raw_fragments")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed")
    .eq("is_distilled", false);
  console.log(`Undistilled completed: ${undistilled}`);

  // By category (sample)
  const { data: catDist } = await admin
    .from("raw_fragments")
    .select("category_id")
    .eq("status", "completed")
    .eq("is_distilled", false)
    .limit(5000);
  if (catDist) {
    const catCounts = {};
    for (const f of catDist) {
      const key = f.category_id || "null";
      catCounts[key] = (catCounts[key] || 0) + 1;
    }
    console.log("\nUndistilled completed by category (top 10):");
    Object.entries(catCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([catId, count]) => {
        console.log(`  ${catId === "null" ? "(no category)" : catId}: ${count}`);
      });
  }

  // User distribution
  const { data: userDist } = await admin
    .from("raw_fragments")
    .select("user_id")
    .eq("status", "completed")
    .eq("is_distilled", false)
    .limit(5000);
  if (userDist) {
    const userCounts = {};
    for (const f of userDist) {
      userCounts[f.user_id] = (userCounts[f.user_id] || 0) + 1;
    }
    console.log("\nUndistilled completed by user:");
    Object.entries(userCounts).forEach(([uid, count]) => {
      console.log(`  ${uid}: ${count}`);
    });
  }

  // Sample of oldest fragments (for FIFO verification)
  const { data: oldest } = await admin
    .from("raw_fragments")
    .select("id, created_at")
    .eq("status", "completed")
    .eq("is_distilled", false)
    .order("created_at", { ascending: true })
    .limit(5);
  if (oldest && oldest.length > 0) {
    console.log("\nOldest 5 undistilled completed fragments:");
    oldest.forEach((f) => console.log(`  ${f.id.slice(0, 8)}... created ${f.created_at}`));
  }

  console.log("");
}

// ── Main ──

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--check")) {
    await checkCounts();
    return;
  }

  const singleThreshold = args.length > 0 && !args[0].startsWith("--") ? parseInt(args[0], 10) : null;

  const thresholds = singleThreshold ? [singleThreshold] : [50, 100, 500, 1000];

  console.log("\n=== Master Agent Stress Test ===\n");

  // Phase 1: Check available state
  await checkCounts();

  // Phase 2: Run distillation at each threshold
  console.log("=== Running Distillation at Each Threshold ===\n");

  for (const threshold of thresholds) {
    const start = performance.now();
    const result = await runMockDistillation(threshold);
    const timing = performance.now() - start;
    await recordRunMetrics(threshold, timing, result);
  }

  // Phase 3: Summary
  console.log("\n=== Stress Test Complete ===\n");
}

main().catch((err) => {
  console.error("\nStress test failed:", err);
  process.exit(1);
});
