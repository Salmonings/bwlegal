import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";
import { EmployeeChecklist } from "@/components/employee-checklist";

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

  const supabase = await createClient();
  const { data: employee } = await supabase
    .from("employees")
    .select("full_name, title, branch_id")
    .eq("id", employeeId)
    .single();

  if (!employee || employee.branch_id !== branchId) redirect(`/branches/${branchId}/employees`);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <div>
          <Link href={`/branches/${branchId}/employees`} className="text-xs text-gray-400 hover:text-gray-600">
            &larr; Employees
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">{employee.full_name}</h1>
          {employee.title && <p className="text-sm text-gray-500">{employee.title}</p>}
        </div>
        <LogoutButton />
      </header>

      <main className="p-6">
        <EmployeeChecklist branchId={branchId} employeeId={employeeId} canEdit />
      </main>
    </div>
  );
}
