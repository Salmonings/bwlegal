import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { BranchChecklist } from "@/components/branch-checklist";
import { LogoutButton } from "@/components/logout-button";
import { LanguageToggle } from "@/components/language-toggle";
import { IssueCountBadge } from "@/components/issue-count-badge";
import { getDictionary, backArrow } from "@/lib/i18n";

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

  const { locale, t } = await getDictionary();
  const supabase = await createClient();
  const { data: branch } = await supabase
    .from("branches")
    .select("name")
    .eq("id", branchId)
    .single();

  if (!branch) redirect("/");

  return (
    <div className="min-h-screen bg-cream">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-white px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <div>
            {profile.role === "legal_admin" && (
              <Link href="/" className="text-xs text-muted hover:text-orange">
                {backArrow(locale)} {t.allBranches}
              </Link>
            )}
            <h1 className="text-lg font-bold text-ink">{branch.name}</h1>
          </div>
          <IssueCountBadge branchId={branchId} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <LanguageToggle locale={locale} />
          <LogoutButton label={t.logout} />
        </div>
      </header>

      <main className="p-4 sm:p-6">
        <BranchChecklist branchId={branchId} canEdit t={t} locale={locale} />
      </main>
    </div>
  );
}
