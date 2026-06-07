import { useState, FormEvent } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { Invoice, Vendor } from "../types.js";

interface PaymentsViewProps {
  invoices: Invoice[];
  vendors: Vendor[];
  onAddInvoice: (invoice: Partial<Invoice>) => void;
  onUpdateInvoice: (id: string, updates: Partial<Invoice>) => void;
  onDeleteInvoice: (id: string) => void;
}

export default function PaymentsView({
  invoices,
  vendors,
  onAddInvoice,
  onUpdateInvoice,
  onDeleteInvoice,
}: PaymentsViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState(vendors[0]?.id || "");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [invoiceStatus, setInvoiceStatus] = useState<Invoice["status"]>("Pending");
  const [searchInvoices, setSearchInvoices] = useState("");

  const pendingCount = invoices.filter((i) => i.status === "Pending").length;
  const overdueCount = invoices.filter((i) => i.status === "Overdue").length;
  const totalPending = invoices
    .filter((i) => i.status !== "Paid")
    .reduce((sum, i) => sum + i.amount, 0);

  const openCreate = () => {
    setEditingId(null);
    setInvoiceAmount("");
    setInvoiceDate(new Date().toISOString().split("T")[0]);
    setInvoiceStatus("Pending");
    setSelectedVendorId(vendors[0]?.id || "");
    setShowForm(true);
  };

  const openEdit = (inv: Invoice) => {
    setEditingId(inv.id);
    setSelectedVendorId(inv.vendorId);
    setInvoiceAmount(String(inv.amount));
    setInvoiceDate(inv.date);
    setInvoiceStatus(inv.status);
    setShowForm(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const vendor = vendors.find((v) => v.id === selectedVendorId);
    if (!vendor || !invoiceAmount) return;

    const payload = {
      vendorId: vendor.id,
      vendorName: vendor.name,
      amount: parseFloat(invoiceAmount),
      date: invoiceDate,
      status: invoiceStatus,
    };

    if (editingId) {
      onUpdateInvoice(editingId, payload);
    } else {
      onAddInvoice(payload);
    }
    setShowForm(false);
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.vendorName.toLowerCase().includes(searchInvoices.toLowerCase()) ||
      inv.id.toLowerCase().includes(searchInvoices.toLowerCase())
  );

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8 pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="font-display text-2xl font-extrabold text-slate-900">Invoices & Payments</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-slate-200 p-6 rounded-2xl">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Outstanding Balance</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-2">
            ${totalPending.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h3>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-2xl">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Pending</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-2">{pendingCount}</h3>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-2xl">
          <p className="text-[10px] font-bold text-rose-600 uppercase">Overdue</p>
          <h3 className="text-2xl font-extrabold text-rose-600 mt-2">{overdueCount}</h3>
        </div>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search invoices..."
          value={searchInvoices}
          onChange={(e) => setSearchInvoices(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase">
            <tr>
              <th className="p-4">Vendor / ID</th>
              <th className="p-4">Date</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredInvoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-50">
                <td className="p-4 text-xs">
                  <div className="font-bold text-slate-900">{inv.vendorName}</div>
                  <div className="text-[10px] text-slate-400">{inv.id}</div>
                </td>
                <td className="p-4 text-xs text-slate-600">{inv.date}</td>
                <td className="p-4 text-xs font-bold">
                  ${inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="p-4">
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
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEdit(inv)} className="p-1.5 text-slate-500 hover:text-blue-600">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDeleteInvoice(inv.id)} className="p-1.5 text-slate-500 hover:text-rose-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="font-bold text-slate-900 mb-4">
              {editingId ? "Edit Invoice" : "New Invoice"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Vendor</label>
                <select
                  value={selectedVendorId}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  required
                >
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Date</label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Status</label>
                  <select
                    value={invoiceStatus}
                    onChange={(e) => setInvoiceStatus(e.target.value as Invoice["status"])}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-xl text-sm">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold">
                  {editingId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
