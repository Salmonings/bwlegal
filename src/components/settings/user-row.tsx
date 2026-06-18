"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateUserAction, removeUserAction } from "@/lib/actions/users";

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
};

export function UserRow(props: Props) {
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
        className="grid grid-cols-12 items-center gap-3 border-b border-gray-200 px-4 py-3 text-sm last:border-b-0"
      >
        <input type="hidden" name="id" value={props.id} />
        <input
          name="fullName"
          defaultValue={props.fullName}
          className="col-span-3 rounded border border-gray-300 px-2 py-1 text-sm"
        />
        <select
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value as Props["role"])}
          className="col-span-3 rounded border border-gray-300 px-2 py-1 text-sm"
        >
          <option value="branch_manager">Branch manager</option>
          <option value="legal_admin">Legal admin</option>
        </select>
        {role === "branch_manager" ? (
          <select
            name="branchId"
            defaultValue={props.branchId ?? ""}
            className="col-span-3 rounded border border-gray-300 px-2 py-1 text-sm"
          >
            <option value="">Select branch...</option>
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
        {updateState.error && <p className="col-span-12 text-xs text-red-600">{updateState.error}</p>}
      </form>
    );
  }

  const branchName = props.branches.find((b) => b.id === props.branchId)?.name;

  return (
    <div className="grid grid-cols-12 items-center gap-3 border-b border-gray-200 px-4 py-3 text-sm last:border-b-0">
      <div className="col-span-3 flex flex-col">
        <span className="font-medium text-gray-900">{props.fullName}</span>
        <span className="text-xs text-gray-500">{props.email}</span>
      </div>
      <span className="col-span-3 text-gray-600">
        {props.role === "legal_admin" ? "Legal admin" : "Branch manager"}
      </span>
      <span className="col-span-3 text-gray-600">{branchName ?? "—"}</span>
      <div className="col-span-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700"
        >
          Edit
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
              className="rounded-md border border-red-300 px-2.5 py-1 text-xs font-medium text-red-700 disabled:opacity-50"
            >
              {removePending ? "Removing..." : "Remove"}
            </button>
          </form>
        )}
      </div>
      {removeState.error && <p className="col-span-12 text-xs text-red-600">{removeState.error}</p>}
    </div>
  );
}
