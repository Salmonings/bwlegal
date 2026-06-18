"use client";

import { useTransition } from "react";
import { setLocaleAction } from "@/lib/actions/locale";
import type { Locale } from "@/lib/i18n";

export function LanguageToggle({ locale }: { locale: Locale }) {
  const [pending, startTransition] = useTransition();
  const next: Locale = locale === "en" ? "ar" : "en";

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => setLocaleAction(next))}
      className="rounded-full border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-cream-2 disabled:opacity-50"
    >
      {next === "ar" ? "العربية" : "English"}
    </button>
  );
}
