"use client";

import { useActionState, useRef, useState } from "react";
import { createUserAction } from "@/lib/actions/users";

type ActionState = { error: string | null; tempPassword: string | null };

async function action(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return createUserAction(formData);
}

export function AddUserForm({ branches }: { branches: { id: string; name: string }[] }) {
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
        className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      >
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Name</label>
          <input name="fullName" required className="rounded border border-gray-300 px-2 py-1 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Email</label>
          <input
            name="email"
            type="email"
            required
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Role</label>
          <select
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value as typeof role)}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          >
            <option value="branch_manager">Branch manager</option>
            <option value="legal_admin">Legal admin</option>
          </select>
        </div>
        {role === "branch_manager" && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Branch</label>
            <select name="branchId" required className="rounded border border-gray-300 px-2 py-1 text-sm">
              <option value="">Select branch...</option>
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
          className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Creating..." : "Create user"}
        </button>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      </form>

      {state.tempPassword && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          User created. Share this temporary password with them now — it won&apos;t be shown again:{" "}
          <code className="rounded bg-amber-100 px-2 py-0.5 font-mono">{state.tempPassword}</code>
        </div>
      )}
    </div>
  );
}
