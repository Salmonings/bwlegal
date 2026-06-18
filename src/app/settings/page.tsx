import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";
import { LanguageToggle } from "@/components/language-toggle";
import { BranchesSection } from "@/components/settings/branches-section";
import { DocumentTypesSection } from "@/components/settings/document-types-section";
import { EmployeeDocumentTypesSection } from "@/components/settings/employee-document-types-section";
import { UsersSection } from "@/components/settings/users-section";
import { getDictionary, backArrow } from "@/lib/i18n";

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "legal_admin") redirect("/");

  const { locale, t } = await getDictionary();

  return (
    <div className="min-h-screen bg-cream">
      <header className="flex items-center justify-between border-b border-line bg-white px-6 py-4">
        <div>
          <Link href="/" className="text-xs text-muted hover:text-orange">
            {backArrow(locale)} {t.dashboard}
          </Link>
          <h1 className="text-lg font-bold text-ink">{t.settings}</h1>
        </div>
        <div className="flex items-center gap-3">
          <LanguageToggle locale={locale} />
          <LogoutButton label={t.logout} />
        </div>
      </header>

      <main className="flex flex-col gap-10 p-6">
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-ink">{t.branches}</h2>
          <BranchesSection t={t} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-ink">{t.companyDocumentTypes}</h2>
          <DocumentTypesSection t={t} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-ink">{t.employeeDocumentTypesHeading}</h2>
          <EmployeeDocumentTypesSection t={t} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-ink">{t.usersRoles}</h2>
          <UsersSection t={t} />
        </section>
      </main>
    </div>
  );
}
