"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { updateEmployeeAction, setEmployeeActiveAction } from "@/lib/actions/employees";
import { StatusBadge, type DocumentStatus } from "@/components/status-badge";
import type { Dictionary } from "@/lib/i18n";

type Props = {
  branchId: string;
  employeeId: string;
  fullName: string;
  title: string | null;
  isActive: boolean;
  worstStatus: DocumentStatus | null;
  canEdit: boolean;
  t: Dictionary;
};

type ActionState = { error: string | null };

async function updateAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return updateEmployeeAction(formData);
}

async function toggleAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return setEmployeeActiveAction(formData);
}

export function EmployeeRow(props: Props) {
  const { t } = props;
  const [updateState, updateFormAction, updatePending] = useActionState<ActionState, FormData>(
    updateAction,
    { error: null }
  );
  const [, toggleFormAction, togglePending] = useActionState<ActionState, FormData>(toggleAction, {
    error: null,
  });
  const [editing, setEditing] = useState(false);

  // Exit edit mode only once the save actually completes (not on click) —
  // toggling local state synchronously on click can unmount the form before
  // the browser captures its FormData, dropping the submission entirely.
  const wasUpdating = useRef(false);
  useEffect(() => {
    if (wasUpdating.current && !updatePending && !updateState.error) {
      setEditing(false);
    }
    wasUpdating.current = updatePending;
  }, [updatePending, updateState.error]);

  if (editing) {
    return (
      <form
        action={updateFormAction}
        className="flex flex-col gap-2 border-b border-line px-4 py-3 text-sm last:border-b-0 sm:grid sm:grid-cols-12 sm:items-center sm:gap-3"
      >
        <input type="hidden" name="branchId" value={props.branchId} />
        <input type="hidden" name="employeeId" value={props.employeeId} />
        <input
          name="fullName"
          defaultValue={props.fullName}
          className="rounded-lg border border-line px-2 py-1.5 text-sm sm:col-span-4 sm:py-1"
        />
        <input
          name="title"
          defaultValue={props.title ?? ""}
          placeholder={t.title}
          className="rounded-lg border border-line px-2 py-1.5 text-sm sm:col-span-3 sm:py-1"
        />
        <div className="flex gap-2 sm:col-span-2">
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
      <div className="flex items-center justify-between gap-2 sm:col-span-7 sm:contents">
        <Link
          href={`/branches/${props.branchId}/employees/${props.employeeId}`}
          className="font-medium text-ink hover:text-orange sm:col-span-4"
        >
          {props.fullName}
        </Link>
        <span className="text-muted sm:col-span-3">{props.title ?? "—"}</span>
      </div>
      <span className="sm:col-span-2">
        {!props.isActive ? (
          <span className="inline-flex items-center rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-600">
            {t.inactive}
          </span>
        ) : props.worstStatus ? (
          <StatusBadge status={props.worstStatus} t={t} />
        ) : null}
      </span>

      {props.canEdit && (
        <div className="flex justify-end gap-2 sm:col-span-3">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-full border border-line px-2.5 py-1 text-xs font-medium text-ink"
          >
            {t.edit}
          </button>
          <form action={toggleFormAction}>
            <input type="hidden" name="branchId" value={props.branchId} />
            <input type="hidden" name="employeeId" value={props.employeeId} />
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
      )}
    </div>
  );
}
