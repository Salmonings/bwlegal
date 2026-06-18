import { createClient } from "@/lib/supabase/server";

export async function IssueCountBadge({ branchId }: { branchId?: string }) {
  const supabase = await createClient();

  let docQuery = supabase
    .from("v_branch_document_status")
    .select("status", { count: "exact", head: true })
    .in("status", ["expired", "expiring_soon"]);
  let empDocQuery = supabase
    .from("v_employee_document_status")
    .select("status", { count: "exact", head: true })
    .in("status", ["expired", "expiring_soon"]);

  if (branchId) {
    docQuery = docQuery.eq("branch_id", branchId);
    empDocQuery = empDocQuery.eq("branch_id", branchId);
  }

  const [{ count: docCount }, { count: empDocCount }] = await Promise.all([docQuery, empDocQuery]);
  const total = (docCount ?? 0) + (empDocCount ?? 0);

  if (total === 0) return null;

  return (
    <span className="inline-flex items-center justify-center rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
      {total}
    </span>
  );
}
