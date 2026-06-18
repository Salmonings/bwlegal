import { Resend } from "resend";
import type { DueReminderItem } from "@/lib/reminders";
import { daysFromToday } from "@/lib/dates";

function renderItemsHtml(items: DueReminderItem[]) {
  const rows = items
    .map((i) => {
      const days = daysFromToday(i.expiryDate);
      const remaining = days < 0 ? `منتهية منذ ${Math.abs(days)} يوم` : `${days} يوم متبقٍ`;
      return `<tr><td>${i.branchName}</td><td>${i.label}</td><td>${i.expiryDate}</td><td>${remaining}</td></tr>`;
    })
    .join("");

  return `<table dir="rtl" border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
    <thead><tr><th>الفرع</th><th>المستند</th><th>تاريخ الانتهاء</th><th>الحالة</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

// Throws if Resend isn't configured — callers should fail loudly rather than
// silently mark reminders as sent when no email was actually delivered.
export async function sendReminderDigest(to: string, items: DueReminderItem[]): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.REMINDERS_FROM_EMAIL;
  if (!apiKey || !from) {
    throw new Error("RESEND_API_KEY / REMINDERS_FROM_EMAIL is not configured.");
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to,
    subject: `تذكير بالالتزام: ${items.length} مستند يحتاج إلى مراجعة`,
    html: renderItemsHtml(items),
  });

  return !error;
}
