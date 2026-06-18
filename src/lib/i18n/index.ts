import { ar, type Dictionary } from "@/lib/i18n/ar";

export type { Dictionary };

export const t: Dictionary = ar;

export const DIR = "rtl" as const;

// App is Arabic-only and right-to-left, so "back" points right.
export const ARROW_BACK = "→";
export const ARROW_FORWARD = "←";
