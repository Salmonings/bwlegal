import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DocumentRow } from "@/components/document-row";
import type { DocumentStatus } from "@/components/status-badge";

const SIGNED_URL_TTL_SECONDS = 600;

export async function BranchChecklist({
  branchId,
  canEdit,
}: {
  branchId: string;
  canEdit: boolean;
}) {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("v_branch_document_status")
    .select("*")
    .eq("branch_id", branchId)
    .order("display_order");

  if (!rows || rows.length === 0) {
    return <p className="text-sm text-gray-500">No branch found, or you don&apos;t have access to it.</p>;
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
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-12 gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500">
          <div className="col-span-3">Document</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-2">Dates</div>
          <div className="col-span-2">File</div>
          <div className="col-span-2">Notes</div>
          <div className="col-span-1">N/A</div>
          <div className="col-span-1" />
        </div>

        {rows.map((row) => (
          <DocumentRow
            key={row.document_type_id}
            branchId={branchId}
            documentTypeId={row.document_type_id!}
            nameEn={row.document_type_name_en!}
            nameAr={row.document_type_name_ar!}
            status={row.status as DocumentStatus}
            startDate={row.start_date}
            expiryDate={row.expiry_date}
            isNotApplicable={row.is_not_applicable ?? false}
            notes={row.notes}
            existingDocumentId={row.document_id}
            signedUrl={row.file_path ? signedUrlByPath.get(row.file_path) ?? null : null}
            canEdit={canEdit}
          />
        ))}
      </div>

      <Link
        href={`/branches/${branchId}/employees`}
        className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm hover:bg-gray-50"
      >
        <span className="text-sm font-medium text-gray-900">Employee Documents</span>
        <span className="text-sm text-gray-400">&rarr;</span>
      </Link>
    </div>
  );
}
