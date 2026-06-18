import type { Dictionary } from "@/lib/i18n/en";

export type DocumentStatus = "valid" | "expiring_soon" | "expired" | "missing" | "na";

const STATUS_STYLES: Record<DocumentStatus, string> = {
  valid: "bg-green-100 text-green-800",
  expiring_soon: "bg-amber-100 text-amber-800",
  expired: "bg-red-100 text-red-800",
  missing: "bg-gray-200 text-gray-700",
  na: "bg-gray-100 text-gray-500",
};

export const STATUS_DOT_COLOR: Record<DocumentStatus, string> = {
  valid: "bg-green-400",
  expiring_soon: "bg-amber-400",
  expired: "bg-red-500",
  missing: "bg-gray-300",
  na: "bg-gray-200",
};

export function statusLabel(t: Dictionary, status: DocumentStatus) {
  return {
    valid: t.statusValid,
    expiring_soon: t.statusExpiringSoon,
    expired: t.statusExpired,
    missing: t.statusMissing,
    na: t.statusNa,
  }[status];
}

export function StatusBadge({ status, t }: { status: DocumentStatus; t: Dictionary }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {statusLabel(t, status)}
    </span>
  );
}
