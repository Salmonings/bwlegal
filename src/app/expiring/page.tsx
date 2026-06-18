import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";
import { StatusBadge, type DocumentStatus } from "@/components/status-badge";
import { daysFromToday } from "@/lib/dates";

type Scope = "company" | "employee";

type Row = {
  key: string;
  branchId: string;
  branchName: string;
  typeLabel: string;
  status: DocumentStatus;
  expiryDate: string;
  href: string;
};

export default async function ExpiringPage({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string; documentType?: string; status?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "legal_admin") redirect("/");

  const { branchId, documentType, status } = await searchParams;
  const supabase = await createClient();

  const [scope, documentTypeId] = documentType?.includes(":")
    ? (documentType.split(":") as [Scope, string])
    : [undefined, undefined];

  const [{ data: branches }, { data: documentTypes }, { data: employeeDocumentTypes }] = await Promise.all([
    supabase.from("branches").select("id, name").order("name"),
    supabase.from("document_types").select("id, name_en").order("display_order"),
    supabase.from("employee_document_types").select("id, name_en").order("display_order"),
  ]);

  const branchNameById = new Map((branches ?? []).map((b) => [b.id, b.name]));

  const statusFilter: DocumentStatus[] =
    status === "expired" || status === "expiring_soon" ? [status] : ["expired", "expiring_soon"];

  const rows: Row[] = [];

  if (!scope || scope === "company") {
    let q = supabase
      .from("v_branch_document_status")
      .select("*")
      .in("status", statusFilter)
      .not("expiry_date", "is", null);
    if (branchId) q = q.eq("branch_id", branchId);
    if (scope === "company" && documentTypeId) q = q.eq("document_type_id", documentTypeId);
    const { data } = await q;
    rows.push(
      ...(data ?? []).map((r) => ({
        key: `document-${r.document_id}`,
        branchId: r.branch_id!,
        branchName: r.branch_name!,
        typeLabel: r.document_type_name_en!,
        status: r.status as DocumentStatus,
        expiryDate: r.expiry_date!,
        href: `/branches/${r.branch_id}`,
      }))
    );
  }

  if (!scope || scope === "employee") {
    let q = supabase
      .from("v_employee_document_status")
      .select("*")
      .in("status", statusFilter)
      .not("expiry_date", "is", null);
    if (branchId) q = q.eq("branch_id", branchId);
    if (scope === "employee" && documentTypeId) q = q.eq("employee_document_type_id", documentTypeId);
    const { data } = await q;
    rows.push(
      ...(data ?? []).map((r) => ({
        key: `employee_document-${r.employee_document_id}`,
        branchId: r.branch_id!,
        branchName: branchNameById.get(r.branch_id!) ?? "—",
        typeLabel: `${r.employee_document_type_name_en} — ${r.employee_full_name}`,
        status: r.status as DocumentStatus,
        expiryDate: r.expiry_date!,
        href: `/branches/${r.branch_id}/employees/${r.employee_id}`,
      }))
    );
  }

  rows.sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <div>
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">
            &larr; Dashboard
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">Expiring &amp; Expired Documents</h1>
        </div>
        <LogoutButton />
      </header>

      <main className="flex flex-col gap-4 p-6">
        <form className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Branch</label>
            <select
              name="branchId"
              defaultValue={branchId ?? ""}
              className="rounded border border-gray-300 px-2 py-1 text-sm"
            >
              <option value="">All branches</option>
              {branches?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Document type</label>
            <select
              name="documentType"
              defaultValue={documentType ?? ""}
              className="rounded border border-gray-300 px-2 py-1 text-sm"
            >
              <option value="">All document types</option>
              <optgroup label="Company documents">
                {documentTypes?.map((dt) => (
                  <option key={dt.id} value={`company:${dt.id}`}>
                    {dt.name_en}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Employee documents">
                {employeeDocumentTypes?.map((dt) => (
                  <option key={dt.id} value={`employee:${dt.id}`}>
                    {dt.name_en}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Status</label>
            <select
              name="status"
              defaultValue={status ?? ""}
              className="rounded border border-gray-300 px-2 py-1 text-sm"
            >
              <option value="">Expiring soon + Expired</option>
              <option value="expiring_soon">Expiring soon</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <button type="submit" className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white">
            Filter
          </button>
          {(branchId || documentType || status) && (
            <Link href="/expiring" className="text-sm text-gray-500 hover:underline">
              Clear
            </Link>
          )}
        </form>

        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-500">
                <th className="px-4 py-2 text-left">Branch</th>
                <th className="px-4 py-2 text-left">Document Type</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Expiry Date</th>
                <th className="px-4 py-2 text-left">Days</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const days = daysFromToday(row.expiryDate);
                return (
                  <tr key={row.key} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <Link href={`/branches/${row.branchId}`} className="font-medium text-gray-900 hover:underline">
                        {row.branchName}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-gray-700">
                      <Link href={row.href} className="hover:underline">
                        {row.typeLabel}
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-2 text-gray-700">{row.expiryDate}</td>
                    <td className={`px-4 py-2 font-medium ${days < 0 ? "text-red-600" : "text-amber-600"}`}>
                      {days < 0 ? `Expired ${Math.abs(days)}d ago` : `${days}d left`}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                    Nothing expiring or expired matches these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
