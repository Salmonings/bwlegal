"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { t } from "@/lib/i18n";

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];

function canEditBranch(
  profile: { role: string; branch_id: string | null },
  branchId: string
) {
  return profile.role === "legal_admin" || profile.branch_id === branchId;
}

export async function saveDocumentAction(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) return { error: t.errorNotSignedIn };

  const branchId = String(formData.get("branchId"));
  const documentTypeId = String(formData.get("documentTypeId"));
  const existingDocumentId = formData.get("existingDocumentId")
    ? String(formData.get("existingDocumentId"))
    : null;

  if (!canEditBranch(profile, branchId)) {
    return { error: t.errorNoBranchAccess };
  }

  const startDate = (formData.get("startDate") as string) || null;
  const expiryDate = (formData.get("expiryDate") as string) || null;
  const isNotApplicable = formData.get("isNotApplicable") === "on";
  const notes = (formData.get("notes") as string) || null;
  const file = formData.get("file") as File | null;

  const supabase = await createClient();

  let filePath: string | null = null;

  if (file && file.size > 0) {
    if (file.size > MAX_FILE_SIZE) {
      return { error: t.errorFileTooLarge };
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return { error: t.errorInvalidFileType };
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
    const path = `branch_${branchId}/documents/${documentTypeId}/${Date.now()}_${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("compliance-documents")
      .upload(path, file, { contentType: file.type });

    if (uploadError) {
      console.error(uploadError);
      return { error: t.errorUploadFailed };
    }

    filePath = path;
  }

  // A new file means a renewal — preserve history by always inserting a new
  // row. Editing notes/dates/N-A on an unchanged file updates that row in place.
  if (filePath) {
    const { data: inserted, error } = await supabase
      .from("documents")
      .insert({
        branch_id: branchId,
        document_type_id: documentTypeId,
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
      action: "document.replace",
      entityType: "document",
      entityId: inserted.id,
      metadata: { branch_id: branchId, document_type_id: documentTypeId },
    });
  } else if (existingDocumentId) {
    const { error } = await supabase
      .from("documents")
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
      action: "document.update",
      entityType: "document",
      entityId: existingDocumentId,
      metadata: { branch_id: branchId, document_type_id: documentTypeId },
    });
  } else {
    const { data: inserted, error } = await supabase
      .from("documents")
      .insert({
        branch_id: branchId,
        document_type_id: documentTypeId,
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
      action: "document.create",
      entityType: "document",
      entityId: inserted.id,
      metadata: { branch_id: branchId, document_type_id: documentTypeId },
    });
  }

  revalidatePath(`/branches/${branchId}`);
  revalidatePath("/");
  return { error: null };
}
