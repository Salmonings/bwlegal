"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { t } from "@/lib/i18n";

function generateTempPassword() {
  return randomBytes(9).toString("base64").replace(/[+/=]/g, "x");
}

export async function createUserAction(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "legal_admin") return { error: t.errorNotAuthorized, tempPassword: null };

  const email = (formData.get("email") as string)?.trim();
  const fullName = (formData.get("fullName") as string)?.trim();
  const role = formData.get("role") as string;
  const branchId = (formData.get("branchId") as string) || null;

  if (!email || !fullName) return { error: t.errorEmailNameRequired, tempPassword: null };
  if (role !== "legal_admin" && role !== "branch_manager") {
    return { error: t.errorInvalidRole, tempPassword: null };
  }
  if (role === "branch_manager" && !branchId) {
    return { error: t.errorBranchRequiredForManager, tempPassword: null };
  }

  const admin = createAdminClient();
  const tempPassword = generateTempPassword();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role,
      branch_id: role === "branch_manager" ? branchId : null,
    },
  });

  if (error) {
    console.error(error);
    if (error.message.includes("already been registered")) {
      return { error: t.errorEmailAlreadyRegistered, tempPassword: null };
    }
    return { error: t.errorGeneric, tempPassword: null };
  }

  const supabase = await createClient();
  await logAudit(supabase, profile.id, {
    action: "user.create",
    entityType: "profile",
    entityId: data.user!.id,
    metadata: { email, role },
  });

  revalidatePath("/settings");
  return { error: null, tempPassword };
}

export async function updateUserAction(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "legal_admin") return { error: t.errorNotAuthorized };

  const id = String(formData.get("id"));
  const fullName = (formData.get("fullName") as string)?.trim();
  const role = formData.get("role") as string;
  const branchId = (formData.get("branchId") as string) || null;

  if (!fullName) return { error: t.errorNameRequired };
  if (role !== "legal_admin" && role !== "branch_manager") return { error: t.errorInvalidRole };
  if (role === "branch_manager" && !branchId) {
    return { error: t.errorBranchRequiredForManager };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      role,
      branch_id: role === "branch_manager" ? branchId : null,
    })
    .eq("id", id);

  if (error) {
    console.error(error);
    return { error: t.errorGeneric };
  }

  await logAudit(supabase, profile.id, {
    action: "user.update",
    entityType: "profile",
    entityId: id,
    metadata: { role },
  });

  revalidatePath("/settings");
  return { error: null };
}

export async function removeUserAction(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "legal_admin") return { error: t.errorNotAuthorized };

  const id = String(formData.get("id"));
  if (id === profile.id) return { error: t.errorCannotRemoveOwnAccount };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) {
    console.error(error);
    return { error: t.errorGeneric };
  }

  const supabase = await createClient();
  await logAudit(supabase, profile.id, {
    action: "user.remove",
    entityType: "profile",
    entityId: id,
    metadata: {},
  });

  revalidatePath("/settings");
  return { error: null };
}
