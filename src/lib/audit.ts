import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";

export async function logAudit(
  supabase: SupabaseClient<Database>,
  actorId: string,
  params: {
    action: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, Json>;
  }
) {
  await supabase.from("audit_logs").insert({
    actor_id: actorId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId,
    metadata: params.metadata ?? {},
  });
}
