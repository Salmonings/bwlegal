"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { t } from "@/lib/i18n";

function parseFields(formData: FormData) {
  return {
    nameAr: (formData.get("nameAr") as string)?.trim(),
    displayOrder: Number(formData.get("displayOrder") ?? 0),
    defaultLeadTimeDays: Number(formData.get("defaultLeadTimeDays") ?? 30),
  };
}

export async function createDocumentTypeAction(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "legal_admin") return { error: t.errorNotAuthorized };

  const { nameAr, displayOrder, defaultLeadTimeDays } = parseFields(formData);
  if (!nameAr) return { error: t.errorDocumentNameRequired };

  const supabase = await createClient();
  const { data: inserted, error } = await supabase
    .from("document_types")
    .insert({
      name_ar: nameAr,
      display_order: displayOrder,
      default_lead_time_days: defaultLeadTimeDays,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await logAudit(supabase, profile.id, {
    action: "document_type.create",
    entityType: "document_type",
    entityId: inserted.id,
    metadata: { name_ar: nameAr },
  });

  revalidatePath("/settings");
  return { error: null };
}

export async function updateDocumentTypeAction(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "legal_admin") return { error: t.errorNotAuthorized };

  const id = String(formData.get("id"));
  const { nameAr, displayOrder, defaultLeadTimeDays } = parseFields(formData);
  if (!nameAr) return { error: t.errorDocumentNameRequired };

  const supabase = await createClient();
  const { error } = await supabase
    .from("document_types")
    .update({
      name_ar: nameAr,
      display_order: displayOrder,
      default_lead_time_days: defaultLeadTimeDays,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await logAudit(supabase, profile.id, {
    action: "document_type.update",
    entityType: "document_type",
    entityId: id,
    metadata: { name_ar: nameAr },
  });

  revalidatePath("/settings");
  return { error: null };
}

export async function setDocumentTypeActiveAction(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "legal_admin") return { error: t.errorNotAuthorized };

  const id = String(formData.get("id"));
  const isActive = formData.get("isActive") === "true";

  const supabase = await createClient();
  const { error } = await supabase.from("document_types").update({ is_active: isActive }).eq("id", id);

  if (error) return { error: error.message };

  await logAudit(supabase, profile.id, {
    action: isActive ? "document_type.activate" : "document_type.deactivate",
    entityType: "document_type",
    entityId: id,
    metadata: {},
  });

  revalidatePath("/settings");
  return { error: null };
}
