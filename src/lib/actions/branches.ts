"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { t } from "@/lib/i18n";

export async function createBranchAction(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "legal_admin") return { error: t.errorNotAuthorized };

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: t.errorNameRequired };

  const supabase = await createClient();
  const { data: inserted, error } = await supabase
    .from("branches")
    .insert({ name })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await logAudit(supabase, profile.id, {
    action: "branch.create",
    entityType: "branch",
    entityId: inserted.id,
    metadata: { name },
  });

  revalidatePath("/settings");
  return { error: null };
}

export async function renameBranchAction(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "legal_admin") return { error: t.errorNotAuthorized };

  const branchId = String(formData.get("branchId"));
  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: t.errorNameRequired };

  const supabase = await createClient();
  const { error } = await supabase.from("branches").update({ name }).eq("id", branchId);

  if (error) return { error: error.message };

  await logAudit(supabase, profile.id, {
    action: "branch.update",
    entityType: "branch",
    entityId: branchId,
    metadata: { name },
  });

  revalidatePath("/settings");
  return { error: null };
}
