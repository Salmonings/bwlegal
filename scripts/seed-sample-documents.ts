// Dev convenience: populates a handful of branches with sample company
// documents across all statuses (valid/expiring soon/expired/N-A/missing)
// so the compliance matrix and /expiring view have something to show.
// Run with `npm run seed:documents` after `npm run seed:users`.
import { config } from "dotenv";
import { createAdminClient } from "../src/lib/supabase/admin";

config({ path: ".env.local" });

function isoDate(daysFromToday: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const supabase = createAdminClient();

  const { data: admin } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "legal_admin")
    .limit(1)
    .single();

  if (!admin) throw new Error("No legal_admin profile found — run `npm run seed:users` first.");

  const { data: branches } = await supabase.from("branches").select("id, name").order("name");
  const { data: docTypes } = await supabase
    .from("document_types")
    .select("id, default_lead_time_days")
    .order("display_order");

  if (!branches?.length || !docTypes?.length) {
    throw new Error("Branches/document types not seeded — run `npx supabase db reset` first.");
  }

  // Cycle through a fixed pattern of statuses across the first 5 branches so
  // the matrix shows a realistic mix; the rest stay empty ("missing").
  const pattern: Array<{ start: number; expiry: number | null; na: boolean }> = [
    { start: -400, expiry: 365, na: false }, // valid
    { start: -400, expiry: 10, na: false }, // expiring soon
    { start: -400, expiry: -5, na: false }, // expired
    { start: null as unknown as number, expiry: null, na: true }, // n/a
  ];

  const sampleBranches = branches.slice(0, 5);
  let inserted = 0;

  for (const [bIdx, branch] of sampleBranches.entries()) {
    for (const [dIdx, docType] of docTypes.entries()) {
      const slot = pattern[(bIdx + dIdx) % pattern.length];
      if (slot.na) {
        await supabase.from("documents").insert({
          branch_id: branch.id,
          document_type_id: docType.id,
          is_not_applicable: true,
          uploaded_by: admin.id,
        });
      } else if ((bIdx + dIdx) % 5 !== 4) {
        // leave ~1 in 5 combos empty so "missing" shows up too
        await supabase.from("documents").insert({
          branch_id: branch.id,
          document_type_id: docType.id,
          start_date: isoDate(slot.start),
          expiry_date: isoDate(slot.expiry!),
          is_not_applicable: false,
          uploaded_by: admin.id,
        });
      } else {
        continue;
      }
      inserted += 1;
    }
  }

  console.log(`Inserted ${inserted} sample documents across ${sampleBranches.length} branches.`);
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
