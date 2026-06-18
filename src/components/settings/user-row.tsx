"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateUserAction, removeUserAction } from "@/lib/actions/users";
import type { Dictionary } from "@/lib/i18n/en";

type ActionState = { error: string | null };

async function updateAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return updateUserAction(formData);
}
async function removeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return removeUserAction(formData);
}

type Props = {
  id: string;
  email: string;
  fullName: string;
  role: "branch_manager" | "legal_admin";
  branchId: string | null;
  branches: { id: string; name: string }[];
  isSelf: boolean;
  t: Dictionary;
};

export function UserRow(props: Props) {
  const { t } = props;
  const [updateState, updateFormAction, updatePending] = useActionState<ActionState, FormData>(
    updateAction,
    { error: null }
  );
  const [removeState, removeFormAction, removePending] = useActionState<ActionState, FormData>(
    removeAction,
    { error: null }
  );
  const [editing, setEditing] = useState(false);
  const [role, setRole] = useState(props.role);

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
          name="fullName"
          defaultValue={props.fullName}
          className="col-span-3 rounded-lg border border-line px-2 py-1 text-sm"
        />
        <select
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value as Props["role"])}
          className="col-span-3 rounded-lg border border-line px-2 py-1 text-sm"
        >
          <option value="branch_manager">{t.branchManagerRole}</option>
          <option value="legal_admin">{t.legalAdminRole}</option>
        </select>
        {role === "branch_manager" ? (
          <select
            name="branchId"
            defaultValue={props.branchId ?? ""}
            className="col-span-3 rounded-lg border border-line px-2 py-1 text-sm"
          >
            <option value="">{t.selectBranch}</option>
            {props.branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="col-span-3" />
        )}
        <div className="col-span-3 flex justify-end gap-2">
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

  const branchName = props.branches.find((b) => b.id === props.branchId)?.name;

  return (
    <div className="grid grid-cols-12 items-center gap-3 border-b border-line px-4 py-3 text-sm last:border-b-0">
      <div className="col-span-3 flex flex-col">
        <span className="font-medium text-ink">{props.fullName}</span>
        <span className="text-xs text-muted">{props.email}</span>
      </div>
      <span className="col-span-3 text-muted">
        {props.role === "legal_admin" ? t.legalAdminRole : t.branchManagerRole}
      </span>
      <span className="col-span-3 text-muted">{branchName ?? "—"}</span>
      <div className="col-span-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-full border border-line px-2.5 py-1 text-xs font-medium text-ink"
        >
          {t.edit}
        </button>
        {!props.isSelf && (
          <form
            action={removeFormAction}
            onSubmit={(e) => {
              if (!confirm(`Remove ${props.fullName}'s account? They will no longer be able to sign in.`)) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="id" value={props.id} />
            <button
              type="submit"
              disabled={removePending}
              className="rounded-full border border-red-300 px-2.5 py-1 text-xs font-medium text-red-700 disabled:opacity-50"
            >
              {removePending ? t.removing : t.remove}
            </button>
          </form>
        )}
      </div>
      {removeState.error && <p className="col-span-12 text-xs text-red-600">{removeState.error}</p>}
    </div>
  );
}
