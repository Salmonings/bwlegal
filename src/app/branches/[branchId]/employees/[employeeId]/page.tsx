import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";
import { LanguageToggle } from "@/components/language-toggle";
import { EmployeeChecklist } from "@/components/employee-checklist";
import { getDictionary, backArrow } from "@/lib/i18n";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ branchId: string; employeeId: string }>;
}) {
  const { branchId, employeeId } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  if (profile.role === "branch_manager" && profile.branch_id !== branchId) {
    redirect("/");
  }

  const { locale, t } = await getDictionary();
  const supabase = await createClient();
  const { data: employee } = await supabase
    .from("employees")
    .select("full_name, title, branch_id")
    .eq("id", employeeId)
    .single();

  if (!employee || employee.branch_id !== branchId) redirect(`/branches/${branchId}/employees`);

  return (
    <div className="min-h-screen bg-cream">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-white px-4 py-4 sm:px-6">
        <div>
          <Link href={`/branches/${branchId}/employees`} className="text-xs text-muted hover:text-orange">
            {backArrow(locale)} {t.employees}
          </Link>
          <h1 className="text-lg font-bold text-ink">{employee.full_name}</h1>
          {employee.title && <p className="text-sm text-muted">{employee.title}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <LanguageToggle locale={locale} />
          <LogoutButton label={t.logout} />
        </div>
      </header>

      <main className="p-4 sm:p-6">
        <EmployeeChecklist branchId={branchId} employeeId={employeeId} canEdit t={t} />
      </main>
    </div>
  );
}
