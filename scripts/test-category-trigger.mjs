import { createClient } from "@supabase/supabase-js";

const SRK = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3NnYWVnb3VkY3V0ZG5xeWRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODAzNzU4MiwiZXhwIjoyMDkzNjEzNTgyfQ.iz4bAmGRw5pnilex1dNqEstakhdYLdhpw7I8l6MCMIw";
const admin = createClient("https://jiwsgaegoudcutdnqydf.supabase.co", SRK);

async function main() {
  // Test 1: Insert WITHOUT category_id → trigger fills it
  console.log("=== Test 1: Trigger fills category_id ===");
  const { data: ins, error: insErr } = await admin
    .from("raw_fragments")
    .insert({
      user_id: "96c04d6f-dbdc-4c96-819c-de05b0e3a333",
      content: "Test fragment for category_id trigger validation.",
      channel_id: "b0000000-0000-4000-8000-000000000001", // Tao Te Ching → Learning
      source_type: "fragment",
      status: "completed",
    })
    .select("id, category_id")
    .single();

  if (insErr) {
    console.error("Insert ERROR:", insErr.message);
    return;
  }
  console.log("Inserted:", ins.id.slice(0, 8) + "...");
  console.log("category_id:", ins.category_id ? "FILLED " + ins.category_id : "NULL");
  if (ins.category_id) {
    const { data: cat } = await admin.from("categories").select("name").eq("id", ins.category_id).single();
    console.log("Category name:", cat?.name, "(expect: Learning)");
  }

  // Test 2: Insert WITH explicit category_id → preserved
  console.log("\n=== Test 2: Explicit category_id preserved ===");
  const { data: ins2, error: insErr2 } = await admin
    .from("raw_fragments")
    .insert({
      user_id: "96c04d6f-dbdc-4c96-819c-de05b0e3a333",
      content: "Test fragment with explicit category_id.",
      channel_id: "b0000000-0000-4000-8000-000000000001",
      category_id: "a0000000-0000-4000-8000-000000000002", // Meditate
      source_type: "fragment",
      status: "completed",
    })
    .select("id, category_id")
    .single();

  if (insErr2) {
    console.error("Insert 2 ERROR:", insErr2.message);
    return;
  }
  const { data: cat2 } = await admin.from("categories").select("name").eq("id", ins2.category_id).single();
  console.log("Explicit category:", cat2?.name, "(expect: Meditate)");

  // Cleanup
  await admin.from("raw_fragments").delete().eq("id", ins.id);
  await admin.from("raw_fragments").delete().eq("id", ins2.id);
  console.log("\nCleaned up test fragments.");
}

main().catch(console.error);
