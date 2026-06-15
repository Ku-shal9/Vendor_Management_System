import { useState } from "react";
import { CreditCard } from "lucide-react";
import { Bill } from "../types.js";
import StripePaymentModal from "./StripePaymentModal.jsx";

interface PayViewProps {
  bills: Bill[];
  onPayBill: (billId: string) => Promise<boolean>;
}

export default function PayView({ bills, onPayBill }: PayViewProps) {
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const dueBills = bills.filter((b) => b.status === "Due");

  return (
    <div className="vms-page">
      <h1 className="vms-title mb-2">Pay Bills</h1>
      <p className="text-sm text-ink-muted mb-6">
        Enter card details in Stripe checkout (test mode).
      </p>

      <div className="vms-panel overflow-hidden">
        {dueBills.length === 0 ? (
          <p className="vms-empty">No due bills to pay.</p>
        ) : (
          <div className="vms-table-wrap">
            <table className="vms-table min-w-[720px]">
              <thead>
                <tr className="vms-table-head">
                  <th scope="col" className="px-6 py-3">Vendor</th>
                  <th scope="col" className="px-6 py-3">Bill</th>
                  <th scope="col" className="px-6 py-3">Amount</th>
                  <th scope="col" className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {dueBills.map((bill) => (
                  <tr key={bill.id} className="vms-table-row">
                    <td className="px-6 py-4 text-sm font-semibold text-ink">
                      {bill.vendorName}
                    </td>
                    <td className="px-6 py-4 text-sm text-ink-muted">{bill.id}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-ink">
                      ${bill.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedBill(bill)}
                        className="vms-btn-primary inline-flex items-center gap-2"
                      >
                        <CreditCard className="w-4 h-4" />
                        Pay with Stripe
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <StripePaymentModal
        bill={selectedBill}
        open={!!selectedBill}
        onClose={() => setSelectedBill(null)}
        onPayBill={onPayBill}
      />
    </div>
  );
}
