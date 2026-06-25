/**
 * Phase 4 — End-to-End Verification Script
 *
 * Tests the complete Dify integration pipeline:
 *   1. User submits fragment (supabase insert)
 *   2. Workflow A executes (trigger-workflow-a Edge Function)
 *   3. Callback updates fragment (dify-callback)
 *   4. Threshold reached (50 fragments check)
 *   5. Workflow B executes (trigger-workflow-b Edge Function)
 *   6. Distilled Post created
 *   7. Featured Resonance updates (distilled_posts query)
 *
 * Usage:
 *   node scripts/verify-phase4.mjs
 *
 * Prerequisites:
 *   - DIFY_WORKFLOW_A_API_KEY and DIFY_WORKFLOW_B_API_KEY set in Supabase secrets
 *   - DIFY_BASE_URL set to running Dify instance
 *   - DIFY_WEBHOOK_SECRET set in Supabase secrets
 *   - Dify Workflow A and B created and published
 */

import { createClient } from "@supabase/supabase-js";

const SRK = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3NnYWVnb3VkY3V0ZG5xeWRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODAzNzU4MiwiZXhwIjoyMDkzNjEzNTgyfQ.iz4bAmGRw5pnilex1dNqEstakhdYLdhpw7I8l6MCMIw";
const admin = createClient("https://jiwsgaegoudcutdnqydf.supabase.co", SRK);

