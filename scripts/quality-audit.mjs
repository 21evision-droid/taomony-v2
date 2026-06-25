/**
 * Distillation Quality Audit — Validation Phase
 *
 * Analyzes distillation quality across 5 dimensions:
 *   1. Topic coherence
 *   2. Summary quality
 *   3. Duplicate handling
 *   4. Multi-channel aggregation
 *   5. Contributor attribution
 *   6. FIFO ordering
 *
 * Usage: node scripts/quality-audit.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://jiwsgaegoudcutdnqydf.supabase.co";
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3NnYWVnb3VkY3V0ZG5xeWRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODAzNzU4MiwiZXhwIjoyMDkzNjEzNTgyfQ.iz4bAmGRw5pnilex1dNqEstakhdYLdhpw7I8l6MCMIw";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function auditTopicCoherence() {
  console.log("\n═══ 1. Topic Coherence ═══\n");

  // Fetch a batch as the pipeline would see it
  const { data: batch } = await admin
    .from("raw_fragments")
    .select("id, content, channel_id, category_id, created_at")
    .eq("status", "completed")
    .eq("is_distilled", false)
    .order("created_at", { ascending: true })
    .limit(50);

  if (!batch || batch.length === 0) {
    console.log("  No undistilled completed fragments available.\n");
    return;
  }

  console.log(`  Batch size: ${batch.length}`);
  console.log(`  Date range: ${batch[0].created_at.slice(0, 10)} to ${batch[batch.length - 1].created_at.slice(0, 10)}`);

  // Channel distribution
  const channelCounts = {};
  for (const f of batch) {
    channelCounts[f.channel_id] = (channelCounts[f.channel_id] || 0) + 1;
  }
  console.log(`  Channel diversity: ${Object.keys(channelCounts).length} unique channels`);
  for (const [ch, count] of Object.entries(channelCounts).sort((a, b) => b[1] - a[1])) {
    const { data: chName } = await admin.from("channels").select("name").eq("id", ch).single();
    console.log(`    ${chName?.name || ch}: ${count} fragments`);
  }

  // Category analysis
  const catCounts = {};
  for (const f of batch) {
    const key = f.category_id || "null";
    catCounts[key] = (catCounts[key] || 0) + 1;
  }
  console.log(`  Category diversity: ${Object.keys(catCounts).length} unique categories`);
  if (Object.keys(catCounts).length === 1 && catCounts["null"]) {
    console.log("  ⚠ WARNING: All fragments have null category_id.");
    console.log("  This means category_id is not being populated during fragment insertion.");
    console.log("  Recommendation: Update the fragment submission flow to denormalize category_id from channel_id.");
  }

  // Content overlap check — look for similar content across fragments
  const contentStartSet = new Set();
  let potentialDuplicates = 0;
  for (const f of batch) {
    const prefix = f.content.slice(0, 50);
    if (contentStartSet.has(prefix)) potentialDuplicates++;
    contentStartSet.add(prefix);
  }
  console.log(`  Potential near-duplicates (same first 50 chars): ${potentialDuplicates}`);
}

async function auditSummaryQuality() {
  console.log("\n═══ 2. Summary Quality ═══\n");

  const { data: posts } = await admin
    .from("distilled_posts")
    .select("id, title, summary, content, status, published_at, contributor_count, source_fragment_ids")
    .order("created_at", { ascending: false });

  if (!posts || posts.length === 0) {
    console.log("  No distilled posts to analyze.\n");
    return;
  }

  console.log(`  Total posts: ${posts.length} (${posts.filter((p) => p.status === "published").length} published, ${posts.filter((p) => p.status === "draft").length} draft)\n`);

  for (const post of posts) {
    const issues = [];

    // Title quality
    if (!post.title || post.title.length < 5) issues.push("Title too short");
    if (post.title.startsWith("Reflections on")) issues.push("Generic title pattern");

    // Summary quality
    if (!post.summary || post.summary.length < 20) issues.push("Summary too short");
    if (post.summary.startsWith("A distillation of") || post.summary.startsWith("A curated collection")) issues.push("Generic summary pattern");

    // Content quality
    if (!post.content || post.content.length < 100) issues.push("Content too short");
    if (post.content.includes("undefined")) issues.push("Content contains undefined");
    if (post.content.includes("[object Object]")) issues.push("Content contains [object Object]");

    // Contributor accuracy
    if (!post.contributor_count || post.contributor_count < 1) issues.push("Missing contributor count");
    if (post.source_fragment_ids && post.source_fragment_ids.length < 10) issues.push("Too few source fragments");

    // Published_at for published posts
    if (post.status === "published" && !post.published_at) issues.push("Published post missing published_at");

    const status = issues.length === 0 ? "✓" : "⚠";
    console.log(`  ${status} [${post.status}] "${post.title}"`);
    if (issues.length > 0) {
      console.log(`       Issues: ${issues.join(", ")}`);
    }
    console.log(`       Summary: "${(post.summary || "").slice(0, 100)}${post.summary?.length > 100 ? "..." : ""}"`);
    console.log(`       Content: ${post.content?.length || 0} chars, ${post.source_fragment_ids?.length || 0} source fragments, ${post.contributor_count} contributors`);
  }
}

async function auditDuplicateHandling() {
  console.log("\n═══ 3. Duplicate Handling ═══\n");

  // Check if any fragment ID appears in more than one distilled post
  const { data: posts } = await admin
    .from("distilled_posts")
    .select("id, title, source_fragment_ids");

  if (!posts || posts.length === 0) {
    console.log("  No distilled posts to analyze.\n");
    return;
  }

  const fragmentPostMap = {};
  let duplicateFragments = 0;

  for (const post of posts) {
    if (!post.source_fragment_ids) continue;
    for (const fragId of post.source_fragment_ids) {
      if (fragmentPostMap[fragId]) {
        duplicateFragments++;
        console.log(`  ⚠ Fragment ${fragId.slice(0, 8)}... used in both "${fragmentPostMap[fragId]}" and "${post.title}"`);
      } else {
        fragmentPostMap[fragId] = post.title;
      }
    }
  }

  if (duplicateFragments === 0) {
    console.log("  ✓ No duplicate fragments found across distilled posts.");
    console.log(`  (${Object.keys(fragmentPostMap).length} unique fragments referenced)`);
  } else {
    console.log(`  ⚠ Found ${duplicateFragments} fragments used in multiple posts.`);
  }

  // Also check if any distilled fragments are not marked is_distilled=true
  const { count: unmarked } = await admin
    .from("raw_fragments")
    .select("*", { count: "exact", head: true })
    .in("id", Object.keys(fragmentPostMap))
    .eq("is_distilled", false);

  if (unmarked && unmarked > 0) {
    console.log(`  ⚠ ${unmarked} referenced fragments are NOT marked as is_distilled=true`);
  } else {
    console.log("  ✓ All referenced fragments are properly marked as distilled.");
  }
}

async function auditMultiChannelAggregation() {
  console.log("\n═══ 4. Multi-Channel Aggregation ═══\n");

  // For each distilled post, analyze the channel diversity of its source fragments
  const { data: posts } = await admin
    .from("distilled_posts")
    .select("id, title, status, source_fragment_ids")
    .order("created_at", { ascending: false });

  if (!posts || posts.length === 0) {
    console.log("  No distilled posts to analyze.\n");
    return;
  }

  for (const post of posts) {
    if (!post.source_fragment_ids || post.source_fragment_ids.length === 0) {
      console.log(`  [${post.status}] "${post.title}": No source fragments`);
      continue;
    }

    const { data: frags } = await admin
      .from("raw_fragments")
      .select("channel_id")
      .in("id", post.source_fragment_ids);

    if (!frags) continue;

    const chCounts = {};
    for (const f of frags) {
      chCounts[f.channel_id] = (chCounts[f.channel_id] || 0) + 1;
    }

    // Get channel names
    const chNames = {};
    for (const chId of Object.keys(chCounts)) {
      const { data: ch } = await admin.from("channels").select("name").eq("id", chId).single();
      chNames[chId] = ch?.name || chId.slice(0, 8);
    }

    const channelList = Object.entries(chCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([id, count]) => `${chNames[id]}(${count})`)
      .join(", ");

    console.log(`  "${post.title}": ${Object.keys(chCounts).length} channels (${frags.length} fragments)`);
    console.log(`    ${channelList}`);
  }
}

async function auditContributorAttribution() {
  console.log("\n═══ 5. Contributor Attribution ═══\n");

  // Verify contributor counts match actual unique users
  const { data: posts } = await admin
    .from("distilled_posts")
    .select("id, title, contributor_count, source_fragment_ids")
    .order("created_at", { ascending: false });

  if (!posts || posts.length === 0) {
    console.log("  No distilled posts to analyze.\n");
    return;
  }

  for (const post of posts) {
    if (!post.source_fragment_ids || post.source_fragment_ids.length === 0) continue;

    const { data: frags } = await admin
      .from("raw_fragments")
      .select("user_id")
      .in("id", post.source_fragment_ids);

    if (!frags) continue;

    const actualContributors = new Set(frags.map((f) => f.user_id)).size;
    const match = actualContributors === post.contributor_count ? "✓" : "✗";

    console.log(`  ${match} "${post.title}": stored=${post.contributor_count}, actual=${actualContributors}`);
  }
}

async function auditFIFOOrdering() {
  console.log("\n═══ 6. FIFO Ordering ═══\n");

  // Check that fragments are being picked up oldest-first
  const { data: undistilled } = await admin
    .from("raw_fragments")
    .select("id, created_at")
    .eq("status", "completed")
    .eq("is_distilled", false)
    .order("created_at", { ascending: true })
    .limit(5);

  if (undistilled && undistilled.length > 0) {
    console.log("  Oldest 5 undistilled completed fragments:");
    for (const f of undistilled) {
      console.log(`    ${f.id.slice(0, 8)}... created ${f.created_at.slice(0, 19)}`);
    }
  }

  // Check the oldest distilled posts to see if they consumed old fragments
  const { data: oldestPost } = await admin
    .from("distilled_posts")
    .select("id, title, source_fragment_ids, created_at")
    .order("created_at", { ascending: true })
    .limit(3);

  if (oldestPost && oldestPost.length > 0) {
    console.log("\n  Oldest distilled posts (FIFO verification):");
    for (const post of oldestPost) {
      if (!post.source_fragment_ids || post.source_fragment_ids.length === 0) continue;

      const { data: frags } = await admin
        .from("raw_fragments")
        .select("created_at")
        .in("id", post.source_fragment_ids)
        .order("created_at", { ascending: true })
        .limit(2);

      if (frags && frags.length > 0) {
        console.log(`    "${post.title}" (created ${post.created_at.slice(0, 19)})`);
        console.log(`      Source range: ${frags[0].created_at.slice(0, 19)} ... ${frags[frags.length - 1].created_at.slice(0, 19)}`);
      }
    }
  }

  // Verify no is_distilled=true fragments are in the "oldest undistilled" list
  if (undistilled) {
    const { count: total } = await admin
      .from("raw_fragments")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed")
      .eq("is_distilled", false);
    console.log(`\n  Total undistilled completed remaining: ${total}`);
  }
}

async function main() {
  console.log("========================================");
  console.log("  Distillation Quality Audit");
  console.log("========================================");

  await auditTopicCoherence();
  await auditSummaryQuality();
  await auditDuplicateHandling();
  await auditMultiChannelAggregation();
  await auditContributorAttribution();
  await auditFIFOOrdering();

  console.log("\n========================================");
  console.log("  Quality Audit Complete");
  console.log("========================================\n");
}

main().catch((err) => {
  console.error("Audit failed:", err);
  process.exit(1);
});
