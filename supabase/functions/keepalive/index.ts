// Keepalive — prevents Supabase free-tier pause.
// Every invocation writes a verifiable heartbeat row to raw_fragments,
// so activity is trackable and any scheduler (GitHub Actions, cron-job.org,
// curl) can trigger it. verify_jwt=false so even an unauthenticated GET works;
// the function uses the service role key from its own environment.
Deno.serve(async () => {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  let written = false;
  try {
    const res = await fetch(`${url}/rest/v1/raw_fragments`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        user_id: "96c04d6f-dbdc-4c96-819c-de05b0e3a333",
        content: `keepalive-fn-${Date.now()}`,
        channel_id: "b0000000-0000-4000-8000-000000000005",
        source_type: "fragment",
        status: "pending",
      }),
    });
    written = res.ok;
  } catch (_e) {
    written = false;
  }

  return new Response(
    JSON.stringify({ status: "ok", ts: Date.now(), db_write: written }),
    { headers: { "Content-Type": "application/json" } },
  );
});
