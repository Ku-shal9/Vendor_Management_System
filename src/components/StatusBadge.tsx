import type { Invoice } from "../types.js";

const STATUS_STYLES: Record<Invoice["status"], string> = {
  Paid: "bg-success-surface text-success-ink",
  Overdue: "bg-danger-surface text-danger-ink",
  Pending: "bg-surface-muted text-ink-muted",
};

interface StatusBadgeProps {
  status: Invoice["status"];
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-bold uppercase ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}
