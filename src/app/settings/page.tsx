import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";
import { BranchesSection } from "@/components/settings/branches-section";
import { DocumentTypesSection } from "@/components/settings/document-types-section";
import { EmployeeDocumentTypesSection } from "@/components/settings/employee-document-types-section";
import { UsersSection } from "@/components/settings/users-section";

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "legal_admin") redirect("/");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <div>
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">
            &larr; Dashboard
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
        </div>
        <LogoutButton />
      </header>

      <main className="flex flex-col gap-10 p-6">
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-medium text-gray-900">Branches</h2>
          <BranchesSection />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-base font-medium text-gray-900">Company document types</h2>
          <DocumentTypesSection />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-base font-medium text-gray-900">Employee document types</h2>
          <EmployeeDocumentTypesSection />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-base font-medium text-gray-900">Users &amp; roles</h2>
          <UsersSection />
        </section>
      </main>
    </div>
  );
}
