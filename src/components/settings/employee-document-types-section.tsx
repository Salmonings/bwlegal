import { createClient } from "@/lib/supabase/server";
import { AddCatalogForm } from "@/components/settings/add-catalog-form";
import { CatalogRow } from "@/components/settings/catalog-row";
import {
  createEmployeeDocumentTypeAction,
  updateEmployeeDocumentTypeAction,
  setEmployeeDocumentTypeActiveAction,
} from "@/lib/actions/employee-document-types";

export async function EmployeeDocumentTypesSection() {
  const supabase = await createClient();
  const { data: types } = await supabase
    .from("employee_document_types")
    .select("*")
    .order("display_order");

  return (
    <div className="flex flex-col gap-4">
      <AddCatalogForm createAction={createEmployeeDocumentTypeAction} />
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-12 gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500">
          <div className="col-span-3">Name</div>
          <div className="col-span-3">Order</div>
          <div className="col-span-2">Lead time</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2" />
        </div>
        {types?.map((t) => (
          <CatalogRow
            key={t.id}
            id={t.id}
            nameEn={t.name_en}
            nameAr={t.name_ar}
            displayOrder={t.display_order}
            defaultLeadTimeDays={t.default_lead_time_days}
            isActive={t.is_active}
            updateAction={updateEmployeeDocumentTypeAction}
            setActiveAction={setEmployeeDocumentTypeActiveAction}
          />
        ))}
      </div>
    </div>
  );
}
