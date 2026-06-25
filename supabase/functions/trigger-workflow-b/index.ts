import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /functions/v1/trigger-workflow-b
 *
 * Triggers Dify Workflow B (Fragment Distillation).
 * Fetches eligible fragments, sends them to Dify, and stores the result.
 *
 * Called by masterAgentProcessor or a scheduled cron.
 *
 * Request body: (optional — empty body triggers default batch)
 *   threshold?: number  (minimum fragment count, default: 50)
 *
 * Response:
 *   success: true
 *   distilled_post_id?: string
 *   fragment_count: number
 */

const DISTILLATION_THRESHOLD = 50;
const MAX_BATCH_SIZE = 50;

Deno.serve(async (req) => {
  // ── 1. Only accept POST ──
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── 2. Parse optional body ──
  let threshold = DISTILLATION_THRESHOLD;
  try {
    const body = await req.json();
    if (body.threshold && typeof body.threshold === "number") {
      threshold = body.threshold;
    }
  } catch {
    // Empty body is fine — use defaults
  }

  // ── 3. Load config ──
  const DIFY_BASE_URL = Deno.env.get("DIFY_BASE_URL");
  const DIFY_WORKFLOW_B_KEY = Deno.env.get("DIFY_WORKFLOW_B_API_KEY");

  if (!DIFY_BASE_URL || !DIFY_WORKFLOW_B_KEY) {
    console.error("[trigger-workflow-b] Missing Dify configuration");
    return new Response(
      JSON.stringify({ error: "Dify not configured" }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // ── 4. Fetch eligible fragments ──
  const { data: fragments, error: fetchError } = await supabase
    .from("raw_fragments")
    .select("id, user_id, content, category_id, created_at")
    .eq("status", "completed")
    .eq("is_distilled", false)
    .order("created_at", { ascending: true })
    .limit(MAX_BATCH_SIZE);

  if (fetchError) {
    console.error("[trigger-workflow-b] Query error:", fetchError.message);
    return new Response(
      JSON.stringify({ error: "Failed to fetch fragments" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!fragments || fragments.length < threshold) {
    return new Response(
      JSON.stringify({
        success: false,
        fragment_count: fragments?.length || 0,
        message: `Threshold not reached: ${fragments?.length || 0} < ${threshold}`,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  const batch = fragments.slice(0, Math.min(threshold, MAX_BATCH_SIZE));

  // ── 5. Log workflow event ──
  const requestId = crypto.randomUUID();
  await supabase.from("workflow_events").insert({
    request_id: requestId,
    workflow_id: "workflow-b",
    status: "started",
    started_at: new Date().toISOString(),
  }).maybeSingle();

  // ── 6. Call Dify Workflow B ──
  const difyPayload = {
    inputs: {
      fragments: batch.map((f) => ({
        id: f.id,
        content: f.content,
        category_id: f.category_id,
        user_id: f.user_id,
      })),
    },
    response_mode: "blocking",
    user: "taomony-system",
  };

  const difyUrl = `${DIFY_BASE_URL}/v1/workflows/run`;

  let difyResponse;
  try {
    difyResponse = await fetch(difyUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DIFY_WORKFLOW_B_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(difyPayload),
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Network error";
    console.error("[trigger-workflow-b] Dify API call failed:", errMsg);
    await supabase.from("workflow_events").insert({
      request_id: requestId,
      workflow_id: "workflow-b",
      status: "failed",
      error_message: errMsg,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    }).maybeSingle();
    return new Response(
      JSON.stringify({ error: "Dify API call failed", detail: errMsg }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!difyResponse.ok) {
    const errText = await difyResponse.text();
    console.error("[trigger-workflow-b] Dify error:", difyResponse.status, errText);
    await supabase.from("workflow_events").insert({
      request_id: requestId,
      workflow_id: "workflow-b",
      status: "failed",
      error_message: `Dify HTTP ${difyResponse.status}`,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    }).maybeSingle();
    return new Response(
      JSON.stringify({ error: "Dify workflow failed" }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }

  const difyResult = await difyResponse.json();
  const outputs = difyResult.data?.outputs;

  if (!outputs || !outputs.title || !outputs.content) {
    console.error("[trigger-workflow-b] Invalid Dify output:", JSON.stringify(outputs));
    await supabase.from("workflow_events").insert({
      request_id: requestId,
      workflow_id: "workflow-b",
      status: "failed",
      error_message: "Dify returned invalid output (missing title/content)",
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    }).maybeSingle();
    return new Response(
      JSON.stringify({ error: "Invalid Dify output" }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }

  // ── 7. Insert distilled_post ──
  const { data: post, error: insertError } = await supabase
    .from("distilled_posts")
    .insert({
      title: outputs.title,
      content: outputs.content,
      summary: outputs.summary || outputs.content.slice(0, 200),
      source_fragment_ids: batch.map((f) => f.id),
      contributor_count: new Set(batch.map((f) => f.user_id)).size,
      status: "published",
      published_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("[trigger-workflow-b] Insert error:", insertError.message);
    await supabase.from("workflow_events").insert({
      request_id: requestId,
      workflow_id: "workflow-b",
      status: "failed",
      error_message: "Failed to insert distilled_post: " + insertError.message,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    }).maybeSingle();
    return new Response(
      JSON.stringify({ error: "Failed to create distilled post" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  // ── 8. Mark fragments as distilled ──
  const { error: updateError } = await supabase
    .from("raw_fragments")
    .update({ is_distilled: true })
    .in("id", batch.map((f) => f.id));

  if (updateError) {
    console.error("[trigger-workflow-b] Mark distilled error:", updateError.message);
    // Non-fatal — post was created, just log the error
  }

  // ── 9. Log success ──
  await supabase.from("workflow_events").insert({
    request_id: requestId,
    workflow_id: "workflow-b",
    status: "completed",
    distilled_post_id: post.id,
    fragment_count: batch.length,
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  }).maybeSingle();

  // ── 10. Log to master_agent_logs ──
  await supabase.from("master_agent_logs").insert({
    distilled_post_id: post.id,
    fragment_count: batch.length,
    contributor_count: new Set(batch.map((f) => f.user_id)).size,
    status: "completed",
    workflow_run_id: difyResult.data?.workflow_run_id || null,
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  }).maybeSingle();

  return new Response(
    JSON.stringify({
      success: true,
      distilled_post_id: post.id,
      fragment_count: batch.length,
      title: outputs.title,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
