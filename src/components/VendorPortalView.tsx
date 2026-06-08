import { Vendor, Invoice } from "../types.js";
import StatusBadge from "./StatusBadge.jsx";

interface VendorPortalViewProps {
  vendor: Vendor | undefined;
  invoices: Invoice[];
}

export default function VendorPortalView({ vendor, invoices }: VendorPortalViewProps) {
  if (!vendor) {
    return (
      <div className="max-w-[800px] mx-auto px-4 py-16 text-center">
        <h1 className="font-display text-xl font-bold text-ink mb-2">No vendor profile linked</h1>
        <p className="text-sm text-ink-muted">
          Your account is not linked to a vendor record. Contact CLance Solutions admin for access.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-8 pb-24 md:pb-12">
      <h1 className="vms-title mb-8">{vendor.name}</h1>

      <section className="vms-panel p-6 mb-8">
        <h3 className="font-bold text-ink mb-4">Company profile</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {[
            { label: "Category", value: vendor.category },
            { label: "Contact", value: vendor.accountManager },
            { label: "Email", value: vendor.email },
            { label: "Phone", value: vendor.phone },
          ].map(({ label, value }) => (
            <div key={label}>
              <dt className="vms-label">{label}</dt>
              <dd className="text-ink mt-1">{value}</dd>
            </div>
          ))}
          <div className="sm:col-span-2">
            <dt className="vms-label">Address</dt>
            <dd className="text-ink mt-1">{vendor.address}</dd>
          </div>
        </dl>
      </section>

      <section className="vms-panel overflow-hidden">
        <div className="vms-panel-header">
          <h3 className="font-bold text-ink">My invoices</h3>
        </div>
        {invoices.length > 0 ? (
          <div className="vms-table-wrap">
            <table className="vms-table min-w-[560px]">
              <thead>
                <tr className="vms-table-head">
                  <th scope="col" className="px-6 py-3">Invoice ID</th>
                  <th scope="col" className="px-6 py-3">Date</th>
                  <th scope="col" className="px-6 py-3">Amount</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-6 py-4 text-sm font-semibold text-ink">{inv.id}</td>
                    <td className="px-6 py-4 text-sm text-ink-muted">{inv.date}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-ink">
                      ${inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={inv.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="vms-empty">No invoices on record.</p>
        )}
      </section>
    </div>
  );
}
