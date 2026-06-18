export type DocumentStatus = "valid" | "expiring_soon" | "expired" | "missing" | "na";

const STATUS_STYLES: Record<DocumentStatus, string> = {
  valid: "bg-green-100 text-green-800",
  expiring_soon: "bg-amber-100 text-amber-800",
  expired: "bg-red-100 text-red-800",
  missing: "bg-gray-200 text-gray-700",
  na: "bg-gray-100 text-gray-500",
};

export const STATUS_LABELS: Record<DocumentStatus, string> = {
  valid: "Valid",
  expiring_soon: "Expiring soon",
  expired: "Expired",
  missing: "Missing",
  na: "N/A",
};

export const STATUS_DOT_COLOR: Record<DocumentStatus, string> = {
  valid: "bg-green-400",
  expiring_soon: "bg-amber-400",
  expired: "bg-red-500",
  missing: "bg-gray-300",
  na: "bg-gray-200",
};

export function StatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
