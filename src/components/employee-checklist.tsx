import { createClient } from "@/lib/supabase/server";
import { EmployeeDocumentRow } from "@/components/employee-document-row";
import type { DocumentStatus } from "@/components/status-badge";
import type { Dictionary } from "@/lib/i18n/en";

const SIGNED_URL_TTL_SECONDS = 600;

export async function EmployeeChecklist({
  branchId,
  employeeId,
  canEdit,
  t,
}: {
  branchId: string;
  employeeId: string;
  canEdit: boolean;
  t: Dictionary;
}) {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("v_employee_document_status")
    .select("*")
    .eq("employee_id", employeeId)
    .order("display_order");

  if (!rows || rows.length === 0) {
    return <p className="text-sm text-muted">No employee found, or you don&apos;t have access to it.</p>;
  }

  const filePaths = rows.filter((r) => r.file_path).map((r) => r.file_path as string);
  const signedUrlByPath = new Map<string, string>();

  if (filePaths.length > 0) {
    const { data: signedUrls } = await supabase.storage
      .from("compliance-documents")
      .createSignedUrls(filePaths, SIGNED_URL_TTL_SECONDS);

    signedUrls?.forEach((s) => {
      if (s.signedUrl && s.path) signedUrlByPath.set(s.path, s.signedUrl);
    });
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
      <div className="grid grid-cols-12 gap-3 border-b border-line bg-cream px-4 py-2 text-xs font-medium text-muted">
        <div className="col-span-3">{t.document}</div>
        <div className="col-span-1">{t.status}</div>
        <div className="col-span-2">{t.dates}</div>
        <div className="col-span-2">{t.file}</div>
        <div className="col-span-2">{t.notes}</div>
        <div className="col-span-1">{t.statusNa}</div>
        <div className="col-span-1" />
      </div>

      {rows.map((row) => (
        <EmployeeDocumentRow
          key={row.employee_document_type_id}
          branchId={branchId}
          employeeId={employeeId}
          employeeDocumentTypeId={row.employee_document_type_id!}
          nameEn={row.employee_document_type_name_en!}
          nameAr={row.employee_document_type_name_ar!}
          status={row.status as DocumentStatus}
          startDate={row.start_date}
          expiryDate={row.expiry_date}
          isNotApplicable={row.is_not_applicable ?? false}
          notes={row.notes}
          existingDocumentId={row.employee_document_id}
          signedUrl={row.file_path ? signedUrlByPath.get(row.file_path) ?? null : null}
          canEdit={canEdit}
          t={t}
        />
      ))}
    </div>
  );
}
