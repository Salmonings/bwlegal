import { createClient } from "@/lib/supabase/server";
import { AddBranchForm } from "@/components/settings/add-branch-form";
import { BranchRow } from "@/components/settings/branch-row";

export async function BranchesSection() {
  const supabase = await createClient();
  const { data: branches } = await supabase.from("branches").select("id, name").order("name");

  return (
    <div className="flex flex-col gap-4">
      <AddBranchForm />
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        {branches?.map((b) => <BranchRow key={b.id} id={b.id} name={b.name} />)}
      </div>
    </div>
  );
}
