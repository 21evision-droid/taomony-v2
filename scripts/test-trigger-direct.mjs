import { createClient } from "@supabase/supabase-js";

const SRK = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3NnYWVnb3VkY3V0ZG5xeWRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODAzNzU4MiwiZXhwIjoyMDkzNjEzNTgyfQ.iz4bAmGRw5pnilex1dNqEstakhdYLdhpw7I8l6MCMIw";
const admin = createClient("https://jiwsgaegoudcutdnqydf.supabase.co", SRK);

async function main() {
  // Check if trigger exists
  console.log("=== Checking trigger ===");

  // Test: Insert without category_id
  const { data: ins } = await admin
    .from("raw_fragments")
    .insert({
      user_id: "96c04d6f-dbdc-4c96-819c-de05b0e3a333",
      content: "DIRECT TRIGGER TEST at " + Date.now(),
      channel_id: "b0000000-0000-4000-8000-000000000001",
      source_type: "fragment",
      status: "completed",
    })
    .select("id, category_id, channel_id")
    .single();

  if (ins) {
    console.log("Inserted:", ins.id);
    console.log("channel_id:", ins.channel_id);
    console.log("category_id:", ins.category_id || "NULL");

    // Check what category the channel has
    const { data: ch } = await admin
      .from("channels")
      .select("id, category_id, name")
      .eq("id", ins.channel_id)
      .single();
    console.log("Channel:", ch?.name, "→ category_id:", ch?.category_id || "NULL");
  }

  // Clean up
  if (ins) {
    await admin.from("raw_fragments").delete().eq("id", ins.id);
    console.log("Cleaned up.");
  }
}

main().catch(console.error);
