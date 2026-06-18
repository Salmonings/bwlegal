import { daysFromToday } from "@/lib/dates";

export type ReminderStage = "60" | "30" | "7" | "expired";

// The single most urgent stage currently crossed for this expiry date, or
// null if it's further out than the 60-day warning window.
export function computeReminderStage(expiryDate: string | null): ReminderStage | null {
  if (!expiryDate) return null;
  const days = daysFromToday(expiryDate);
  if (days <= 0) return "expired";
  if (days <= 7) return "7";
  if (days <= 30) return "30";
  if (days <= 60) return "60";
  return null;
}
