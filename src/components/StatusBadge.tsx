import type { Invoice, PurchaseRequest, Bill } from "../types.js";

type AllStatus = Invoice["status"] | PurchaseRequest["status"] | Bill["status"];

const STATUS_STYLES: Record<AllStatus, string> = {
  Paid: "bg-success-surface text-success-ink",
  Due: "bg-surface-muted text-ink-muted",
  Overdue: "bg-danger-surface text-danger-ink",
  Pending: "bg-surface-muted text-ink-muted",
  Approved: "bg-primary-tint text-primary",
  Rejected: "bg-danger-surface text-danger-ink",
  Delivered: "bg-success-surface text-success-ink",
};

interface StatusBadgeProps {
  status: AllStatus;
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
