import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";
import { StatusBadge, type DocumentStatus } from "@/components/status-badge";

function daysFromToday(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function ExpiringPage({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string; documentTypeId?: string; status?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "legal_admin") redirect("/");

  const { branchId, documentTypeId, status } = await searchParams;
  const supabase = await createClient();

  const [{ data: branches }, { data: documentTypes }] = await Promise.all([
    supabase.from("branches").select("id, name").order("name"),
    supabase.from("document_types").select("id, name_en").order("display_order"),
  ]);

  let query = supabase
    .from("v_branch_document_status")
    .select("*")
    .order("expiry_date", { ascending: true });

  query = status === "expired" || status === "expiring_soon"
    ? query.eq("status", status)
    : query.in("status", ["expired", "expiring_soon"]);

  if (branchId) query = query.eq("branch_id", branchId);
  if (documentTypeId) query = query.eq("document_type_id", documentTypeId);

  const { data: rows } = await query;

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
              name="documentTypeId"
              defaultValue={documentTypeId ?? ""}
              className="rounded border border-gray-300 px-2 py-1 text-sm"
            >
              <option value="">All document types</option>
              {documentTypes?.map((dt) => (
                <option key={dt.id} value={dt.id}>
                  {dt.name_en}
                </option>
              ))}
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

          <button
            type="submit"
            className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white"
          >
            Filter
          </button>
          {(branchId || documentTypeId || status) && (
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
              {rows?.map((row) => {
                const days = daysFromToday(row.expiry_date!);
                return (
                  <tr
                    key={`${row.branch_id}-${row.document_type_id}`}
                    className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                  >
                    <td className="px-4 py-2">
                      <Link href={`/branches/${row.branch_id}`} className="font-medium text-gray-900 hover:underline">
                        {row.branch_name}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-gray-700">{row.document_type_name_en}</td>
                    <td className="px-4 py-2">
                      <StatusBadge status={row.status as DocumentStatus} />
                    </td>
                    <td className="px-4 py-2 text-gray-700">{row.expiry_date}</td>
                    <td className={`px-4 py-2 font-medium ${days < 0 ? "text-red-600" : "text-amber-600"}`}>
                      {days < 0 ? `Expired ${Math.abs(days)}d ago` : `${days}d left`}
                    </td>
                  </tr>
                );
              })}
              {(!rows || rows.length === 0) && (
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
