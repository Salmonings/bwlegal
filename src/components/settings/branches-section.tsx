import { createClient } from "@/lib/supabase/server";
import { AddBranchForm } from "@/components/settings/add-branch-form";
import { BranchRow } from "@/components/settings/branch-row";
import type { Dictionary } from "@/lib/i18n/en";

export async function BranchesSection({ t }: { t: Dictionary }) {
  const supabase = await createClient();
  const { data: branches } = await supabase.from("branches").select("id, name").order("name");

  return (
    <div className="flex flex-col gap-4">
      <AddBranchForm t={t} />
      <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
        {branches?.map((b) => <BranchRow key={b.id} id={b.id} name={b.name} t={t} />)}
      </div>
    </div>
  );
}
