import { useState, FormEvent } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { Invoice, Vendor } from "../types.js";
import StatusBadge from "./StatusBadge.jsx";
import Modal from "./Modal.jsx";
import { useConfirm } from "../context/ConfirmContext.js";

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
  const confirm = useConfirm();
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

  const handleDelete = async (inv: Invoice) => {
    const confirmed = await confirm({
      title: "Delete invoice",
      message: `Delete invoice ${inv.id} for ${inv.vendorName}? This cannot be undone.`,
      confirmLabel: "Delete invoice",
      destructive: true,
    });
    if (!confirmed) return;
    onDeleteInvoice(inv.id);
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
    <div className="vms-page">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="vms-title mb-0">Invoices & Payments</h1>
        <button type="button" onClick={openCreate} disabled={vendors.length === 0} className="vms-btn-primary">
          <Plus className="w-4 h-4" aria-hidden="true" />
          Add invoice
        </button>
      </div>

      <div className="vms-summary-bar">
        <span>
          Outstanding:{" "}
          <span className="font-semibold text-ink">
            ${totalPending.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </span>
        <span aria-hidden="true" className="text-border">|</span>
        <span>
          Pending: <span className="font-semibold text-ink">{pendingCount}</span>
        </span>
        <span aria-hidden="true" className="text-border">|</span>
        <span>
          Overdue: <span className="font-semibold text-danger-ink">{overdueCount}</span>
        </span>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" aria-hidden="true" />
        <input
          type="search"
          aria-label="Search invoices"
          placeholder="Search invoices..."
          value={searchInvoices}
          onChange={(e) => setSearchInvoices(e.target.value)}
          className="vms-input pl-9"
        />
      </div>

      <div className="vms-panel overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <p className="vms-empty">
            {searchInvoices ? "No invoices match your search." : "No invoices on record yet."}
          </p>
        ) : (
          <div className="vms-table-wrap">
            <table className="vms-table min-w-[720px]">
              <thead>
                <tr className="vms-table-head">
                  <th scope="col" className="px-6 py-3">Vendor / ID</th>
                  <th scope="col" className="px-6 py-3">Date</th>
                  <th scope="col" className="px-6 py-3">Amount</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="vms-table-row">
                    <td className="px-6 py-4 text-sm">
                      <div className="font-semibold text-ink">{inv.vendorName}</div>
                      <div className="text-xs text-ink-subtle">{inv.id}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-ink-muted">{inv.date}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-ink">
                      ${inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(inv)}
                          aria-label={`Edit invoice ${inv.id}`}
                          className="p-2 text-ink-subtle hover:text-primary rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(inv)}
                          aria-label={`Delete invoice ${inv.id}`}
                          className="p-2 text-ink-subtle hover:text-danger-ink rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger-ink"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} titleId="invoice-form-title" className="vms-panel p-6 max-w-md w-full shadow-xl">
            <h2 id="invoice-form-title" className="font-bold text-ink mb-4">
              {editingId ? "Edit invoice" : "New invoice"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="invoice-vendor" className="vms-label mb-1">Vendor</label>
                <select
                  id="invoice-vendor"
                  value={selectedVendorId}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                  className="vms-input"
                  required
                >
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="invoice-amount" className="vms-label mb-1">Amount (USD)</label>
                <input
                  id="invoice-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  className="vms-input"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="invoice-date" className="vms-label mb-1">Date</label>
                  <input
                    id="invoice-date"
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="vms-input"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="invoice-status" className="vms-label mb-1">Status</label>
                  <select
                    id="invoice-status"
                    value={invoiceStatus}
                    onChange={(e) => setInvoiceStatus(e.target.value as Invoice["status"])}
                    className="vms-input"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="vms-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="vms-btn-primary">
                  {editingId ? "Save changes" : "Create invoice"}
                </button>
              </div>
            </form>
      </Modal>
    </div>
  );
}
