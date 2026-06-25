import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

/**
 * POST /functions/v1/run-master-agent
 *
 * Triggers the Master Agent distillation pipeline.
 * Acquires advisory lock (42) to prevent concurrent runs.
 * Checks for undistilled completed fragments, runs deterministic
 * mock distillation, persists the result to distilled_posts,
 * and marks source fragments as distilled.
 *
 * Auth: service_role key only (auth: ["secret"])
 *
 * Response (success):
 *   success: true
 *   action: "distilled" | "insufficient_fragments"
 *   distilled_post_id?: string
 *   fragment_count?: number
 *
 * Response (error):
 *   error: string
 */
export default {
  fetch: withSupabase({ auth: ["secret"] }, async (req, ctx) => {
    // ── 1. Only accept POST ──
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ── 2. Acquire advisory lock ──
    // Blocks if another instance holds lock 42 (distillation).
    // Auto-released when the transaction ends or connection closes.
    try {
      await ctx.supabaseAdmin.rpc("acquire_distillation_lock");
    } catch (lockError: any) {
      console.error("[run-master-agent] Lock error:", lockError.message);
      return new Response(
        JSON.stringify({ error: "Failed to acquire distillation lock" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // ── 3. Create run record ──
    const { data: run, error: runError } = await ctx.supabaseAdmin
      .from("master_agent_runs")
      .insert({
        status: "running",
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (runError) {
      console.error(
        "[run-master-agent] Failed to create run record:",
        runError.message,
      );
      return new Response(
        JSON.stringify({ error: "Failed to create run record" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const runId = run.id;

    // ── 4. Main pipeline with error recovery ──
    try {
      return await runDistillation(ctx, runId);
    } catch (err: any) {
      console.error("[run-master-agent] Error:", err.message);

      await ctx.supabaseAdmin
        .from("master_agent_runs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          error_message: err.message,
        })
        .eq("id", runId);

      return new Response(
        JSON.stringify({ error: "Distillation failed", detail: err.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
};

// ═════════════════════════════════════════════════════════════
// Distillation Pipeline
// ═════════════════════════════════════════════════════════════

const DISTILLATION_THRESHOLD = 50;

async function runDistillation(ctx: any, runId: string) {
  // ── 4a. Count undistilled completed fragments ──
  const { count, error: countError } = await ctx.supabaseAdmin
    .from("raw_fragments")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed")
    .eq("is_distilled", false);

  if (countError) throw countError;

  if (!count || count < DISTILLATION_THRESHOLD) {
    // Not enough fragments — mark run as completed, no action
    await ctx.supabaseAdmin
      .from("master_agent_runs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        fragment_count: count || 0,
      })
      .eq("id", runId);

    return new Response(
      JSON.stringify({
        success: true,
        action: "insufficient_fragments",
        fragment_count: count || 0,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  // ── 4b. Fetch batch (oldest first, FIFO) ──
  const { data: fragments, error: fetchError } = await ctx.supabaseAdmin
    .from("raw_fragments")
    .select("id, user_id, content, category_id, created_at")
    .eq("status", "completed")
    .eq("is_distilled", false)
    .order("created_at", { ascending: true })
    .limit(DISTILLATION_THRESHOLD);

  if (fetchError) throw fetchError;
  if (!fragments || fragments.length === 0) {
    throw new Error("No fragments returned despite count check");
  }

  const batch = fragments.slice(0, DISTILLATION_THRESHOLD);

  // ── 4c. Determine dominant category ──
  const categoryCounts: Record<string, number> = {};
  for (const f of batch) {
    if (f.category_id) {
      categoryCounts[f.category_id] =
        (categoryCounts[f.category_id] || 0) + 1;
    }
  }

  let dominantCategoryId: string | null = null;
  let maxCount = 0;
  for (const [catId, count] of Object.entries(categoryCounts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantCategoryId = catId;
    }
  }

  // ── 4d. Resolve category name ──
  let categoryName = "General";
  if (dominantCategoryId) {
    const { data: cat } = await ctx.supabaseAdmin
      .from("categories")
      .select("name")
      .eq("id", dominantCategoryId)
      .single();
    if (cat) categoryName = cat.name;
  }

  const uniqueUsers = new Set(batch.map((f: any) => f.user_id));
  const contributorCount = uniqueUsers.size;
  const categoryCount = Object.keys(categoryCounts).length;

  // ── 4e. Generate distilled content ──
  const title = `Reflections on ${categoryName}`;
  const summary =
    `A distillation of ${batch.length} fragments across ${categoryCount} categories, ` +
    `with a focus on ${categoryName}.`;

  const excerpts = batch
    .slice(0, 10)
    .map((f: any, i: number) => {
      const trimmed =
        f.content.length > 120
          ? f.content.slice(0, 120) + "…"
          : f.content;
      return `${i + 1}. "${trimmed}"`;
    })
    .join("\n\n");

  const content =
    `## ${title}\n\n` +
    `${summary}\n\n` +
    `### Key Fragments\n\n${excerpts}\n\n` +
    `---\n` +
    `*Distilled from ${batch.length} community fragments by ${contributorCount} contributors.*`;

  const sourceFragmentIds = batch.map((f: any) => f.id);

  // ── 4f. Insert distilled post ──
  const { data: post, error: insertError } = await ctx.supabaseAdmin
    .from("distilled_posts")
    .insert({
      title,
      content,
      summary,
      source_fragment_ids: sourceFragmentIds,
      contributor_count: contributorCount,
      status: "draft",
    })
    .select("id")
    .single();

  if (insertError) throw insertError;

  // ── 4g. Mark fragments as distilled ──
  const { error: updateError } = await ctx.supabaseAdmin
    .from("raw_fragments")
    .update({ is_distilled: true })
    .in("id", sourceFragmentIds);

  if (updateError) throw updateError;

  // ── 4h. Update run record as completed ──
  await ctx.supabaseAdmin
    .from("master_agent_runs")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      fragment_count: batch.length,
      distilled_post_id: post.id,
    })
    .eq("id", runId);

  // ── 4i. Return success ──
  return new Response(
    JSON.stringify({
      success: true,
      action: "distilled",
      distilled_post_id: post.id,
      fragment_count: batch.length,
      contributor_count: contributorCount,
      title,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
