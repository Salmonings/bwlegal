import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth";
import { AddUserForm } from "@/components/settings/add-user-form";
import { UserRow } from "@/components/settings/user-row";
import type { Dictionary } from "@/lib/i18n/en";

export async function UsersSection({ t }: { t: Dictionary }) {
  const currentProfile = await getCurrentProfile();
  const supabase = await createClient();
  const admin = createAdminClient();

  const [{ data: profiles }, { data: branches }, { data: userList }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role, branch_id").order("full_name"),
    supabase.from("branches").select("id, name").order("name"),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const emailById = new Map(userList?.users.map((u) => [u.id, u.email ?? "—"]));

  return (
    <div className="flex flex-col gap-4">
      <AddUserForm branches={branches ?? []} t={t} />
      <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
        <div className="grid grid-cols-12 gap-3 border-b border-line bg-cream px-4 py-2 text-xs font-medium text-muted">
          <div className="col-span-3">
            {t.name} / {t.email}
          </div>
          <div className="col-span-3">{t.role}</div>
          <div className="col-span-3">{t.branch}</div>
          <div className="col-span-3" />
        </div>
        {profiles?.map((p) => (
          <UserRow
            key={p.id}
            id={p.id}
            email={emailById.get(p.id) ?? "—"}
            fullName={p.full_name}
            role={p.role as "branch_manager" | "legal_admin"}
            branchId={p.branch_id}
            branches={branches ?? []}
            isSelf={p.id === currentProfile?.id}
            t={t}
          />
        ))}
      </div>
    </div>
  );
}
