import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

/**
 * POST /functions/v1/submit-fragment
 *
 * Validates session, inserts a pending fragment, returns fragment_id.
 *
 * Request body:
 *   content: string
 *   channel_id: string (UUID)
 *   source_type?: "fragment" | "short_article" | "long_article" | "image" | "youtube_link"
 *
 * Response:
 *   success: true
 *   fragment_id: string (UUID)
 */
export default {
  fetch: withSupabase({ auth: ["publishable", "secret"] }, async (req, ctx) => {
    // ── 1. Only accept POST ──
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ── 2. Extract authenticated user ──
    const userId = ctx.user?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ── 3. Parse and validate payload ──
    let body: {
      content?: string;
      channel_id?: string;
      source_type?: string;
    };

    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { content, channel_id, source_type } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return new Response(JSON.stringify({ error: "content is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!channel_id || typeof channel_id !== "string") {
      return new Response(JSON.stringify({ error: "channel_id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate source_type if provided
    const VALID_SOURCE_TYPES = [
      "fragment",
      "short_article",
      "long_article",
      "image",
      "youtube_link",
    ];
    const resolvedSourceType = source_type && VALID_SOURCE_TYPES.includes(source_type)
      ? source_type
      : "fragment";

    // ── 4. Resolve category_id from channel_id ──
    let categoryId: string | null = null;
    const { data: channel } = await ctx.supabaseAdmin
      .from("channels")
      .select("category_id")
      .eq("id", channel_id)
      .single();
    if (channel?.category_id) {
      categoryId = channel.category_id;
    }

    // ── 5. Insert fragment with category_id ──
    const { data, error } = await ctx.supabaseAdmin
      .from("raw_fragments")
      .insert({
        user_id: userId,
        content: content.trim(),
        channel_id,
        category_id: categoryId,
        source_type: resolvedSourceType,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) {
      console.error("[submit-fragment] Insert error:", error.message);
      return new Response(
        JSON.stringify({ error: "Failed to create fragment" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // ── 6. Return fragment_id ──
    return new Response(
      JSON.stringify({ success: true, fragment_id: data.id }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }),
};
