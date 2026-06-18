"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateUserAction, removeUserAction } from "@/lib/actions/users";
import type { Dictionary } from "@/lib/i18n";

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
        className="flex flex-col gap-2 border-b border-line px-4 py-3 text-sm last:border-b-0 sm:grid sm:grid-cols-12 sm:items-center sm:gap-3"
      >
        <input type="hidden" name="id" value={props.id} />
        <input
          name="fullName"
          defaultValue={props.fullName}
          className="rounded-lg border border-line px-2 py-1.5 text-sm sm:col-span-3 sm:py-1"
        />
        <select
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value as Props["role"])}
          className="rounded-lg border border-line px-2 py-1.5 text-sm sm:col-span-3 sm:py-1"
        >
          <option value="branch_manager">{t.branchManagerRole}</option>
          <option value="legal_admin">{t.legalAdminRole}</option>
        </select>
        {role === "branch_manager" ? (
          <select
            name="branchId"
            defaultValue={props.branchId ?? ""}
            className="rounded-lg border border-line px-2 py-1.5 text-sm sm:col-span-3 sm:py-1"
          >
            <option value="">{t.selectBranch}</option>
            {props.branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="hidden sm:col-span-3" />
        )}
        <div className="flex justify-end gap-2 sm:col-span-3">
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

  const branchName = props.branches.find((b) => b.id === props.branchId)?.name;

  return (
    <div className="flex flex-col gap-2 border-b border-line px-4 py-3 text-sm last:border-b-0 sm:grid sm:grid-cols-12 sm:items-center sm:gap-3">
      <div className="flex flex-col sm:col-span-3">
        <span className="font-medium text-ink">{props.fullName}</span>
        <span className="text-xs text-muted">{props.email}</span>
      </div>
      <div className="flex items-center justify-between gap-2 text-muted sm:contents">
        <span className="sm:col-span-3">
          {props.role === "legal_admin" ? t.legalAdminRole : t.branchManagerRole}
        </span>
        <span className="sm:col-span-3">{branchName ?? "—"}</span>
      </div>
      <div className="flex justify-end gap-2 sm:col-span-3">
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
      {removeState.error && <p className="text-xs text-red-600 sm:col-span-12">{removeState.error}</p>}
    </div>
  );
}
