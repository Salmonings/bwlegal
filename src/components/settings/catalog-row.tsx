"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/lib/i18n/en";

type ActionState = { error: string | null };

type Props = {
  id: string;
  nameEn: string;
  nameAr: string;
  displayOrder: number;
  defaultLeadTimeDays: number;
  isActive: boolean;
  updateAction: (formData: FormData) => Promise<ActionState>;
  setActiveAction: (formData: FormData) => Promise<ActionState>;
  t: Dictionary;
};

export function CatalogRow(props: Props) {
  const { t } = props;
  const [updateState, updateFormAction, updatePending] = useActionState<ActionState, FormData>(
    async (_prev, formData) => props.updateAction(formData),
    { error: null }
  );
  const [, toggleFormAction, togglePending] = useActionState<ActionState, FormData>(
    async (_prev, formData) => props.setActiveAction(formData),
    { error: null }
  );
  const [editing, setEditing] = useState(false);

  const wasUpdating = useRef(false);
  useEffect(() => {
    if (wasUpdating.current && !updatePending && !updateState.error) setEditing(false);
    wasUpdating.current = updatePending;
  }, [updatePending, updateState.error]);

  if (editing) {
    return (
      <form
        action={updateFormAction}
        className="grid grid-cols-12 items-center gap-3 border-b border-line px-4 py-3 text-sm last:border-b-0"
      >
        <input type="hidden" name="id" value={props.id} />
        <input
          name="nameEn"
          defaultValue={props.nameEn}
          placeholder={t.englishName}
          className="col-span-3 rounded-lg border border-line px-2 py-1 text-sm"
        />
        <input
          name="nameAr"
          dir="rtl"
          defaultValue={props.nameAr}
          placeholder={t.arabicName}
          className="col-span-3 rounded-lg border border-line px-2 py-1 text-sm"
        />
        <input
          name="displayOrder"
          type="number"
          defaultValue={props.displayOrder}
          className="col-span-2 rounded-lg border border-line px-2 py-1 text-sm"
        />
        <input
          name="defaultLeadTimeDays"
          type="number"
          defaultValue={props.defaultLeadTimeDays}
          className="col-span-2 rounded-lg border border-line px-2 py-1 text-sm"
        />
        <div className="col-span-2 flex justify-end gap-2">
          <button
            type="submit"
            disabled={updatePending}
            className="rounded-full bg-ink px-2.5 py-1 text-xs font-medium text-white hover:bg-orange disabled:opacity-50"
          >
            {updatePending ? t.saving : t.save}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-full border border-line px-2.5 py-1 text-xs font-medium text-ink"
          >
            {t.cancel}
          </button>
        </div>
        {updateState.error && <p className="col-span-12 text-xs text-red-600">{updateState.error}</p>}
      </form>
    );
  }

  return (
    <div className="grid grid-cols-12 items-center gap-3 border-b border-line px-4 py-3 text-sm last:border-b-0">
      <div className="col-span-3 flex flex-col">
        <span className={`font-medium ${props.isActive ? "text-ink" : "text-muted"}`}>{props.nameEn}</span>
        <span dir="rtl" className="text-xs text-muted">
          {props.nameAr}
        </span>
      </div>
      <span className="col-span-3 text-muted">
        {t.displayOrder}: {props.displayOrder}
      </span>
      <span className="col-span-2 text-muted">{props.defaultLeadTimeDays}d</span>
      <span className="col-span-2">
        {!props.isActive && (
          <span className="inline-flex items-center rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-600">
            {t.inactive}
          </span>
        )}
      </span>
      <div className="col-span-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-full border border-line px-2.5 py-1 text-xs font-medium text-ink"
        >
          {t.edit}
        </button>
        <form action={toggleFormAction}>
          <input type="hidden" name="id" value={props.id} />
          <input type="hidden" name="isActive" value={(!props.isActive).toString()} />
          <button
            type="submit"
            disabled={togglePending}
            className="rounded-full border border-line px-2.5 py-1 text-xs font-medium text-ink disabled:opacity-50"
          >
            {props.isActive ? t.deactivate : t.reactivate}
          </button>
        </form>
      </div>
    </div>
  );
}
