"use client";

import { useActionState, useRef } from "react";
import { createEmployeeAction } from "@/lib/actions/employees";
import type { Dictionary } from "@/lib/i18n";

type ActionState = { error: string | null };

async function action(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return createEmployeeAction(formData);
}

export function AddEmployeeForm({ branchId, t }: { branchId: string; t: Dictionary }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {
    error: null,
  });
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
      <input type="hidden" name="branchId" value={branchId} />
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted">{t.name}</label>
        <input name="fullName" required className="rounded-lg border border-line px-2 py-1 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted">{t.title}</label>
        <input name="title" className="rounded-lg border border-line px-2 py-1 text-sm" />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-ink px-3 py-1.5 text-sm font-medium text-white transition hover:bg-orange disabled:opacity-50"
      >
        {pending ? t.adding : t.addEmployee}
      </button>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
