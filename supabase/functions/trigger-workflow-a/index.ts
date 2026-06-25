import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /functions/v1/trigger-workflow-a
 *
 * Triggers Dify Workflow A (Fragment Classification) for a single fragment.
 * Called by the client-side difyProcessor after fragment insert.
 *
 * Request body:
 *   fragment_id: string  (UUID, required)
 *
 * Response:
 *   success: true
 *   workflow_run_id: string
 */
interface TriggerBody {
  fragment_id: string;
}

Deno.serve(async (req) => {
  // ── 1. Only accept POST ──
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── 2. Parse body ──
  let body: TriggerBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { fragment_id } = body;

  if (!fragment_id || typeof fragment_id !== "string") {
    return new Response(
      JSON.stringify({ error: "fragment_id is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // ── 3. Load Dify configuration ──
  const DIFY_BASE_URL = Deno.env.get("DIFY_BASE_URL");
  const DIFY_WORKFLOW_A_KEY = Deno.env.get("DIFY_WORKFLOW_A_API_KEY");
  const DIFY_CALLBACK_URL = Deno.env.get("DIFY_CALLBACK_URL");

  if (!DIFY_BASE_URL || !DIFY_WORKFLOW_A_KEY) {
    console.error("[trigger-workflow-a] Missing Dify configuration");
    return new Response(
      JSON.stringify({ error: "Dify not configured" }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  // ── 4. Fetch fragment data ──
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: fragment, error: fetchError } = await supabase
    .from("raw_fragments")
    .select("id, content, channel_id, user_id, source_type")
    .eq("id", fragment_id)
    .single();

  if (fetchError || !fragment) {
    console.error("[trigger-workflow-a] Fragment not found:", fragment_id);
    return new Response(
      JSON.stringify({ error: "Fragment not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  }

  // ── 5. Log workflow event ──
  await supabase.from("workflow_events").insert({
    request_id: crypto.randomUUID(),
    workflow_id: "workflow-a",
    fragment_id: fragment.id,
    status: "started",
    started_at: new Date().toISOString(),
  }).maybeSingle();

  // ── 6. Call Dify Workflow A ──
  const difyPayload = {
    inputs: {
      fragment_id: fragment.id,
      content: fragment.content,
      channel_id: fragment.channel_id || "",
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
        "Authorization": `Bearer ${DIFY_WORKFLOW_A_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(difyPayload),
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Network error";
    console.error("[trigger-workflow-a] Dify API call failed:", errMsg);
    await supabase.from("workflow_events").insert({
      request_id: crypto.randomUUID(),
      workflow_id: "workflow-a",
      fragment_id: fragment.id,
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
    console.error("[trigger-workflow-a] Dify returned error:", difyResponse.status, errText);
    await supabase.from("workflow_events").insert({
      request_id: crypto.randomUUID(),
      workflow_id: "workflow-a",
      fragment_id: fragment.id,
      status: "failed",
      error_message: `Dify HTTP ${difyResponse.status}: ${errText.slice(0, 200)}`,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    }).maybeSingle();
    return new Response(
      JSON.stringify({ error: "Dify workflow failed" }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }

  const difyResult = await difyResponse.json();

  // ── 7. Log success ──
  await supabase.from("workflow_events").insert({
    request_id: crypto.randomUUID(),
    workflow_id: "workflow-a",
    fragment_id: fragment.id,
    status: "completed",
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  }).maybeSingle();

  // ── 8. Return (Dify handles callback asynchronously via HTTP node) ──
  return new Response(
    JSON.stringify({
      success: true,
      workflow_run_id: difyResult.data?.workflow_run_id || null,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
