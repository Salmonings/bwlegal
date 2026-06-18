import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";
import { LanguageToggle } from "@/components/language-toggle";
import { BranchChecklist } from "@/components/branch-checklist";
import { ComplianceMatrix } from "@/components/compliance-matrix";
import { IssueCountBadge } from "@/components/issue-count-badge";
import { getDictionary, type Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/i18n/en";

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const { locale, t } = await getDictionary();

  return (
    <div className="min-h-screen bg-cream">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-white px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <div>
            <h1 className="text-lg font-bold text-orange">{t.appName}</h1>
            <p className="text-sm text-muted">
              {profile.full_name} &middot; {profile.role === "legal_admin" ? t.legalAdmin : t.branchManager}
            </p>
          </div>
          <IssueCountBadge branchId={profile.role === "branch_manager" ? profile.branch_id ?? undefined : undefined} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {profile.role === "legal_admin" && (
            <Link href="/settings" className="text-sm font-medium text-ink hover:text-orange">
              {t.settings}
            </Link>
          )}
          <LanguageToggle locale={locale} />
          <LogoutButton label={t.logout} />
        </div>
      </header>

      <main className="p-4 sm:p-6">
        {profile.role === "legal_admin" ? (
          <AdminDashboard t={t} />
        ) : (
          <BranchManagerDashboard branchId={profile.branch_id!} t={t} locale={locale} />
        )}
      </main>
    </div>
  );
}

async function AdminDashboard({ t }: { t: Dictionary }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-semibold text-ink">{t.complianceMatrix}</h2>
      <ComplianceMatrix t={t} />
    </div>
  );
}

async function BranchManagerDashboard({
  branchId,
  t,
  locale,
}: {
  branchId: string;
  t: Dictionary;
  locale: Locale;
}) {
  const supabase = await createClient();
  const { data: branch } = await supabase
    .from("branches")
    .select("name")
    .eq("id", branchId)
    .single();

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-semibold text-ink">
        {branch?.name} &mdash; {t.complianceChecklist}
      </h2>
      <BranchChecklist branchId={branchId} canEdit t={t} locale={locale} />
    </div>
  );
}
