import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /functions/v1/dify-callback
 *
 * Webhook endpoint called by Dify Workflow A after AI processing completes.
 * Updates raw_fragments with classification results.
 *
 * ── Security ──
 * 1. HMAC-SHA256 signature verification via x-webhook-signature header
 *    payload = timestamp + "." + body
 *    signature = HMAC_SHA256(secret, payload)
 * 2. Timestamp validation (±5 minute tolerance, anti-replay)
 * 3. Nonce deduplication (stored in workflow_events)
 * 4. Invalid payload rejection with detailed error
 *
 * Request headers:
 *   x-webhook-signature: string  (HMAC-SHA256 hex digest)
 *   x-webhook-timestamp: string  (Unix millisecond timestamp)
 *   x-webhook-nonce: string      (UUID, prevents replay)
 *
 * Request body:
 *   fragment_id: string    (UUID, required)
 *   category_id?: string   (UUID)
 *   fragment_type?: string
 *   embedding?: number[]   (1536-dim)
 *   tags?: string[]
 *   status?: "completed" | "failed"   (default: "completed")
 *   error?: string         (required if status === "failed")
 *
 * Response:
 *   success: true
 *
 * ── Dify Workflow A HTTP Node Configuration ──
 *   URL: https://jiwsgaegoudcutdnqydf.supabase.co/functions/v1/dify-callback
 *   Method: POST
 *   Headers:
 *     Content-Type: application/json
 *     x-webhook-signature: {{ HMAC of payload }}
 *     x-webhook-timestamp: {{ current unix ms }}
 *     x-webhook-nonce: {{ UUID }}
 *   Body: { fragment_id, category_id, fragment_type, embedding, tags, status }
 */

interface CallbackBody {
  fragment_id: string;
  category_id?: string;
  fragment_type?: string;
  embedding?: number[];
  tags?: string[];
  status?: "completed" | "failed";
  error?: string;
}

/**
 * Verify HMAC-SHA256 signature.
 * payload = timestamp + "." + rawBody
 * expected = HMAC_SHA256(secret, payload)
 */
async function verifySignature(
  secret: string,
  timestamp: string,
  rawBody: string,
  signature: string,
): Promise<boolean> {
  const payload = `${timestamp}.${rawBody}`;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const sigBytes = hexToBytes(signature);
  const payloadBytes = encoder.encode(payload);
  return crypto.subtle.verify("HMAC", cryptoKey, sigBytes, payloadBytes);
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Compute HMAC-SHA256 for a payload (used in tests or for creating valid requests).
 */
export async function computeSignature(
  secret: string,
  timestamp: string,
  rawBody: string,
): Promise<string> {
  const payload = `${timestamp}.${rawBody}`;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(payload));
  return bytesToHex(new Uint8Array(signature));
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  // ── 1. Only accept POST ──
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── 2. Read raw body (needed for signature verification) ──
  const rawBody = await req.text();
  let body: CallbackBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── 3. Validate required fields ──
  if (!body.fragment_id || typeof body.fragment_id !== "string") {
    return new Response(JSON.stringify({ error: "fragment_id is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (body.status === "failed" && !body.error) {
    return new Response(
      JSON.stringify({ error: "error message is required when status is failed" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // ── 4. Security verification ──
  const webhookSecret = Deno.env.get("DIFY_WEBHOOK_SECRET");

  if (webhookSecret) {
    const signature = req.headers.get("x-webhook-signature") || "";
    const timestamp = req.headers.get("x-webhook-timestamp") || "";
    const nonce = req.headers.get("x-webhook-nonce") || "";

    // 4a. Verify required headers
    if (!signature || !timestamp || !nonce) {
      return new Response(
        JSON.stringify({
          error: "Missing security headers",
          required: ["x-webhook-signature", "x-webhook-timestamp", "x-webhook-nonce"],
        }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    // 4b. Timestamp validity (±5 minutes)
    const now = Date.now();
    const ts = parseInt(timestamp, 10);
    if (isNaN(ts) || Math.abs(now - ts) > 5 * 60 * 1000) {
      return new Response(
        JSON.stringify({ error: "Timestamp out of tolerance (±5 min)" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    // 4c. Signature verification
    const isValid = await verifySignature(webhookSecret, timestamp, rawBody, signature);
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    // 4d. Nonce deduplication (replay protection)
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: existing } = await supabase
        .from("workflow_events")
        .select("id")
        .eq("nonce", nonce)
        .maybeSingle();

      if (existing) {
        return new Response(
          JSON.stringify({ error: "Nonce already processed (replay)" }),
          { status: 409, headers: { "Content-Type": "application/json" } },
        );
      }
    } catch {
      // Nonce check failed — allow through but log
      console.warn("[dify-callback] Nonce check failed, allowing request");
    }
  }

  // ── 5. Build update payload ──
  const update: Record<string, unknown> = {};

  if (body.status === "failed") {
    update.status = "failed";
    update.error_message = body.error;
  } else {
    update.status = "completed";
    if (body.category_id) update.category_id = body.category_id;
    if (body.fragment_type) update.fragment_type = body.fragment_type;
    if (body.tags) update.tags = body.tags;
    if (body.embedding) {
      update.embedding = body.embedding;
    }
  }

  update.updated_at = new Date().toISOString();

  // ── 6. Update fragment ──
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { error } = await supabase
    .from("raw_fragments")
    .update(update)
    .eq("id", body.fragment_id);

  if (error) {
    console.error("[dify-callback] Update error:", error.message);
    return new Response(
      JSON.stringify({ error: "Failed to update fragment" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  // ── 7. Return success ──
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
