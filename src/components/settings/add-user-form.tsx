"use client";

import { useActionState, useRef, useState } from "react";
import { createUserAction } from "@/lib/actions/users";
import type { Dictionary } from "@/lib/i18n";

type ActionState = { error: string | null; tempPassword: string | null };

async function action(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return createUserAction(formData);
}

export function AddUserForm({
  branches,
  t,
}: {
  branches: { id: string; name: string }[];
  t: Dictionary;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {
    error: null,
    tempPassword: null,
  });
  const [role, setRole] = useState<"branch_manager" | "legal_admin">("branch_manager");
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="flex flex-col gap-3">
      <form
        ref={formRef}
        action={async (formData) => {
          await formAction(formData);
          formRef.current?.reset();
          setRole("branch_manager");
        }}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm"
      >
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted">{t.name}</label>
          <input name="fullName" required className="rounded-lg border border-line px-2 py-1 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted">{t.email}</label>
          <input
            name="email"
            type="email"
            required
            className="rounded-lg border border-line px-2 py-1 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted">{t.role}</label>
          <select
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value as typeof role)}
            className="rounded-lg border border-line px-2 py-1 text-sm"
          >
            <option value="branch_manager">{t.branchManagerRole}</option>
            <option value="legal_admin">{t.legalAdminRole}</option>
          </select>
        </div>
        {role === "branch_manager" && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted">{t.branch}</label>
            <select name="branchId" required className="rounded-lg border border-line px-2 py-1 text-sm">
              <option value="">{t.selectBranch}</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-ink px-3 py-1.5 text-sm font-medium text-white transition hover:bg-orange disabled:opacity-50"
        >
          {pending ? t.creating : t.createUser}
        </button>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      </form>

      {state.tempPassword && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          {t.tempPasswordMsg}{" "}
          <code className="rounded bg-amber-100 px-2 py-0.5 font-mono">{state.tempPassword}</code>
        </div>
      )}
    </div>
  );
}
