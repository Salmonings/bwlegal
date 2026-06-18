import { cookies } from "next/headers";
import { en, type Dictionary } from "@/lib/i18n/en";
import { ar } from "@/lib/i18n/ar";

export type Locale = "en" | "ar";

const dictionaries: Record<Locale, Dictionary> = { en, ar };

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return cookieStore.get("locale")?.value === "ar" ? "ar" : "en";
}

export async function getDictionary(): Promise<{ locale: Locale; t: Dictionary }> {
  const locale = await getLocale();
  return { locale, t: dictionaries[locale] };
}

export function dirFor(locale: Locale) {
  return locale === "ar" ? "rtl" : "ltr";
}

// In RTL, a "back" arrow should point right, not left.
export function backArrow(locale: Locale) {
  return locale === "ar" ? "→" : "←";
}

export function forwardArrow(locale: Locale) {
  return locale === "ar" ? "←" : "→";
}
