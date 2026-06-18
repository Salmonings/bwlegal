import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";
import { BranchChecklist } from "@/components/branch-checklist";
import { ComplianceMatrix } from "@/components/compliance-matrix";
import { IssueCountBadge } from "@/components/issue-count-badge";

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center gap-2">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Branch Compliance</h1>
            <p className="text-sm text-gray-500">
              {profile.full_name} &middot; {profile.role === "legal_admin" ? "Legal Admin" : "Branch Manager"}
            </p>
          </div>
          <IssueCountBadge branchId={profile.role === "branch_manager" ? profile.branch_id ?? undefined : undefined} />
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
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-medium text-gray-900">Compliance matrix</h2>
      <ComplianceMatrix />
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
