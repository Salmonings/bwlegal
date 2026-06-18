"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { renameBranchAction } from "@/lib/actions/branches";

type ActionState = { error: string | null };

async function action(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return renameBranchAction(formData);
}

export function BranchRow({ id, name }: { id: string; name: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, { error: null });
  const [editing, setEditing] = useState(false);

  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending && !state.error) setEditing(false);
    wasPending.current = pending;
  }, [pending, state.error]);

  if (editing) {
    return (
      <form action={formAction} className="flex items-center gap-3 border-b border-gray-200 px-4 py-3 text-sm last:border-b-0">
        <input type="hidden" name="branchId" value={id} />
        <input
          name="name"
          defaultValue={name}
          className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700"
        >
          Cancel
        </button>
        {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 text-sm last:border-b-0">
      <span className="font-medium text-gray-900">{name}</span>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700"
      >
        Rename
      </button>
    </div>
  );
}
