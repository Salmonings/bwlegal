"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { renameBranchAction } from "@/lib/actions/branches";
import type { Dictionary } from "@/lib/i18n";

type ActionState = { error: string | null };

async function action(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return renameBranchAction(formData);
}

export function BranchRow({ id, name, t }: { id: string; name: string; t: Dictionary }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, { error: null });
  const [editing, setEditing] = useState(false);

  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending && !state.error) setEditing(false);
    wasPending.current = pending;
  }, [pending, state.error]);

  if (editing) {
    return (
      <form action={formAction} className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3 text-sm last:border-b-0 sm:gap-3">
        <input type="hidden" name="branchId" value={id} />
        <input
          name="name"
          defaultValue={name}
          className="min-w-0 flex-1 rounded-lg border border-line px-2 py-1.5 text-sm sm:py-1"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-full bg-ink px-2.5 py-1 text-xs font-medium text-white hover:bg-orange disabled:opacity-50"
        >
          {pending ? t.saving : t.save}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="shrink-0 rounded-full border border-line px-2.5 py-1 text-xs font-medium text-ink"
        >
          {t.cancel}
        </button>
        {state.error && <p className="w-full text-xs text-red-600">{state.error}</p>}
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between border-b border-line px-4 py-3 text-sm last:border-b-0">
      <span className="font-medium text-ink">{name}</span>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="rounded-full border border-line px-2.5 py-1 text-xs font-medium text-ink"
      >
        {t.rename}
      </button>
    </div>
  );
}
