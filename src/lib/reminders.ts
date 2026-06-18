import { createAdminClient } from "@/lib/supabase/admin";
import { daysFromToday } from "@/lib/dates";
import { computeReminderStage, type ReminderStage } from "@/lib/reminder-stage";

export type DueReminderItem = {
  entityType: "document" | "employee_document";
  entityId: string;
  branchId: string;
  branchName: string;
  label: string;
  expiryDate: string;
  daysRemaining: number;
  stage: ReminderStage;
};

export async function findDueReminders(): Promise<DueReminderItem[]> {
  const supabase = createAdminClient();

  const [{ data: docRows }, { data: empDocRows }, { data: alreadyLogged }] = await Promise.all([
    supabase.from("v_branch_document_status").select("*").not("expiry_date", "is", null),
    supabase.from("v_employee_document_status").select("*").not("expiry_date", "is", null),
    supabase.from("reminder_log").select("entity_type, entity_id, reminder_stage"),
  ]);

  const loggedKeys = new Set(
    (alreadyLogged ?? []).map((r) => `${r.entity_type}:${r.entity_id}:${r.reminder_stage}`)
  );

  const items: DueReminderItem[] = [];

  for (const row of docRows ?? []) {
    if (row.is_not_applicable || !row.expiry_date || !row.document_id) continue;
    const stage = computeReminderStage(row.expiry_date);
    if (!stage) continue;
    if (loggedKeys.has(`document:${row.document_id}:${stage}`)) continue;

    items.push({
      entityType: "document",
      entityId: row.document_id,
      branchId: row.branch_id!,
      branchName: row.branch_name!,
      label: row.document_type_name_ar!,
      expiryDate: row.expiry_date,
      daysRemaining: daysFromToday(row.expiry_date),
      stage,
    });
  }

  for (const row of empDocRows ?? []) {
    if (row.is_not_applicable || !row.expiry_date || !row.employee_document_id) continue;
    const stage = computeReminderStage(row.expiry_date);
    if (!stage) continue;
    if (loggedKeys.has(`employee_document:${row.employee_document_id}:${stage}`)) continue;

    items.push({
      entityType: "employee_document",
      entityId: row.employee_document_id,
      branchId: row.branch_id!,
      branchName: "", // resolved by the caller via a branches lookup
      label: `${row.employee_document_type_name_ar} — ${row.employee_full_name}`,
      expiryDate: row.expiry_date,
      daysRemaining: daysFromToday(row.expiry_date),
      stage,
    });
  }

  const branchIdsNeedingName = [...new Set(items.filter((i) => !i.branchName).map((i) => i.branchId))];
  if (branchIdsNeedingName.length > 0) {
    const { data: branches } = await supabase
      .from("branches")
      .select("id, name")
      .in("id", branchIdsNeedingName);
    const nameById = new Map((branches ?? []).map((b) => [b.id, b.name]));
    for (const item of items) {
      if (!item.branchName) item.branchName = nameById.get(item.branchId) ?? "فرع غير معروف";
    }
  }

  return items;
}
