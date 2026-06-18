import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";
import { BranchChecklist } from "@/components/branch-checklist";

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Branch Compliance</h1>
          <p className="text-sm text-gray-500">
            {profile.full_name} &middot; {profile.role === "legal_admin" ? "Legal Admin" : "Branch Manager"}
          </p>
        </div>
        <LogoutButton />
      </header>

      <main className="p-6">
        {profile.role === "legal_admin" ? (
          <AdminDashboard />
        ) : (
          <BranchManagerDashboard branchId={profile.branch_id!} />
        )}
      </main>
    </div>
  );
}

async function AdminDashboard() {
  const supabase = await createClient();
  const { data: branches } = await supabase.from("branches").select("id, name").order("name");

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-medium text-gray-900">
        Compliance matrix (placeholder — built in step 4)
      </h2>
      <p className="text-sm text-gray-500">{branches?.length ?? 0} branches loaded:</p>
      <ul className="flex flex-wrap gap-2 text-sm">
        {branches?.map((b) => (
          <li key={b.id}>
            <Link
              href={`/branches/${b.id}`}
              className="rounded-full bg-white px-3 py-1 shadow-sm hover:bg-gray-100"
            >
              {b.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

async function BranchManagerDashboard({ branchId }: { branchId: string }) {
  const supabase = await createClient();
  const { data: branch } = await supabase
    .from("branches")
    .select("name")
    .eq("id", branchId)
    .single();

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-medium text-gray-900">{branch?.name} — compliance checklist</h2>
      <BranchChecklist branchId={branchId} canEdit />
    </div>
  );
}