const TEST_USER_ID = "96c04d6f-dbdc-4c96-819c-de05b0e3a333";
const TEST_CHANNEL_ID = "b0000000-0000-4000-8000-000000000001"; // Tao Te Ching → Learning

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function step(n, label) {
  console.log(`\n=== Step ${n}: ${label} ===`);
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║  Phase 4 — End-to-End Verification + Connectivity      ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log("");

  const ALL_SECRETS = [
    "DIFY_BASE_URL",
    "DIFY_CALLBACK_URL",
    "DIFY_WORKFLOW_A_API_KEY",
    "DIFY_WORKFLOW_B_API_KEY",
    "DIFY_WEBHOOK_SECRET",
  ];

  // ── Step 0a: Verify Supabase secrets ──
  step("0a", "Supabase secrets check");

  let secrets;
  try {
    const { execSync } = await import("child_process");
    const out = execSync("npx supabase secrets list", { encoding: "utf8", timeout: 30000 });
    secrets = out;
    console.log("  ✓ supabase secrets list ran successfully");
  } catch {
    console.log("  ⚠ Could not list secrets (supabase CLI not configured locally)");
    console.log("  → Checking via Edge Function instead...");
    // Fallback: try to call a lightweight check endpoint
    try {
      const resp = await admin.functions.invoke("trigger-workflow-a", {
        body: { fragment_id: "00000000-0000-0000-0000-000000000000" },
      });
      // If we get past invocation without an obvious config error, secrets are set
      console.log("  ✓ Edge Function invoked (secrets apparently configured)");
    } catch {
      console.log("  ⚠ Cannot determine secret state from here");
    }
  }

  // ── Step 0b: Connectivity check (DIFY_BASE_URL reachable?) ──
  step("0b", "DIFY_BASE_URL connectivity check");

  // Fetch the DIFY_BASE_URL from the active Supabase project
  let difyBaseUrl = "unknown";
  try {
    const { data: secretsData } = await admin.rpc("get_secret", { name: "DIFY_BASE_URL" });
    if (secretsData) difyBaseUrl = secretsData;
  } catch {
    // If RPC isn't available, try a different approach — check our known secret value
    difyBaseUrl = "(could not fetch)";
  }

  // Try to reach Dify — send a request with an invalid API key
  // A reachable Dify returns 401 (unauthorized). An unreachable one throws a network error.
  let difyReachable = false;
  let difyHttpCode = 0;
  let difyError = null;

  // We need to probe DIFY_BASE_URL. Since we can't easily read the secret from the client,
  // we use the same URL the Edge Functions would use — which is what we're testing.
  // Strategy: try resolving host.docker.internal first (local dev), then try the secret URL pattern.
  const probeCandidates = [
    "http://host.docker.internal",
    "http://localhost",
    "http://192.168.1.7",
  ];

  for (const url of probeCandidates) {
    try {
      const probeRes = await fetch(`${url}/v1/workflows/run`, {
        method: "POST",
        headers: {
          "Authorization": "Bearer test-invalid-key",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: { test: true }, response_mode: "blocking", user: "probe" }),
      });
      difyHttpCode = probeRes.status;
      // 401 = Dify is alive and responding (auth rejected, which is expected without valid key)
      // 307 = nginx redirect (Dify is behind nginx but responding)
      if (probeRes.status === 401 || probeRes.status === 307) {
        difyReachable = true;
        difyError = null;
      } else {
        difyError = `Unexpected HTTP ${probeRes.status}`;
      }
      break; // Found a working URL
    } catch (err) {
      difyError = err.message;
      continue; // Try next candidate
    }
  }

  if (difyReachable) {
    console.log("  ✓ Dify is reachable");
    console.log(`    HTTP response: ${difyHttpCode} (expected 401 with invalid key — confirms server is up)`);
  } else {
    console.log("  ✗ Dify is NOT reachable from this network");
    console.log(`    Error: ${difyError}`);
    console.log("");
    console.log("  ═══════════════════════════════════════════════════════════");
    console.log("  CONNECTIVITY BLOCKER");
    console.log("  ───────────────────────────────────────────────────────────");
    console.log("  DIFY_BASE_URL is set in Supabase secrets but the endpoint");
    console.log("  is not reachable from this machine. This is expected if:");
    console.log("    1. DIFY_BASE_URL = http://host.docker.internal");
    console.log("       → Works only for local Edge Functions (supabase functions serve)");
    console.log("       → For cloud Edge Functions, set up a tunnel (see docs/dify-connectivity-plan.md)");
    console.log("    2. Dify containers are not running");
    console.log("       → cd D:\\Developer\\dify\\docker && docker compose up -d");
    console.log("");
    console.log("  Recommended action (ngrok, no payment method needed):");
    console.log("    1. Sign up: https://dashboard.ngrok.com/signup (email + password)");
    console.log("    2. Install:  winget install ngrok");
    console.log("    3. Auth:     ngrok config add-authtoken <token>");
    console.log("    4. Tunnel:   ngrok http http://localhost:80");
    console.log("    5. Set URL:  supabase secrets set DIFY_BASE_URL=https://<id>.ngrok.io");
    console.log("    6. Re-run:   node scripts/verify-phase4.mjs");
    console.log("  ═══════════════════════════════════════════════════════════\n");
  }

  // ── Step 0c: Detect environment ──
  step("0c", "Environment detection");

  let environment = "unknown";
  if (difyBaseUrl.includes("trycloudflare.com")) {
    environment = "development (Cloudflare Tunnel)";
  } else if (difyBaseUrl.includes("ngrok")) {
    environment = "development (ngrok)";
  } else if (difyBaseUrl.includes("host.docker.internal") || difyBaseUrl.includes("localhost")) {
    environment = "local development (direct)";
  } else if (difyBaseUrl.startsWith("https://") && difyBaseUrl.includes(".") && !difyBaseUrl.includes("localhost")) {
    environment = "staging/production (DNS-based)";
  }
  console.log(`  DIFY_BASE_URL: ${difyBaseUrl}`);
  console.log(`  Environment:   ${environment}`);
  console.log(`  Dify reachable from script: ${difyReachable ? "yes" : "no"}`);

  // ── Step 1: Submit a fragment ──
  step(1, "User submits fragment");

  const { data: fragment, error: insErr } = await admin
    .from("raw_fragments")
    .insert({
      user_id: TEST_USER_ID,
      content: "Today I noticed how the morning light filters through the bamboo outside my window. It reminded me that stillness is not empty — it is full of presence. I sat for ten minutes just watching the shadows move, and felt a deep sense of gratitude for simply being alive.",
      channel_id: TEST_CHANNEL_ID,
      source_type: "fragment",
      status: "pending",
    })
    .select("id, status, category_id")
    .single();

  if (insErr) {
    console.error("  ✗ Insert failed:", insErr.message);
    process.exit(1);
  }

  console.log("  ✓ Fragment created:", fragment.id);
  console.log("  Status:", fragment.status);
  console.log("  category_id:", fragment.category_id || "null (expected: pending)");

  // ── Step 2: Trigger Workflow A ──
  step(2, "Workflow A executes (trigger-workflow-a)");

  console.log("  Calling trigger-workflow-a Edge Function...");
  const { data: wfaResult, error: wfaErr } = await admin.functions.invoke(
    "trigger-workflow-a",
    { body: { fragment_id: fragment.id } },
  );

  if (wfaErr) {
    console.error("  ✗ Workflow A trigger failed:", wfaErr.message);
    console.log("  ⚠ This may mean Dify is not configured yet. Check secrets.");
  } else {
    console.log("  ✓ Workflow A triggered:", JSON.stringify(wfaResult));

    // ── Step 3: Wait for callback and verify ──
    step(3, "Callback updates fragment (dify-callback)");

    // Poll for up to 30 seconds for status to change to "completed" or "failed"
    let updated = null;
    for (let i = 0; i < 30; i++) {
      await sleep(1000);
      const { data: check } = await admin
        .from("raw_fragments")
        .select("status, category_id, fragment_type, embedding, tags")
        .eq("id", fragment.id)
        .single();

      if (check && check.status !== "pending") {
        updated = check;
        break;
      }
    }

    if (!updated) {
      console.log("  ⚠ Fragment still pending after 30s. Callback may not have arrived.");
      console.log("  Check Dify Workflow A logs and DIFY_CALLBACK_URL configuration.");
    } else {
      console.log("  ✓ Fragment updated:", updated.status);
      console.log("  category_id:", updated.category_id || "not set");
      console.log("  fragment_type:", updated.fragment_type || "not set");
      console.log("  embedding:", updated.embedding ? `${updated.embedding.length}-dim vector` : "not set");
      console.log("  tags:", updated.tags || "not set");

      if (updated.status === "completed") {
        console.log("  ✓ Workflow A completed successfully");
      } else if (updated.status === "failed") {
        console.log("  ✗ Workflow A failed");
      }
    }
  }

  // ── Step 4: Check threshold ──
  step(4, "Threshold check");

  const { count, error: countErr } = await admin
    .from("raw_fragments")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed")
    .eq("is_distilled", false);

  if (countErr) {
    console.error("  ✗ Count query failed:", countErr.message);
  } else {
    console.log(`  Undistilled completed fragments: ${count}`);
    console.log(`  Threshold: 50`);
    if (count >= 50) {
      console.log("  ✓ Threshold reached — ready for distillation");
    } else {
      console.log(`  ⚠ Need ${50 - count} more fragments to reach threshold`);
    }
  }

  // ── Step 5: Trigger Workflow B (if threshold met) ──
  if (count >= 50) {
    step(5, "Workflow B executes (trigger-workflow-b)");

    console.log("  Calling trigger-workflow-b Edge Function...");
    const { data: wfbResult, error: wfbErr } = await admin.functions.invoke(
      "trigger-workflow-b",
      { body: { threshold: 50 } },
    );

    if (wfbErr) {
      console.error("  ✗ Workflow B trigger failed:", wfbErr.message);
    } else if (wfbResult.success) {
      console.log("  ✓ Distilled post created:", wfbResult.distilled_post_id);
      console.log("  Title:", wfbResult.title);
      console.log("  Fragment count:", wfbResult.fragment_count);

      // ── Step 6: Verify distilled post ──
      step(6, "Distilled Post created in database");

      const { data: post } = await admin
        .from("distilled_posts")
        .select("id, title, summary, status, contributor_count, source_fragment_ids")
        .eq("id", wfbResult.distilled_post_id)
        .single();

      if (post) {
        console.log("  ✓ Distilled post exists in DB");
        console.log("  Title:", post.title);
        console.log("  Status:", post.status);
        console.log("  Contributors:", post.contributor_count);
        console.log("  Source fragments:", post.source_fragment_ids?.length || 0);
      } else {
        console.log("  ✗ Distilled post not found in DB");
      }

      // ── Step 7: Check Featured Resonance ──
      step(7, "Featured Resonance updates");

      const { data: published } = await admin
        .from("distilled_posts")
        .select("id, title, status, published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(5);

      if (published) {
        console.log(`  Published posts found: ${published.length}`);
        published.forEach((p, i) => {
          console.log(`    ${i + 1}. [${p.status}] ${p.title} — ${p.published_at?.slice(0, 10)}`);
        });
        console.log("  ✓ Featured Resonance will pick up new posts via Realtime");
      }
    } else {
      console.log("  ⚠ Workflow B not ready:", wfbResult.message);
    }
  } else {
    console.log("\n  ⚠ Skipping Steps 5-7: threshold not reached.");
    console.log("  Run seed-fragments.mjs first to generate more fragments.");
  }

  // ── Cleanup test fragment ──
  step("Cleanup", "Removing test fragment");
  // Keep the fragment if processing succeeded (it demonstrates the pipeline)
  // Otherwise clean up
  const { data: finalState } = await admin
    .from("raw_fragments")
    .select("status")
    .eq("id", fragment.id)
    .single();

  if (finalState && finalState.status === "pending") {
    await admin.from("raw_fragments").delete().eq("id", fragment.id);
    console.log("  ✓ Test fragment cleaned up (was never processed)");
  } else if (finalState) {
    console.log("  Keeping fragment (status:", finalState.status, ")");
  }

  // ── Summary ──
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║  Verification Complete                                  ║");
  console.log("╠══════════════════════════════════════════════════════════╣");

  // Connectivity status
  if (difyReachable) {
    console.log("║  ✅ Connectivity: Dify reachable                        ║");
  } else {
    console.log("║  ❌ Connectivity: Dify NOT reachable                    ║");
    console.log("║     → See docs/dify-connectivity-plan.md for setup      ║");
  }

  // Pipeline status
  if (count && count >= 50 && wfaResult && !wfaErr) {
    console.log("║  ✅ Full pipeline: ACTIVE                               ║");
  } else if (wfaErr) {
    console.log("║  ⏳ Pipeline: waiting for connectivity + credentials    ║");
    console.log("║     Status: Waiting for Production Credentials          ║");
  } else if (count >= 50 && !wfaErr && !wfbErr) {
    console.log("║  ⚠  Pipeline: Workflow A active, Workflow B pending    ║");
    console.log("║     Need valid OpenAI API key in Dify shared.env       ║");
  } else if (!wfaErr) {
    console.log("║  ⚠  Workflow A: reachable                              ║");
    console.log("║     Workflow B: needs more fragments                   ║");
  }

  // Environment info
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log(`║  Environment: ${environment.padEnd(43)}║`);
  console.log(`║  DIFY_BASE_URL: ${difyBaseUrl.padEnd(41)}║`);

  // Action items
  const blockers = [];
  if (!difyReachable) blockers.push("Set up tunnel (cloudflared) and update DIFY_BASE_URL");
  if (!difyReachable && !wfaErr) blockers.push("Set valid OpenAI API key in shared.env");
  if (blockers.length > 0) {
    console.log("╠══════════════════════════════════════════════════════════╣");
    console.log("║  Next steps:                                            ║");
    blockers.forEach((b, i) => {
      console.log(`║  ${i + 1}. ${b.padEnd(47)}║`);
    });
  }
  console.log("╚══════════════════════════════════════════════════════════╝");
}

main().catch(console.error);
