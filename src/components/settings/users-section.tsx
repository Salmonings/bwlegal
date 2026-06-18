import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth";
import { AddUserForm } from "@/components/settings/add-user-form";
import { UserRow } from "@/components/settings/user-row";

export async function UsersSection() {
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
      <AddUserForm branches={branches ?? []} />
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-12 gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500">
          <div className="col-span-3">Name / Email</div>
          <div className="col-span-3">Role</div>
          <div className="col-span-3">Branch</div>
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
          />
        ))}
      </div>
    </div>
  );
}
