import { useState, FormEvent } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ShoppingCart,
  Calendar,
  Download,
} from "lucide-react";
import {
  getDueDateRange,
  sanitizeSearch,
  todayIsoDate,
  validateDueDate,
  validateMoney,
  validateRequiredText,
} from "../utils/validation.js";
import { Invoice, Vendor, PurchaseRequest } from "../types.js";
import EmptyState from "./EmptyState.jsx";
import StatusBadge from "./StatusBadge.jsx";
import Modal from "./Modal.jsx";
import { useConfirm } from "../context/ConfirmContext.js";
import { useToast } from "../context/ToastContext.js";

interface PaymentsViewProps {
  invoices: Invoice[];
  vendors: Vendor[];
  purchases: PurchaseRequest[];
  onAddInvoice: (invoice: Partial<Invoice>) => void;
  onUpdateInvoice: (id: string, updates: Partial<Invoice>) => void;
  onDeleteInvoice: (id: string) => void;
  onAddPurchase: (purchase: Partial<PurchaseRequest>) => void;
  onUpdatePurchase: (id: string, updates: Partial<PurchaseRequest>) => void;
  onDeletePurchase: (id: string) => void;
}

export default function PaymentsView({
  invoices,
  vendors,
  purchases,
  onAddInvoice,
  onUpdateInvoice,
  onDeleteInvoice,
  onAddPurchase,
  onUpdatePurchase,
  onDeletePurchase,
}: PaymentsViewProps) {
  const confirm = useConfirm();
  const { pushToast } = useToast();
  const today = todayIsoDate();
  const dueDateRange = getDueDateRange();
  const [activeTab, setActiveTab] = useState<"invoices" | "purchases">(
    "invoices",
  );

  // Invoices state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState(
    vendors[0]?.id || "",
  );
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(today);
  const [invoiceDueDate, setInvoiceDueDate] = useState("");
  const [invoiceDueDateError, setInvoiceDueDateError] = useState("");
  const [invoiceStatus, setInvoiceStatus] =
    useState<Invoice["status"]>("Pending");
  const [searchInvoices, setSearchInvoices] = useState("");

  // Purchases state
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [purchaseVendorId, setPurchaseVendorId] = useState(
    vendors[0]?.id || "",
  );
  const [purchaseQuantities, setPurchaseQuantities] = useState<
    Record<string, string>
  >({});
  const [searchPurchases, setSearchPurchases] = useState("");

  // Invoices calculation
  const pendingCount = invoices.filter((i) => i.status === "Pending").length;
  const overdueCount = invoices.filter((i) => i.status === "Overdue").length;
  const totalPending = invoices
    .filter((i) => i.status !== "Paid")
    .reduce((sum, i) => sum + i.amount, 0);

  // Purchases calculation
  const totalPurchaseAmt = purchases.reduce(
    (sum, prq) => sum + prq.totalAmount,
    0,
  );
  const pendingPurchases = purchases.filter(
    (p) => p.status === "Pending",
  ).length;

  const handleAmountChange = (val: string) => {
    // Only allow positive numbers with up to 2 decimal places, block exponent, signs (+, -, e)
    let sanitized = val.replace(/[^0-9.]/g, "");
    const parts = sanitized.split(".");
    if (parts.length > 2) {
      sanitized = `${parts[0]}.${parts.slice(1).join("")}`;
    }
    setInvoiceAmount(sanitized);
  };

  const openCreate = () => {
    setEditingId(null);
    setInvoiceAmount("");
    setInvoiceDate(new Date().toISOString().split("T")[0]);
    setInvoiceDueDate("");
    setInvoiceDueDateError("");
    setInvoiceStatus("Pending");
    setSelectedVendorId(vendors[0]?.id || "");
    setShowForm(true);
  };

  const openEdit = (inv: Invoice) => {
    setEditingId(inv.id);
    setSelectedVendorId(inv.vendorId);
    setInvoiceAmount(String(inv.amount));
    setInvoiceDate(inv.date);
    setInvoiceDueDate(inv.dueDate || "");
    setInvoiceDueDateError("");
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

  const handleDownloadInvoice = async (inv: Invoice) => {
    try {
      const response = await fetch(
        `/api/invoices/${encodeURIComponent(inv.id)}/pdf`,
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Invoice download failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${inv.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      pushToast("Invoice PDF downloaded");
    } catch (error) {
      pushToast(
        error instanceof Error ? error.message : "Invoice download failed",
        "error",
      );
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const vendor = vendors.find((v) => v.id === selectedVendorId);
    if (!vendor || !invoiceAmount) return;

    const dueDateError = validateDueDate(invoiceDueDate, "Due date");
    if (dueDateError) {
      setInvoiceDueDateError(dueDateError);
      return;
    }

    const payload = {
      vendorId: vendor.id,
      vendorName: vendor.name,
      amount: parseFloat(invoiceAmount),
      date: invoiceDate,
      dueDate: invoiceDueDate,
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
      inv.id.toLowerCase().includes(searchInvoices.toLowerCase()),
  );

  // Purchases logic
  const selectedPurchaseVendor = vendors.find((v) => v.id === purchaseVendorId);
  const purchaseItemsCatalog = selectedPurchaseVendor?.items || [];

  const handleQuantityChange = (itemName: string, val: string) => {
    // Digits only, no decimals, signs, or exponents
    const sanitized = val.replace(/[^0-9]/g, "");
    setPurchaseQuantities((prev) => ({
      ...prev,
      [itemName]: sanitized,
    }));
  };

  // Calculate live total for purchase modal
  const purchaseTotal = purchaseItemsCatalog.reduce((sum, item) => {
    const qty = parseInt(purchaseQuantities[item.name] || "0", 10);
    return sum + item.price * qty;
  }, 0);

  const openPurchaseCreate = () => {
    setPurchaseVendorId(vendors[0]?.id || "");
    setPurchaseQuantities({});
    setShowPurchaseForm(true);
  };

  const handlePurchaseSubmit = (e: FormEvent) => {
    e.preventDefault();
    const vendor = vendors.find((v) => v.id === purchaseVendorId);
    if (!vendor) return;

    const orderedItems = (vendor.items || [])
      .map((item) => {
        const quantity = parseInt(purchaseQuantities[item.name] || "0", 10);
        return { name: item.name, price: item.price, quantity };
      })
      .filter((i) => i.quantity > 0);

    if (orderedItems.length === 0) {
      pushToast(
        "Select at least one item with a quantity greater than zero.",
        "error",
      );
      return;
    }

    const payload: Partial<PurchaseRequest> = {
      vendorId: vendor.id,
      vendorName: vendor.name,
      items: orderedItems,
      totalAmount: purchaseTotal,
      status: "Pending",
    };

    onAddPurchase(payload);
    setShowPurchaseForm(false);
  };

  const handlePurchaseDelete = async (req: PurchaseRequest) => {
    const confirmed = await confirm({
      title: "Delete purchase request",
      message: `Delete purchase request ${req.id} to ${req.vendorName}? This cannot be undone.`,
      confirmLabel: "Delete request",
      destructive: true,
    });
    if (!confirmed) return;
    onDeletePurchase(req.id);
  };

  const handlePurchaseStatusToggle = async (req: PurchaseRequest) => {
    const nextStatusMap: Record<
      PurchaseRequest["status"],
      PurchaseRequest["status"]
    > = {
      Pending: "Approved",
      Approved: "Delivered",
      Rejected: "Pending",
      Delivered: "Pending",
    };
    const nextStatus = nextStatusMap[req.status];

    const confirmed = await confirm({
      title: "Update Purchase Request Status",
      message: `Change request status from "${req.status}" to "${nextStatus}"?`,
      confirmLabel: "Update Status",
    });
    if (!confirmed) return;

    onUpdatePurchase(req.id, { status: nextStatus });
  };

  const filteredPurchases = purchases.filter(
    (prq) =>
      prq.vendorName.toLowerCase().includes(searchPurchases.toLowerCase()) ||
      prq.id.toLowerCase().includes(searchPurchases.toLowerCase()),
  );

  return (
    <div className="vms-page">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="vms-title mb-0">Finance Portal</h1>
        {activeTab === "invoices" ? (
          <button
            type="button"
            onClick={openCreate}
            disabled={vendors.length === 0}
            className="vms-btn-primary"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Add invoice
          </button>
        ) : (
          <button
            type="button"
            onClick={openPurchaseCreate}
            disabled={vendors.length === 0}
            className="vms-btn-primary"
          >
            <ShoppingCart className="w-4 h-4" aria-hidden="true" />
            Request purchase
          </button>
        )}
      </div>

      {/* Tab bar navigation */}
      <div className="flex gap-6 border-b border-border mb-6">
        <button
          type="button"
          onClick={() => setActiveTab("invoices")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors focus-visible:outline-none ${
            activeTab === "invoices"
              ? "border-primary text-primary"
              : "border-transparent text-ink-muted hover:text-ink"
          }`}
        >
          Invoices & Payments
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("purchases")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors focus-visible:outline-none ${
            activeTab === "purchases"
              ? "border-primary text-primary"
              : "border-transparent text-ink-muted hover:text-ink"
          }`}
        >
          Purchase Requests
        </button>
      </div>

      {activeTab === "invoices" ? (
        <>
          <div className="vms-summary-bar">
            <span>
              Outstanding:{" "}
              <span className="font-semibold text-ink">
                $
                {totalPending.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </span>
            <span aria-hidden="true" className="text-border">
              |
            </span>
            <span>
              Pending:{" "}
              <span className="font-semibold text-ink">{pendingCount}</span>
            </span>
            <span aria-hidden="true" className="text-border">
              |
            </span>
            <span>
              Overdue:{" "}
              <span className="font-semibold text-danger-ink">
                {overdueCount}
              </span>
            </span>
          </div>

          <div className="relative mb-4 max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Search invoices"
              value={searchInvoices}
              onChange={(e) => setSearchInvoices(e.target.value)}
              className="vms-input pl-9"
            />
          </div>

          <div className="vms-panel overflow-hidden">
            {filteredInvoices.length === 0 ? (
              <EmptyState
                title={
                  searchInvoices
                    ? "No matching invoices"
                    : "No invoices on record"
                }
                description={
                  searchInvoices
                    ? "Try searching by vendor name or invoice ID."
                    : "Created invoices will appear here for finance tracking."
                }
              />
            ) : (
              <div className="vms-table-wrap">
                <table className="vms-table min-w-[720px]">
                  <thead>
                    <tr className="vms-table-head">
                      <th scope="col" className="px-6 py-3">
                        Vendor / ID
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Due Date
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Amount
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="vms-table-row">
                        <td className="px-6 py-4 text-sm">
                          <div className="font-semibold text-ink">
                            {inv.vendorName}
                          </div>
                          <div className="text-xs text-ink-subtle">
                            {inv.id}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-ink-muted">
                          {inv.date}
                        </td>
                        <td className="px-6 py-4 text-sm text-ink-muted">
                          {inv.dueDate || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-ink">
                          $
                          {inv.amount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={inv.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleDownloadInvoice(inv)}
                              aria-label={`Download invoice ${inv.id}`}
                              className="p-2 text-ink-subtle hover:text-primary rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            >
                              <Download className="w-4 h-4" />
                            </button>
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
        </>
      ) : (
        <>
          <div className="vms-summary-bar">
            <span>
              Total Requested:{" "}
              <span className="font-semibold text-ink">
                $
                {totalPurchaseAmt.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </span>
            <span aria-hidden="true" className="text-border">
              |
            </span>
            <span>
              Pending approval:{" "}
              <span className="font-semibold text-ink">{pendingPurchases}</span>
            </span>
          </div>

          <div className="relative mb-4 max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Search purchase requests"
              value={searchPurchases}
              onChange={(e) => setSearchPurchases(e.target.value)}
              className="vms-input pl-9"
            />
          </div>

          <div className="vms-panel overflow-hidden">
            {filteredPurchases.length === 0 ? (
              <EmptyState
                title={
                  searchPurchases
                    ? "No matching purchase requests"
                    : "No purchase requests"
                }
                description={
                  searchPurchases
                    ? "Try searching by vendor name or request ID."
                    : "Purchase requests created for approved vendors will appear here."
                }
              />
            ) : (
              <div className="vms-table-wrap">
                <table className="vms-table min-w-[720px]">
                  <thead>
                    <tr className="vms-table-head">
                      <th scope="col" className="px-6 py-3">
                        Vendor / PRQ ID
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Items Requested
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Total Amount
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {filteredPurchases.map((prq) => (
                      <tr key={prq.id} className="vms-table-row">
                        <td className="px-6 py-4 text-sm">
                          <div className="font-semibold text-ink">
                            {prq.vendorName}
                          </div>
                          <div className="text-xs text-ink-subtle">
                            {prq.id}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-ink-muted">
                          {prq.date}
                        </td>
                        <td className="px-6 py-4 text-xs text-ink-muted">
                          <ul className="list-disc pl-4 space-y-0.5">
                            {prq.items.map((item, index) => (
                              <li key={index}>
                                <span className="font-semibold text-ink">
                                  {item.name}
                                </span>{" "}
                                x {item.quantity} (${item.price})
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-ink">
                          $
                          {prq.totalAmount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => handlePurchaseStatusToggle(prq)}
                            className="focus:outline-none"
                            title="Click to toggle status"
                          >
                            <StatusBadge status={prq.status} />
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handlePurchaseDelete(prq)}
                            aria-label={`Delete purchase request ${prq.id}`}
                            className="p-2 text-ink-subtle hover:text-danger-ink rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger-ink"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Invoice modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        titleId="invoice-form-title"
        className="vms-panel p-6 max-w-md w-full shadow-xl"
      >
        <h2 id="invoice-form-title" className="font-bold text-ink mb-4">
          {editingId ? "Edit invoice" : "New invoice"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="invoice-vendor" className="vms-label mb-1">
              Vendor
            </label>
            <select
              id="invoice-vendor"
              value={selectedVendorId}
              onChange={(e) => setSelectedVendorId(e.target.value)}
              className="vms-input"
              required
            >
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="invoice-amount" className="vms-label mb-1">
              Amount (USD)
            </label>
            <input
              id="invoice-amount"
              type="text"
              inputMode="decimal"
              value={invoiceAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="vms-input"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="invoice-date" className="vms-label mb-1">
                Date
              </label>
              <input
                id="invoice-date"
                type="date"
                value={invoiceDate}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value >= today) {
                    setInvoiceDate(value);
                  }
                }}
                className="vms-input"
                min={today}
                required
              />
            </div>
            <div>
              <label htmlFor="invoice-due-date" className="vms-label mb-1">
                Due Date
              </label>
              <input
                id="invoice-due-date"
                type="date"
                value={invoiceDueDate}
                onChange={(e) => {
                  setInvoiceDueDate(e.target.value);
                  setInvoiceDueDateError("");
                }}
                min={dueDateRange.min}
                max={dueDateRange.max}
                className="vms-input"
                required
              />
              <p className="mt-1 text-xs text-ink-muted">
                Choose a date from {dueDateRange.min} to {dueDateRange.max}.
              </p>
              {invoiceDueDateError && (
                <p role="alert" className="vms-alert-error text-xs mt-1">
                  {invoiceDueDateError}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="invoice-status" className="vms-label mb-1">
                Status
              </label>
              <select
                id="invoice-status"
                value={invoiceStatus}
                onChange={(e) =>
                  setInvoiceStatus(e.target.value as Invoice["status"])
                }
                className="vms-input"
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="vms-btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="vms-btn-primary">
              {editingId ? "Save changes" : "Create invoice"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Purchase Request Modal */}
      <Modal
        open={showPurchaseForm}
        onClose={() => setShowPurchaseForm(false)}
        titleId="purchase-form-title"
        className="vms-panel p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <h2
          id="purchase-form-title"
          className="font-bold text-ink mb-4 flex items-center gap-2"
        >
          <ShoppingCart className="w-5 h-5 text-primary" />
          <span>Request Purchase</span>
        </h2>
        <form onSubmit={handlePurchaseSubmit} className="space-y-4">
          <div>
            <label htmlFor="purchase-vendor" className="vms-label mb-1">
              Vendor *
            </label>
            <select
              id="purchase-vendor"
              value={purchaseVendorId}
              onChange={(e) => {
                setPurchaseVendorId(e.target.value);
                setPurchaseQuantities({});
              }}
              className="vms-input"
              required
            >
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3 pt-2">
            <label className="vms-label">Catalog Items</label>
            {purchaseItemsCatalog.length === 0 ? (
              <p className="text-sm text-ink-muted italic py-3">
                This vendor has no catalog items listed.
              </p>
            ) : (
              <div className="space-y-2 border border-border-subtle rounded-xl p-3 bg-surface-muted max-h-[280px] overflow-y-auto">
                {purchaseItemsCatalog.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between gap-4 p-2.5 bg-surface border border-border-subtle rounded-lg"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-primary font-bold mt-0.5">
                        ${item.price.toFixed(2)}
                      </p>
                      {item.description && (
                        <p className="text-[11px] text-ink-subtle mt-0.5 truncate">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs text-ink-muted font-medium">
                        Qty:
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={purchaseQuantities[item.name] || ""}
                        onChange={(e) =>
                          handleQuantityChange(item.name, e.target.value)
                        }
                        className="w-16 px-2 py-1 text-center bg-surface border border-border rounded-lg text-sm outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <div>
              <span className="text-xs font-bold text-ink-subtle uppercase tracking-wider">
                Estimated Total
              </span>
              <p className="text-xl font-extrabold text-ink">
                $
                {purchaseTotal.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowPurchaseForm(false)}
                className="vms-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={purchaseTotal === 0}
                className="vms-btn-primary whitespace-nowrap"
              >
                Submit request
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
