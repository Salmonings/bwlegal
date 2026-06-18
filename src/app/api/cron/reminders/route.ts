import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findDueReminders, type DueReminderItem } from "@/lib/reminders";
import { sendReminderDigest } from "@/lib/email";

function itemKey(item: DueReminderItem) {
  return `${item.entityType}:${item.entityId}:${item.stage}`;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY || !process.env.REMINDERS_FROM_EMAIL) {
    // Fail loudly: silently skipping would let reminder_log mark items as
    // sent without ever emailing anyone, which defeats the entire feature.
    return NextResponse.json(
      { error: "RESEND_API_KEY / REMINDERS_FROM_EMAIL is not configured." },
      { status: 500 }
    );
  }

  const supabase = createAdminClient();
  const items = await findDueReminders();

  if (items.length === 0) {
    return NextResponse.json({ itemsFound: 0, emailsSent: 0, itemsLogged: 0 });
  }

  // An item is only logged once every email that was supposed to include it
  // succeeds — partial failures (e.g. admin digest fails but a branch
  // manager's digest succeeds) must not get marked as delivered.
  const delivered = new Map(items.map((i) => [itemKey(i), true]));
  const markFailed = (failed: DueReminderItem[]) => {
    for (const i of failed) delivered.set(itemKey(i), false);
  };

  const byBranch = new Map<string, DueReminderItem[]>();
  for (const item of items) {
    const list = byBranch.get(item.branchId) ?? [];
    list.push(item);
    byBranch.set(item.branchId, list);
  }

  const [{ data: managers }, { data: admins }] = await Promise.all([
    supabase.from("profiles").select("id, branch_id").eq("role", "branch_manager"),
    supabase.from("profiles").select("id").eq("role", "legal_admin"),
  ]);

  let emailsSent = 0;

  for (const [branchId, branchItems] of byBranch) {
    const manager = managers?.find((m) => m.branch_id === branchId);
    if (!manager) continue;

    const { data: userData } = await supabase.auth.admin.getUserById(manager.id);
    const email = userData?.user?.email;
    if (!email) continue;

    try {
      const ok = await sendReminderDigest(email, branchItems);
      if (ok) emailsSent += 1;
      else markFailed(branchItems);
    } catch {
      markFailed(branchItems);
    }
  }

  for (const admin of admins ?? []) {
    const { data: userData } = await supabase.auth.admin.getUserById(admin.id);
    const email = userData?.user?.email;
    if (!email) continue;

    try {
      const ok = await sendReminderDigest(email, items);
      if (ok) emailsSent += 1;
      else markFailed(items);
    } catch {
      markFailed(items);
    }
  }

  const toLog = items.filter((i) => delivered.get(itemKey(i)));

  if (toLog.length > 0) {
    await supabase.from("reminder_log").insert(
      toLog.map((i) => ({
        entity_type: i.entityType,
        entity_id: i.entityId,
        reminder_stage: i.stage,
        channel: "email",
      }))
    );
  }

  return NextResponse.json({ itemsFound: items.length, emailsSent, itemsLogged: toLog.length });
}
