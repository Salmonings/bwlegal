import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";
import { EmployeeList } from "@/components/employee-list";
import { t, ARROW_BACK } from "@/lib/i18n";

export default async function EmployeesPage({
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
  const { data: branch } = await supabase.from("branches").select("name").eq("id", branchId).single();

  if (!branch) redirect("/");

  return (
    <div className="min-h-screen bg-cream">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-white px-4 py-4 sm:px-6">
        <div>
          <Link href={`/branches/${branchId}`} className="text-xs text-muted hover:text-orange">
            {ARROW_BACK} {branch.name}
          </Link>
          <h1 className="text-lg font-bold text-ink">
            {branch.name} &mdash; {t.employees}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <LogoutButton label={t.logout} />
        </div>
      </header>

      <main className="p-4 sm:p-6">
        <EmployeeList branchId={branchId} canEdit t={t} />
      </main>
    </div>
  );
}
