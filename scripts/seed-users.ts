// Dev convenience: creates a legal_admin and one branch_manager test account
// against the local Supabase instance. Run with `npm run seed:users`.
import { config } from "dotenv";
import { createAdminClient } from "../src/lib/supabase/admin";

config({ path: ".env.local" });

const DEV_PASSWORD = "Password123!";

async function main() {
  const supabase = createAdminClient();

  const { data: zayed, error: branchError } = await supabase
    .from("branches")
    .select("id, name")
    .eq("name", "Zayed")
    .single();

  if (branchError || !zayed) {
    throw new Error(`Could not find seeded "Zayed" branch — run supabase db reset first. ${branchError?.message ?? ""}`);
  }

  const usersToCreate = [
    {
      email: "admin@bwlegal.local",
      full_name: "Legal Admin",
      role: "legal_admin" as const,
      branch_id: null as string | null,
    },
    {
      email: "manager.zayed@bwlegal.local",
      full_name: "Zayed Branch Manager",
      role: "branch_manager" as const,
      branch_id: zayed.id,
    },
  ];

  for (const u of usersToCreate) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: DEV_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: u.full_name,
        role: u.role,
        branch_id: u.branch_id,
      },
    });

    if (error) {
      if (error.message.includes("already been registered")) {
        console.log(`skip (already exists): ${u.email}`);
        continue;
      }
      throw error;
    }

    console.log(`created: ${u.email} (${u.role}) -> user id ${data.user?.id}`);
  }

  console.log(`\nDev password for all seeded users: ${DEV_PASSWORD}`);
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
