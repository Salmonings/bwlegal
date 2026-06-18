"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { t } from "@/lib/i18n";

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];

export async function saveEmployeeDocumentAction(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) return { error: t.errorNotSignedIn };

  const branchId = String(formData.get("branchId"));
  const employeeId = String(formData.get("employeeId"));
  const employeeDocumentTypeId = String(formData.get("employeeDocumentTypeId"));
  const existingDocumentId = formData.get("existingDocumentId")
    ? String(formData.get("existingDocumentId"))
    : null;

  const supabase = await createClient();

  // RLS already scopes employees to the caller's branch; a row coming back
  // here confirms access without duplicating the branch-ownership check.
  const { data: employee } = await supabase
    .from("employees")
    .select("id, branch_id")
    .eq("id", employeeId)
    .single();

  if (!employee || employee.branch_id !== branchId) {
    return { error: t.errorNoEmployeeAccess };
  }

  const startDate = (formData.get("startDate") as string) || null;
  const expiryDate = (formData.get("expiryDate") as string) || null;
  const isNotApplicable = formData.get("isNotApplicable") === "on";
  const notes = (formData.get("notes") as string) || null;
  const file = formData.get("file") as File | null;

  let filePath: string | null = null;

  if (file && file.size > 0) {
    if (file.size > MAX_FILE_SIZE) {
      return { error: t.errorFileTooLarge };
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return { error: t.errorInvalidFileType };
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
    const path = `branch_${branchId}/employees/${employeeId}/${employeeDocumentTypeId}/${Date.now()}_${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("compliance-documents")
      .upload(path, file, { contentType: file.type });

    if (uploadError) {
      console.error(uploadError);
      return { error: t.errorUploadFailed };
    }

    filePath = path;
  }

  if (filePath) {
    const { data: inserted, error } = await supabase
      .from("employee_documents")
      .insert({
        employee_id: employeeId,
        employee_document_type_id: employeeDocumentTypeId,
        file_path: filePath,
        start_date: startDate,
        expiry_date: expiryDate,
        is_not_applicable: isNotApplicable,
        notes,
        uploaded_by: profile.id,
      })
      .select("id")
      .single();

    if (error) {
      console.error(error);
      return { error: t.errorGeneric };
    }

    await logAudit(supabase, profile.id, {
      action: "employee_document.replace",
      entityType: "employee_document",
      entityId: inserted.id,
      metadata: { branch_id: branchId, employee_id: employeeId, employee_document_type_id: employeeDocumentTypeId },
    });
  } else if (existingDocumentId) {
    const { error } = await supabase
      .from("employee_documents")
      .update({
        start_date: startDate,
        expiry_date: expiryDate,
        is_not_applicable: isNotApplicable,
        notes,
      })
      .eq("id", existingDocumentId);

    if (error) {
      console.error(error);
      return { error: t.errorGeneric };
    }

    await logAudit(supabase, profile.id, {
      action: "employee_document.update",
      entityType: "employee_document",
      entityId: existingDocumentId,
      metadata: { branch_id: branchId, employee_id: employeeId, employee_document_type_id: employeeDocumentTypeId },
    });
  } else {
    const { data: inserted, error } = await supabase
      .from("employee_documents")
      .insert({
        employee_id: employeeId,
        employee_document_type_id: employeeDocumentTypeId,
        start_date: startDate,
        expiry_date: expiryDate,
        is_not_applicable: isNotApplicable,
        notes,
        uploaded_by: profile.id,
      })
      .select("id")
      .single();

    if (error) {
      console.error(error);
      return { error: t.errorGeneric };
    }

    await logAudit(supabase, profile.id, {
      action: "employee_document.create",
      entityType: "employee_document",
      entityId: inserted.id,
      metadata: { branch_id: branchId, employee_id: employeeId, employee_document_type_id: employeeDocumentTypeId },
    });
  }

  revalidatePath(`/branches/${branchId}/employees/${employeeId}`);
  revalidatePath(`/branches/${branchId}/employees`);
  return { error: null };
}
