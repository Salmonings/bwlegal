import { createClient } from "@/lib/supabase/server";
import { AddCatalogForm } from "@/components/settings/add-catalog-form";
import { CatalogRow } from "@/components/settings/catalog-row";
import {
  createDocumentTypeAction,
  updateDocumentTypeAction,
  setDocumentTypeActiveAction,
} from "@/lib/actions/document-types";
import type { Dictionary } from "@/lib/i18n/en";

export async function DocumentTypesSection({ t }: { t: Dictionary }) {
  const supabase = await createClient();
  const { data: types } = await supabase.from("document_types").select("*").order("display_order");

  return (
    <div className="flex flex-col gap-4">
      <AddCatalogForm createAction={createDocumentTypeAction} t={t} />
      <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
        <div className="grid grid-cols-12 gap-3 border-b border-line bg-cream px-4 py-2 text-xs font-medium text-muted">
          <div className="col-span-3">{t.name}</div>
          <div className="col-span-3">{t.displayOrder}</div>
          <div className="col-span-2">{t.leadTimeDays}</div>
          <div className="col-span-2">{t.status}</div>
          <div className="col-span-2" />
        </div>
        {types?.map((dt) => (
          <CatalogRow
            key={dt.id}
            id={dt.id}
            nameEn={dt.name_en}
            nameAr={dt.name_ar}
            displayOrder={dt.display_order}
            defaultLeadTimeDays={dt.default_lead_time_days}
            isActive={dt.is_active}
            updateAction={updateDocumentTypeAction}
            setActiveAction={setDocumentTypeActiveAction}
            t={t}
          />
        ))}
      </div>
    </div>
  );
}
