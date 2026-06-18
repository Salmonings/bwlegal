import { createClient } from "@/lib/supabase/server";
import { AddEmployeeForm } from "@/components/add-employee-form";
import { EmployeeRow } from "@/components/employee-row";
import type { DocumentStatus } from "@/components/status-badge";
import type { Dictionary } from "@/lib/i18n";

function worstStatus(statuses: DocumentStatus[]): DocumentStatus {
  if (statuses.some((s) => s === "expired")) return "expired";
  if (statuses.some((s) => s === "expiring_soon")) return "expiring_soon";
  if (statuses.some((s) => s === "missing")) return "missing";
  if (statuses.every((s) => s === "na")) return "na";
  return "valid";
}

export async function EmployeeList({
  branchId,
  canEdit,
  t,
}: {
  branchId: string;
  canEdit: boolean;
  t: Dictionary;
}) {
  const supabase = await createClient();

  const [{ data: employees }, { data: statusRows }] = await Promise.all([
    supabase
      .from("employees")
      .select("id, full_name, title, is_active")
      .eq("branch_id", branchId)
      .order("full_name"),
    supabase.from("v_employee_document_status").select("employee_id, status").eq("branch_id", branchId),
  ]);

  const statusesByEmployee = new Map<string, DocumentStatus[]>();
  statusRows?.forEach((r) => {
    if (!r.employee_id) return;
    const list = statusesByEmployee.get(r.employee_id) ?? [];
    list.push(r.status as DocumentStatus);
    statusesByEmployee.set(r.employee_id, list);
  });

  return (
    <div className="flex flex-col gap-4">
      {canEdit && <AddEmployeeForm branchId={branchId} t={t} />}

      <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
        <div className="hidden grid-cols-12 gap-3 border-b border-line bg-cream px-4 py-2 text-xs font-medium text-muted sm:grid">
          <div className="col-span-4">{t.name}</div>
          <div className="col-span-3">{t.title}</div>
          <div className="col-span-2">{t.status}</div>
          <div className="col-span-3" />
        </div>

        {employees?.map((e) => {
          const statuses = statusesByEmployee.get(e.id);
          return (
            <EmployeeRow
              key={e.id}
              branchId={branchId}
              employeeId={e.id}
              fullName={e.full_name}
              title={e.title}
              isActive={e.is_active}
              worstStatus={e.is_active && statuses ? worstStatus(statuses) : null}
              canEdit={canEdit}
              t={t}
            />
          );
        })}

        {(!employees || employees.length === 0) && (
          <p className="px-4 py-6 text-center text-sm text-muted">{t.noEmployeesYet}</p>
        )}
      </div>
    </div>
  );
}
