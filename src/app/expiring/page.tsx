import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";
import { StatusBadge, type DocumentStatus } from "@/components/status-badge";
import { daysFromToday } from "@/lib/dates";
import { t, ARROW_BACK } from "@/lib/i18n";

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
    supabase.from("document_types").select("id, name_ar").order("display_order"),
    supabase.from("employee_document_types").select("id, name_ar").order("display_order"),
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
        typeLabel: r.document_type_name_ar!,
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
        typeLabel: `${r.employee_document_type_name_ar} — ${r.employee_full_name}`,
        status: r.status as DocumentStatus,
        expiryDate: r.expiry_date!,
        href: `/branches/${r.branch_id}/employees/${r.employee_id}`,
      }))
    );
  }

  rows.sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));

  return (
    <div className="min-h-screen bg-cream">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-white px-4 py-4 sm:px-6">
        <div>
          <Link href="/" className="text-xs text-muted hover:text-orange">
            {ARROW_BACK} {t.dashboard}
          </Link>
          <h1 className="text-lg font-bold text-ink">{t.expiringExpiredTitle}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <LogoutButton label={t.logout} />
        </div>
      </header>

      <main className="flex flex-col gap-4 p-4 sm:p-6">
        <form className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted">{t.branch}</label>
            <select
              name="branchId"
              defaultValue={branchId ?? ""}
              className="rounded-lg border border-line px-2 py-1 text-sm"
            >
              <option value="">{t.allBranches}</option>
              {branches?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted">{t.documentType}</label>
            <select
              name="documentType"
              defaultValue={documentType ?? ""}
              className="rounded-lg border border-line px-2 py-1 text-sm"
            >
              <option value="">{t.allDocumentTypes}</option>
              <optgroup label={t.companyDocuments}>
                {documentTypes?.map((dt) => (
                  <option key={dt.id} value={`company:${dt.id}`}>
                    {dt.name_ar}
                  </option>
                ))}
              </optgroup>
              <optgroup label={t.employeeDocumentsGroup}>
                {employeeDocumentTypes?.map((dt) => (
                  <option key={dt.id} value={`employee:${dt.id}`}>
                    {dt.name_ar}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted">{t.status}</label>
            <select
              name="status"
              defaultValue={status ?? ""}
              className="rounded-lg border border-line px-2 py-1 text-sm"
            >
              <option value="">{t.expiringPlusExpired}</option>
              <option value="expiring_soon">{t.statusExpiringSoon}</option>
              <option value="expired">{t.statusExpired}</option>
            </select>
          </div>

          <button
            type="submit"
            className="rounded-full bg-ink px-3 py-1.5 text-sm font-medium text-white transition hover:bg-orange"
          >
            {t.filter}
          </button>
          {(branchId || documentType || status) && (
            <Link href="/expiring" className="text-sm text-muted hover:underline">
              {t.clear}
            </Link>
          )}
        </form>

        <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line bg-cream text-xs font-medium text-muted">
                <th className="px-4 py-2 text-start">{t.branch}</th>
                <th className="px-4 py-2 text-start">{t.documentType}</th>
                <th className="px-4 py-2 text-start">{t.status}</th>
                <th className="px-4 py-2 text-start">{t.expiryDate}</th>
                <th className="px-4 py-2 text-start">{t.days}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const days = daysFromToday(row.expiryDate);
                const daysLabel =
                  days < 0 ? `منتهية منذ ${Math.abs(days)} يوم` : `${days} يوم متبقٍ`;
                return (
                  <tr key={row.key} className="border-b border-line last:border-b-0 hover:bg-cream">
                    <td className="px-4 py-2">
                      <Link href={`/branches/${row.branchId}`} className="font-medium text-ink hover:text-orange">
                        {row.branchName}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-ink">
                      <Link href={row.href} className="hover:text-orange hover:underline">
                        {row.typeLabel}
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge status={row.status} t={t} />
                    </td>
                    <td className="px-4 py-2 text-ink">{row.expiryDate}</td>
                    <td className={`px-4 py-2 font-medium ${days < 0 ? "text-red-600" : "text-amber-600"}`}>
                      {daysLabel}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted">
                    {t.noResults}
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
