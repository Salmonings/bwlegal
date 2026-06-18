import { createClient } from "@/lib/supabase/server";
import { AddEmployeeForm } from "@/components/add-employee-form";
import { EmployeeRow } from "@/components/employee-row";
import type { DocumentStatus } from "@/components/status-badge";

function worstStatus(statuses: DocumentStatus[]): DocumentStatus {
  if (statuses.some((s) => s === "expired")) return "expired";
  if (statuses.some((s) => s === "expiring_soon")) return "expiring_soon";
  if (statuses.some((s) => s === "missing")) return "missing";
  if (statuses.every((s) => s === "na")) return "na";
  return "valid";
}

export async function EmployeeList({ branchId, canEdit }: { branchId: string; canEdit: boolean }) {
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
      {canEdit && <AddEmployeeForm branchId={branchId} />}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-12 gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500">
          <div className="col-span-4">Name</div>
          <div className="col-span-3">Title</div>
          <div className="col-span-2">Status</div>
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
            />
          );
        })}

        {(!employees || employees.length === 0) && (
          <p className="px-4 py-6 text-center text-sm text-gray-400">No employees yet.</p>
        )}
      </div>
    </div>
  );
}
