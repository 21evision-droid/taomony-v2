// Keepalive — lightweight ping to prevent Supabase free-tier pause.
// Edge Function invocations count as compute activity.
Deno.serve(() => {
  return new Response(JSON.stringify({ status: "ok", ts: Date.now() }), {
    headers: { "Content-Type": "application/json" },
  });
});
