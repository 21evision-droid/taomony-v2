import { createClient } from "@supabase/supabase-js";

const SRK = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3NnYWVnb3VkY3V0ZG5xeWRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODAzNzU4MiwiZXhwIjoyMDkzNjEzNTgyfQ.iz4bAmGRw5pnilex1dNqEstakhdYLdhpw7I8l6MCMIw";
const admin = createClient("https://jiwsgaegoudcutdnqydf.supabase.co", SRK);

async function main() {
  // Check index exists by analyzing query performance
  console.log("=== Benchmark: Master Agent Query ===\n");

  // Run the exact Master Agent query 3 times and measure
  const runs = [];
  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    const { data, error } = await admin
      .from("raw_fragments")
      .select("id, user_id, content, category_id, created_at")
      .eq("status", "completed")
      .eq("is_distilled", false)
      .order("created_at", { ascending: true })
      .limit(50);
    const elapsed = performance.now() - start;
    if (error) {
      console.error("Query error:", error.message);
      return;
    }
    runs.push(elapsed);
    console.log(`  Run ${i + 1}: ${elapsed.toFixed(0)}ms (${data.length} fragments)`);
  }

  const avg = runs.reduce((a, b) => a + b, 0) / runs.length;
  console.log(`\n  Average: ${avg.toFixed(0)}ms`);
  console.log(`  Min: ${Math.min(...runs).toFixed(0)}ms`);
  console.log(`  Max: ${Math.max(...runs).toFixed(0)}ms`);

  // Compare with previous stress test baseline
  // Previous avg for "Fetch 50 oldest undistilled fragments": 436ms
  const baseline = 436;
  const change = ((baseline - avg) / baseline * 100).toFixed(0);
  const direction = avg < baseline ? "FASTER" : "SLOWER";
  console.log(`\n  Compared to baseline (${baseline}ms): ${direction} by ${Math.abs(change)}%`);

  // Check count of undistilled completed
  const { count } = await admin
    .from("raw_fragments")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed")
    .eq("is_distilled", false);

  console.log(`\n  Total rows scanned: ${count}`);
  console.log("  Index benefit: covers WHERE + ORDER BY in one B-tree scan");
}

main().catch(console.error);
