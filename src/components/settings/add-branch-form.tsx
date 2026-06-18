"use client";

import { useActionState, useRef } from "react";
import { createBranchAction } from "@/lib/actions/branches";

type ActionState = { error: string | null };

async function action(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return createBranchAction(formData);
}

export function AddBranchForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, { error: null });
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
      }}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
    >
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">Branch name</label>
        <input name="name" required className="rounded border border-gray-300 px-2 py-1 text-sm" />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Adding..." : "Add branch"}
      </button>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
