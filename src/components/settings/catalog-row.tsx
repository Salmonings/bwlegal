"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/lib/i18n";

type ActionState = { error: string | null };

type Props = {
  id: string;
  name: string;
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
        className="flex flex-col gap-2 border-b border-line px-4 py-3 text-sm last:border-b-0 sm:grid sm:grid-cols-12 sm:items-center sm:gap-3"
      >
        <input type="hidden" name="id" value={props.id} />
        <input
          name="nameAr"
          defaultValue={props.name}
          placeholder={t.documentTypeName}
          className="rounded-lg border border-line px-2 py-1.5 text-sm sm:col-span-6 sm:py-1"
        />
        <div className="flex gap-2 sm:contents">
          <input
            name="displayOrder"
            type="number"
            defaultValue={props.displayOrder}
            className="w-full rounded-lg border border-line px-2 py-1.5 text-sm sm:col-span-2 sm:py-1"
          />
          <input
            name="defaultLeadTimeDays"
            type="number"
            defaultValue={props.defaultLeadTimeDays}
            className="w-full rounded-lg border border-line px-2 py-1.5 text-sm sm:col-span-2 sm:py-1"
          />
        </div>
        <div className="flex justify-end gap-2 sm:col-span-2">
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
        {updateState.error && <p className="text-xs text-red-600 sm:col-span-12">{updateState.error}</p>}
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-2 border-b border-line px-4 py-3 text-sm last:border-b-0 sm:grid sm:grid-cols-12 sm:items-center sm:gap-3">
      <div className="flex flex-col sm:col-span-3">
        <span className={`font-medium ${props.isActive ? "text-ink" : "text-muted"}`}>{props.name}</span>
      </div>
      <div className="flex items-center justify-between gap-2 text-muted sm:contents">
        <span className="sm:col-span-3">
          {t.displayOrder}: {props.displayOrder}
        </span>
        <span className="sm:col-span-2">{props.defaultLeadTimeDays}d</span>
      </div>
      <span className="sm:col-span-2">
        {!props.isActive && (
          <span className="inline-flex items-center rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-600">
            {t.inactive}
          </span>
        )}
      </span>
      <div className="flex justify-end gap-2 sm:col-span-2">
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
