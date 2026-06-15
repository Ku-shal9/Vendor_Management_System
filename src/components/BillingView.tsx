import { useState } from "react";
import { Search } from "lucide-react";
import { Bill } from "../types.js";
import StatusBadge from "./StatusBadge.jsx";

interface BillingViewProps {
  bills: Bill[];
}

export default function BillingView({ bills }: BillingViewProps) {
  const [activeTab, setActiveTab] = useState<"due" | "paid">("due");
  const [search, setSearch] = useState("");

  const filtered = bills
    .filter((b) => (activeTab === "due" ? b.status === "Due" : b.status === "Paid"))
    .filter(
      (b) =>
        b.vendorName.toLowerCase().includes(search.toLowerCase()) ||
        b.id.toLowerCase().includes(search.toLowerCase()),
    );

  const dueTotal = bills
    .filter((b) => b.status === "Due")
    .reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="vms-page">
      <h1 className="vms-title mb-6">Billing</h1>

      <div className="flex gap-6 border-b border-border mb-6">
        {(["due", "paid"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-semibold border-b-2 capitalize ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "due" && (
        <div className="vms-summary-bar mb-4">
          Outstanding:{" "}
          <span className="font-semibold text-ink">
            ${dueTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      )}

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
        <input
          type="search"
          aria-label="Search bills"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="vms-input pl-9"
        />
      </div>

      <div className="vms-panel overflow-hidden">
        {filtered.length === 0 ? (
          <p className="vms-empty">No {activeTab} bills.</p>
        ) : (
          <div className="vms-table-wrap">
            <table className="vms-table min-w-[720px]">
              <thead>
                <tr className="vms-table-head">
                  <th scope="col" className="px-6 py-3">Vendor / Bill</th>
                  <th scope="col" className="px-6 py-3">PRQ</th>
                  <th scope="col" className="px-6 py-3">Date</th>
                  <th scope="col" className="px-6 py-3">Amount</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  {activeTab === "paid" && (
                    <th scope="col" className="px-6 py-3">Invoice</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filtered.map((bill) => (
                  <tr key={bill.id} className="vms-table-row">
                    <td className="px-6 py-4 text-sm">
                      <div className="font-semibold text-ink">{bill.vendorName}</div>
                      <div className="text-xs text-ink-subtle">{bill.id}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-ink-muted">{bill.purchaseRequestId}</td>
                    <td className="px-6 py-4 text-sm text-ink-muted">{bill.date}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-ink">
                      ${bill.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={bill.status} />
                    </td>
                    {activeTab === "paid" && (
                      <td className="px-6 py-4 text-sm text-ink-muted">{bill.invoiceId || "—"}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
