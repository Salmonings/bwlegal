import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { BranchChecklist } from "@/components/branch-checklist";
import { LogoutButton } from "@/components/logout-button";

export default async function BranchPage({
  params,
}: {
  params: Promise<{ branchId: string }>;
}) {
  const { branchId } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  if (profile.role === "branch_manager" && profile.branch_id !== branchId) {
    redirect("/");
  }

  const supabase = await createClient();
  const { data: branch } = await supabase
    .from("branches")
    .select("name")
    .eq("id", branchId)
    .single();

  if (!branch) redirect("/");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <div>
          {profile.role === "legal_admin" && (
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">
              &larr; All branches
            </Link>
          )}
          <h1 className="text-lg font-semibold text-gray-900">{branch.name}</h1>
        </div>
        <LogoutButton />
      </header>

      <main className="p-6">
        <BranchChecklist branchId={branchId} canEdit />
      </main>
    </div>
  );
}
