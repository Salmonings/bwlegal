"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { updateEmployeeAction, setEmployeeActiveAction } from "@/lib/actions/employees";
import { StatusBadge, type DocumentStatus } from "@/components/status-badge";

type Props = {
  branchId: string;
  employeeId: string;
  fullName: string;
  title: string | null;
  isActive: boolean;
  worstStatus: DocumentStatus | null;
  canEdit: boolean;
};

type ActionState = { error: string | null };

async function updateAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return updateEmployeeAction(formData);
}

async function toggleAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return setEmployeeActiveAction(formData);
}

export function EmployeeRow(props: Props) {
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

  return (
    <div className="grid grid-cols-12 items-center gap-3 border-b border-gray-200 px-4 py-3 text-sm last:border-b-0">
      {editing ? (
        <form action={updateFormAction} className="col-span-9 grid grid-cols-9 items-center gap-3">
          <input type="hidden" name="branchId" value={props.branchId} />
          <input type="hidden" name="employeeId" value={props.employeeId} />
          <input
            name="fullName"
            defaultValue={props.fullName}
            className="col-span-4 rounded border border-gray-300 px-2 py-1 text-sm"
          />
          <input
            name="title"
            defaultValue={props.title ?? ""}
            placeholder="Title"
            className="col-span-3 rounded border border-gray-300 px-2 py-1 text-sm"
          />
          <div className="col-span-2 flex gap-2">
            <button
              type="submit"
              disabled={updatePending}
              className="rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white disabled:opacity-50"
            >
              {updatePending ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <Link
            href={`/branches/${props.branchId}/employees/${props.employeeId}`}
            className="col-span-4 font-medium text-gray-900 hover:underline"
          >
            {props.fullName}
          </Link>
          <span className="col-span-3 text-gray-600">{props.title ?? "—"}</span>
          <span className="col-span-2">
            {!props.isActive ? (
              <span className="inline-flex items-center rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                Inactive
              </span>
            ) : props.worstStatus ? (
              <StatusBadge status={props.worstStatus} />
            ) : null}
          </span>
        </>
      )}

      {props.canEdit && !editing && (
        <div className="col-span-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700"
          >
            Edit
          </button>
          <form action={toggleFormAction}>
            <input type="hidden" name="branchId" value={props.branchId} />
            <input type="hidden" name="employeeId" value={props.employeeId} />
            <input type="hidden" name="isActive" value={(!props.isActive).toString()} />
            <button
              type="submit"
              disabled={togglePending}
              className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 disabled:opacity-50"
            >
              {props.isActive ? "Deactivate" : "Reactivate"}
            </button>
          </form>
        </div>
      )}

      {updateState.error && <p className="col-span-12 text-xs text-red-600">{updateState.error}</p>}
    </div>
  );
}
