"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { t } from "@/lib/i18n";

function canEditBranch(
  profile: { role: string; branch_id: string | null },
  branchId: string
) {
  return profile.role === "legal_admin" || profile.branch_id === branchId;
}

export async function createEmployeeAction(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) return { error: t.errorNotSignedIn };

  const branchId = String(formData.get("branchId"));
  const fullName = (formData.get("fullName") as string)?.trim();
  const title = (formData.get("title") as string)?.trim() || null;

  if (!canEditBranch(profile, branchId)) {
    return { error: t.errorNoBranchAccess };
  }
  if (!fullName) return { error: t.errorNameRequired };

  const supabase = await createClient();
  const { data: inserted, error } = await supabase
    .from("employees")
    .insert({ branch_id: branchId, full_name: fullName, title })
    .select("id")
    .single();

  if (error) {
      console.error(error);
      return { error: t.errorGeneric };
    }

  await logAudit(supabase, profile.id, {
    action: "employee.create",
    entityType: "employee",
    entityId: inserted.id,
    metadata: { branch_id: branchId },
  });

  revalidatePath(`/branches/${branchId}/employees`);
  return { error: null };
}

export async function updateEmployeeAction(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) return { error: t.errorNotSignedIn };

  const branchId = String(formData.get("branchId"));
  const employeeId = String(formData.get("employeeId"));
  const fullName = (formData.get("fullName") as string)?.trim();
  const title = (formData.get("title") as string)?.trim() || null;

  if (!canEditBranch(profile, branchId)) {
    return { error: t.errorNoBranchAccess };
  }
  if (!fullName) return { error: t.errorNameRequired };

  const supabase = await createClient();
  const { error } = await supabase
    .from("employees")
    .update({ full_name: fullName, title })
    .eq("id", employeeId);

  if (error) {
      console.error(error);
      return { error: t.errorGeneric };
    }

  await logAudit(supabase, profile.id, {
    action: "employee.update",
    entityType: "employee",
    entityId: employeeId,
    metadata: { branch_id: branchId },
  });

  revalidatePath(`/branches/${branchId}/employees`);
  revalidatePath(`/branches/${branchId}/employees/${employeeId}`);
  return { error: null };
}

export async function setEmployeeActiveAction(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) return { error: t.errorNotSignedIn };

  const branchId = String(formData.get("branchId"));
  const employeeId = String(formData.get("employeeId"));
  const isActive = formData.get("isActive") === "true";

  if (!canEditBranch(profile, branchId)) {
    return { error: t.errorNoBranchAccess };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("employees")
    .update({ is_active: isActive })
    .eq("id", employeeId);

  if (error) {
      console.error(error);
      return { error: t.errorGeneric };
    }

  await logAudit(supabase, profile.id, {
    action: isActive ? "employee.reactivate" : "employee.deactivate",
    entityType: "employee",
    entityId: employeeId,
    metadata: { branch_id: branchId },
  });

  revalidatePath(`/branches/${branchId}/employees`);
  return { error: null };
}
