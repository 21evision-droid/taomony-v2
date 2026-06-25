/**
 * Seed distilled_posts for Featured Resonance validation.
 * Creates 5 posts: 3 published, 2 draft.
 *
 * Usage: node scripts/seed-distilled-posts.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3NnYWVnb3VkY3V0ZG5xeWRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODAzNzU4MiwiZXhwIjoyMDkzNjEzNTgyfQ.iz4bAmGRw5pnilex1dNqEstakhdYLdhpw7I8l6MCMIw";

const SUPABASE_URL = "https://jiwsgaegoudcutdnqydf.supabase.co";

const POSTS = [
  { title: "The Way of Stillness", status: "published", days_ago: 7 },
  { title: "Community Wisdom: Daily Practice", status: "published", days_ago: 5 },
  { title: "Harmony in Daily Life", status: "published", days_ago: 3 },
  { title: "Draft: Inner Alchemy Insights", status: "draft", days_ago: 2 },
  { title: "Draft: Gratitude Circle", status: "draft", days_ago: 1 },
];

async function main() {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  for (const post of POSTS) {
    const { data: frags } = await admin
      .from("raw_fragments")
      .select("id, user_id")
      .eq("status", "completed")
      .eq("is_distilled", false)
      .limit(50);

    if (!frags || frags.length < 50) {
      console.log(`Not enough fragments for "${post.title}" (found ${frags?.length || 0})`);
      continue;
    }

    const batch = frags.slice(0, 50);
    const uniqueUsers = new Set(batch.map((f) => f.user_id));

    const publishedAt =
      post.status === "published"
        ? new Date(Date.now() - post.days_ago * 86400000).toISOString()
        : null;

    const { data: result, error } = await admin
      .from("distilled_posts")
      .insert({
        title: post.title,
        content: [
          `## ${post.title}`,
          "",
          "A curated collection of community reflections on this theme.",
          "",
          "### Key Fragments",
          "",
          batch
            .slice(0, 10)
            .map(
              (f, i) =>
                `${i + 1}. "${(f.content || "").slice(0, 120)}${
                  f.content?.length > 120 ? "..." : ""
                }"`
            )
            .join("\n\n"),
          "",
          "---",
          `*Distilled from ${batch.length} community fragments by ${uniqueUsers.size} contributors.*`,
        ].join("\n"),
        summary: `A distillation of community wisdom on ${post.title.toLowerCase()}.`,
        source_fragment_ids: batch.map((f) => f.id),
        contributor_count: uniqueUsers.size,
        status: post.status,
        published_at: publishedAt,
      })
      .select("id")
      .single();

    if (error) {
      console.error(`"${post.title}" FAILED:`, error.message);
      continue;
    }

    console.log(`"${post.title}" → ${result.id} (${post.status})`);

    // Mark fragments as distilled so they won't be re-selected
    await admin
      .from("raw_fragments")
      .update({ is_distilled: true })
      .in("id", batch.map((f) => f.id));
  }

  // Verify final state
  console.log("\n=== Verification ===");
  const { data: posts } = await admin
    .from("distilled_posts")
    .select("id, title, status, published_at")
    .order("created_at", { ascending: false });

  if (posts) {
    for (const p of posts) {
      console.log(`  [${p.status}] ${p.title} (${p.id.slice(0, 8)}...) published_at=${p.published_at || "null"}`);
    }
  }
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
