"use client";

import { useActionState, useRef } from "react";
import { createBranchAction } from "@/lib/actions/branches";
import type { Dictionary } from "@/lib/i18n";

type ActionState = { error: string | null };

async function action(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return createBranchAction(formData);
}

export function AddBranchForm({ t }: { t: Dictionary }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, { error: null });
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
      }}
      className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm"
    >
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted">{t.branchName}</label>
        <input name="name" required className="rounded-lg border border-line px-2 py-1 text-sm" />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-ink px-3 py-1.5 text-sm font-medium text-white transition hover:bg-orange disabled:opacity-50"
      >
        {pending ? t.adding : t.addBranch}
      </button>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
