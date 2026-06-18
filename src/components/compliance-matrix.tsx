import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { STATUS_DOT_COLOR, statusLabel, type DocumentStatus } from "@/components/status-badge";
import type { Dictionary } from "@/lib/i18n";

export async function ComplianceMatrix({ t }: { t: Dictionary }) {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("v_branch_document_status")
    .select("*")
    .order("display_order");

  if (!rows || rows.length === 0) {
    return <p className="text-sm text-muted">{t.noDataYet}</p>;
  }

  const docTypes = new Map<string, { name: string; displayOrder: number }>();
  const branches = new Map<
    string,
    { name: string; cells: Map<string, DocumentStatus>; expired: number; expiringSoon: number }
  >();

  let totalExpired = 0;
  let totalExpiringSoon = 0;

  for (const row of rows) {
    const docTypeId = row.document_type_id!;
    const branchId = row.branch_id!;
    const status = row.status as DocumentStatus;

    if (!docTypes.has(docTypeId)) {
      docTypes.set(docTypeId, {
        name: row.document_type_name_ar!,
        displayOrder: row.display_order ?? 0,
      });
    }

    if (!branches.has(branchId)) {
      branches.set(branchId, {
        name: row.branch_name!,
        cells: new Map(),
        expired: 0,
        expiringSoon: 0,
      });
    }

    const branch = branches.get(branchId)!;
    branch.cells.set(docTypeId, status);
    if (status === "expired") {
      branch.expired += 1;
      totalExpired += 1;
    } else if (status === "expiring_soon") {
      branch.expiringSoon += 1;
      totalExpiringSoon += 1;
    }
  }

  const sortedDocTypes = [...docTypes.entries()].sort((a, b) => a[1].displayOrder - b[1].displayOrder);
  const sortedBranches = [...branches.entries()].sort((a, b) => a[1].name.localeCompare(b[1].name));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <SummaryStat label={t.expired} count={totalExpired} colorClass="text-red-700" />
        <SummaryStat label={t.expiringSoon} count={totalExpiringSoon} colorClass="text-amber-700" />
        <Link href="/expiring" className="ms-auto text-sm font-medium text-orange hover:underline">
          {t.viewExpiringExpired} &rarr;
        </Link>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {sortedDocTypes.map(([id, dt], i) => (
          <span key={id}>
            {i + 1}. {dt.name}
          </span>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-cream text-xs font-medium text-muted">
              <th className="px-4 py-2 text-start">{t.branch}</th>
              {sortedDocTypes.map(([id], i) => (
                <th key={id} className="w-10 px-1 py-2 text-center" title={docTypes.get(id)!.name}>
                  {i + 1}
                </th>
              ))}
              <th className="px-3 py-2 text-end">{t.issues}</th>
            </tr>
          </thead>
          <tbody>
            {sortedBranches.map(([branchId, branch]) => {
              const issues = branch.expired + branch.expiringSoon;
              return (
                <tr key={branchId} className="border-b border-line last:border-b-0 hover:bg-cream">
                  <td className="px-4 py-2">
                    <Link href={`/branches/${branchId}`} className="font-medium text-ink hover:text-orange">
                      {branch.name}
                    </Link>
                  </td>
                  {sortedDocTypes.map(([docTypeId, dt]) => {
                    const status = branch.cells.get(docTypeId) ?? "missing";
                    return (
                      <td key={docTypeId} className="px-1 py-2 text-center">
                        <Link
                          href={`/branches/${branchId}`}
                          title={`${dt.name}: ${statusLabel(t, status)}`}
                          className={`mx-auto block h-4 w-4 rounded ${STATUS_DOT_COLOR[status]}`}
                        />
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-end">
                    {issues > 0 ? (
                      <span className="font-medium text-red-600">{issues}</span>
                    ) : (
                      <span className="text-muted">0</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  count,
  colorClass,
}: {
  label: string;
  count: number;
  colorClass: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white px-4 py-2 shadow-sm">
      <p className={`text-2xl font-bold ${colorClass}`}>{count}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
