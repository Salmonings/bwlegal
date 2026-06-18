"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

function parseFields(formData: FormData) {
  return {
    nameEn: (formData.get("nameEn") as string)?.trim(),
    nameAr: (formData.get("nameAr") as string)?.trim(),
    displayOrder: Number(formData.get("displayOrder") ?? 0),
    defaultLeadTimeDays: Number(formData.get("defaultLeadTimeDays") ?? 30),
  };
}

export async function createEmployeeDocumentTypeAction(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "legal_admin") return { error: "Not authorized." };

  const { nameEn, nameAr, displayOrder, defaultLeadTimeDays } = parseFields(formData);
  if (!nameEn || !nameAr) return { error: "English and Arabic names are required." };

  const supabase = await createClient();
  const { data: inserted, error } = await supabase
    .from("employee_document_types")
    .insert({
      name_en: nameEn,
      name_ar: nameAr,
      display_order: displayOrder,
      default_lead_time_days: defaultLeadTimeDays,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await logAudit(supabase, profile.id, {
    action: "employee_document_type.create",
    entityType: "employee_document_type",
    entityId: inserted.id,
    metadata: { name_en: nameEn },
  });

  revalidatePath("/settings");
  return { error: null };
}

export async function updateEmployeeDocumentTypeAction(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "legal_admin") return { error: "Not authorized." };

  const id = String(formData.get("id"));
  const { nameEn, nameAr, displayOrder, defaultLeadTimeDays } = parseFields(formData);
  if (!nameEn || !nameAr) return { error: "English and Arabic names are required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("employee_document_types")
    .update({
      name_en: nameEn,
      name_ar: nameAr,
      display_order: displayOrder,
      default_lead_time_days: defaultLeadTimeDays,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await logAudit(supabase, profile.id, {
    action: "employee_document_type.update",
    entityType: "employee_document_type",
    entityId: id,
    metadata: { name_en: nameEn },
  });

  revalidatePath("/settings");
  return { error: null };
}

export async function setEmployeeDocumentTypeActiveAction(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "legal_admin") return { error: "Not authorized." };

  const id = String(formData.get("id"));
  const isActive = formData.get("isActive") === "true";

  const supabase = await createClient();
  const { error } = await supabase
    .from("employee_document_types")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) return { error: error.message };

  await logAudit(supabase, profile.id, {
    action: isActive ? "employee_document_type.activate" : "employee_document_type.deactivate",
    entityType: "employee_document_type",
    entityId: id,
    metadata: {},
  });

  revalidatePath("/settings");
  return { error: null };
}
