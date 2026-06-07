import { Vendor, Invoice } from "../types.js";

interface VendorPortalViewProps {
  vendor: Vendor | undefined;
  invoices: Invoice[];
}

export default function VendorPortalView({ vendor, invoices }: VendorPortalViewProps) {
  if (!vendor) {
    return (
      <div className="max-w-[800px] mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-900">No vendor profile linked</h2>
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-8 pb-24">
      <h2 className="font-display text-2xl font-extrabold text-slate-900 mb-8">
        {vendor.name}
      </h2>

      <section className="bg-white border border-slate-200 rounded-2xl p-6 mb-8">
        <h3 className="font-bold text-slate-900 mb-4">Company Profile</h3>
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-xs text-slate-500 font-bold uppercase">Category</dt>
            <dd className="text-slate-900">{vendor.category}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500 font-bold uppercase">Contact</dt>
            <dd className="text-slate-900">{vendor.accountManager}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500 font-bold uppercase">Email</dt>
            <dd className="text-slate-900">{vendor.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500 font-bold uppercase">Phone</dt>
            <dd className="text-slate-900">{vendor.phone}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500 font-bold uppercase">Address</dt>
            <dd className="text-slate-900">{vendor.address}</dd>
          </div>
        </dl>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">My Invoices</h3>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase">
            <tr>
              <th className="px-6 py-3">Invoice ID</th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Amount</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.length > 0 ? (
              invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="px-6 py-4 text-xs font-bold">{inv.id}</td>
                  <td className="px-6 py-4 text-xs">{inv.date}</td>
                  <td className="px-6 py-4 text-xs font-bold">
                    ${inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        inv.status === "Paid"
                          ? "bg-emerald-50 text-emerald-700"
                          : inv.status === "Overdue"
                          ? "bg-rose-50 text-rose-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-400">
                  No invoices on record.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
