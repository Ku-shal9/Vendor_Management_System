import { useState, FormEvent, useEffect } from "react";
import {
  Vendor,
  Invoice,
  PurchaseRequest,
  VendorItem,
  UserInfo,
} from "../types.js";
import type { VendorPortalTab } from "../config/roles.js";
import StatusBadge from "./StatusBadge.jsx";
import Modal from "./Modal.jsx";
import PhoneInput from "./PhoneInput.jsx";
import { Download, Plus, Pencil, Trash2, CheckCircle } from "lucide-react";
import {
  getPasswordStrength,
  validateStrongPassword,
} from "../utils/password.js";
import { getDueDateRange, validateDueDate } from "../utils/validation.js";
import { useConfirm } from "../context/ConfirmContext.js";
import { useToast } from "../context/ToastContext.js";

interface VendorPortalViewProps {
  vendor: Vendor | undefined;
  invoices: Invoice[];
  purchases: PurchaseRequest[];
  onUpdateVendor: (vendor: Vendor) => void;
  onUpdatePurchase: (id: string, updates: Partial<PurchaseRequest>) => void;
  user: UserInfo | null;
  activeTab: VendorPortalTab;
}

export default function VendorPortalView({
  vendor,
  invoices,
  purchases,
  onUpdateVendor,
  onUpdatePurchase,
  user,
  activeTab,
}: VendorPortalViewProps) {
  const confirm = useConfirm();
  const { pushToast } = useToast();

  // Profile Form State
  const [profileForm, setProfileForm] = useState<Vendor>(
    vendor || {
      id: "",
      name: "",
      category: "",
      accountManager: "",
      email: "",
      phone: "",
      address: "",
    },
  );

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [updatingPurchaseId, setUpdatingPurchaseId] = useState<string | null>(
    null,
  );
  const [showDeliverModal, setShowDeliverModal] = useState(false);
  const [deliverPurchaseId, setDeliverPurchaseId] = useState<string | null>(
    null,
  );
  const [deliverDueDate, setDeliverDueDate] = useState("");
  const [deliverError, setDeliverError] = useState("");

  const dueDateRange = getDueDateRange();
  const passwordStrength = getPasswordStrength(newPassword);
  const passwordStrengthClass = [
    "text-ink-subtle",
    "text-danger-ink",
    "text-danger-ink",
    "text-primary",
    "text-success-ink",
  ][passwordStrength.score];

  // Catalog Form State
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemDesc, setItemDesc] = useState("");

  useEffect(() => {
    if (activeTab === "profile" && vendor) {
      setProfileForm(vendor);
    }
  }, [activeTab, vendor]);

  if (!vendor) {
    return (
      <div className="max-w-[800px] mx-auto px-4 py-16 text-center">
        <h1 className="font-display text-xl font-bold text-ink mb-2">
          No vendor profile linked
        </h1>
        <p className="text-sm text-ink-muted">
          Your account is not linked to a vendor record. Contact CLance
          Solutions admin for access.
        </p>
      </div>
    );
  }

  // Filter purchases for this vendor
  const vendorPurchases = purchases.filter((p) => p.vendorId === vendor.id);

  // Invoices metrics
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const pendingInvoices = invoices.filter((i) => i.status === "Pending");
  const outstandingAmount = pendingInvoices.reduce(
    (sum, inv) => sum + inv.amount,
    0,
  );

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

  // Profile Update Submission
  const handleProfileSubmit = (e: FormEvent) => {
    e.preventDefault();
    onUpdateVendor(profileForm);
  };

  // Password change handler
  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (!user?.email) {
      setPasswordError("User not logged in");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    const strengthError = validateStrongPassword(newPassword, "Password");
    if (strengthError) {
      setPasswordError(strengthError);
      return;
    }

    const response = await fetch("/api/users/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        currentPassword,
        newPassword,
      }),
    });

    if (response.ok) {
      pushToast("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      const data = await response.json();
      setPasswordError(data.error || "Failed to update password");
    }
  };

  // Catalog item price validation
  const handlePriceChange = (val: string) => {
    let sanitized = val.replace(/[^0-9.]/g, "");
    const parts = sanitized.split(".");
    if (parts.length > 2) {
      sanitized = `${parts[0]}.${parts.slice(1).join("")}`;
    }
    setItemPrice(sanitized);
  };

  // Open item modal for add/edit
  const openItemModal = (index: number | null = null) => {
    if (index !== null) {
      const item = (vendor.items || [])[index];
      setItemName(item.name);
      setItemPrice(String(item.price));
      setItemDesc(item.description || "");
      setEditingItemIndex(index);
    } else {
      setItemName("");
      setItemPrice("");
      setItemDesc("");
      setEditingItemIndex(null);
    }
    setShowItemModal(true);
  };

  // Catalog Item Submission
  const handleItemSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!itemName || !itemPrice) return;

    const price = parseFloat(itemPrice);
    const newItem: VendorItem = {
      name: itemName,
      price,
      description: itemDesc || undefined,
    };

    const currentItems = vendor.items ? [...vendor.items] : [];

    if (editingItemIndex !== null) {
      currentItems[editingItemIndex] = newItem;
    } else {
      currentItems.push(newItem);
    }

    const updatedVendor = {
      ...vendor,
      items: currentItems,
    };

    onUpdateVendor(updatedVendor);
    setShowItemModal(false);
  };

  // Catalog Item Deletion
  const handleDeleteItem = async (index: number) => {
    const item = (vendor.items || [])[index];
    const confirmed = await confirm({
      title: "Remove Catalog Item",
      message: `Are you sure you want to remove "${item.name}" from your product catalog?`,
      confirmLabel: "Remove Item",
      destructive: true,
    });
    if (!confirmed) return;

    const currentItems = [...(vendor.items || [])];
    currentItems.splice(index, 1);

    const updatedVendor = {
      ...vendor,
      items: currentItems,
    };

    onUpdateVendor(updatedVendor);
  };

  // Update purchase request status
  const handleAcceptPurchase = async (reqId: string) => {
    if (updatingPurchaseId) return;

    setUpdatingPurchaseId(reqId);
    try {
      const confirmed = await confirm({
        title: "Accept Purchase Request",
        message: "Accept this purchase order request and start processing?",
        confirmLabel: "Accept Order",
      });
      if (!confirmed) return;

      await onUpdatePurchase(reqId, { status: "Approved" });
    } finally {
      setUpdatingPurchaseId(null);
    }
  };

  const openDeliverPurchase = (reqId: string) => {
    setDeliverPurchaseId(reqId);
    setDeliverDueDate("");
    setDeliverError("");
    setShowDeliverModal(true);
  };

  const handleDeliverPurchase = async () => {
    if (!deliverPurchaseId || updatingPurchaseId) return;

    const dueDateError = validateDueDate(deliverDueDate, "Due date");
    if (dueDateError) {
      setDeliverError(dueDateError);
      return;
    }

    setUpdatingPurchaseId(deliverPurchaseId);
    try {
      await onUpdatePurchase(deliverPurchaseId, {
        status: "Delivered",
        dueDate: deliverDueDate,
      });
      setShowDeliverModal(false);
      setDeliverPurchaseId(null);
      setDeliverDueDate("");
      setDeliverError("");
    } finally {
      setUpdatingPurchaseId(null);
    }
  };

  const renderPurchaseAction = (prq: PurchaseRequest) => {
    const isUpdatingPurchase = updatingPurchaseId === prq.id;

    if (prq.status === "Pending") {
      return (
        <button
          type="button"
          disabled={isUpdatingPurchase}
          onClick={() => handleAcceptPurchase(prq.id)}
          className="px-3 py-1.5 bg-success-ink text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isUpdatingPurchase ? "Accepting…" : "Accept Request"}
        </button>
      );
    }

    if (prq.status === "Approved") {
      return (
        <button
          type="button"
          disabled={isUpdatingPurchase}
          onClick={() => openDeliverPurchase(prq.id)}
          className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isUpdatingPurchase ? "Delivering…" : "Deliver Order"}
        </button>
      );
    }

    return (
      <span className="text-xs font-semibold text-ink-subtle flex items-center gap-1">
        <CheckCircle className="w-3.5 h-3.5 text-success-ink" /> Delivered
      </span>
    );
  };

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-8 pb-24 md:pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="vms-title mb-1">{vendor.name}</h1>
          <p className="text-sm text-ink-muted">
            Vendor Portal ID:{" "}
            <span className="font-semibold text-ink">{vendor.id}</span>
          </p>
        </div>
      </div>

      {/* Overview tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <section className="vms-panel p-6 md:col-span-2 space-y-4">
            <h3 className="font-bold text-ink mb-2">Company Overview</h3>
            <p className="text-sm text-ink-muted">
              Welcome to your Vendor Portal! You can track invoices, view
              incoming purchase requests, keep your catalog updated, and edit
              your profile settings.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-sm">
              <div>
                <dt className="vms-label">Account Representative</dt>
                <dd className="font-semibold text-ink mt-0.5">
                  {vendor.accountManager}
                </dd>
              </div>
              <div>
                <dt className="vms-label">Business Category</dt>
                <dd className="font-semibold text-ink mt-0.5">
                  {vendor.category}
                </dd>
              </div>
              <div>
                <dt className="vms-label">Business Address</dt>
                <dd className="font-semibold text-ink mt-0.5">
                  {vendor.address}
                </dd>
              </div>
              <div>
                <dt className="vms-label">Billing Email</dt>
                <dd className="font-semibold text-ink mt-0.5">
                  {vendor.email}
                </dd>
              </div>
            </div>
          </section>

          <section className="vms-panel p-6 space-y-4">
            <h3 className="font-bold text-ink mb-2">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border-subtle">
                <span className="text-sm text-ink-muted">
                  Invoices Submitted
                </span>
                <span className="text-sm font-bold text-ink">
                  {invoices.length}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border-subtle">
                <span className="text-sm text-ink-muted">
                  Outstanding Billings
                </span>
                <span className="text-sm font-bold text-ink">
                  ${outstandingAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border-subtle">
                <span className="text-sm text-ink-muted">
                  Total Paid to Date
                </span>
                <span className="text-sm font-bold text-success-ink">
                  ${(totalInvoiced - outstandingAmount).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-ink-muted">Active Purchases</span>
                <span className="text-sm font-bold text-ink">
                  {
                    vendorPurchases.filter(
                      (p) => p.status === "Pending" || p.status === "Approved",
                    ).length
                  }
                </span>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Invoices tab */}
      {activeTab === "invoices" && (
        <section className="vms-panel overflow-hidden">
          <div className="vms-panel-header">
            <h3 className="font-bold text-ink">
              Invoices Overview ({invoices.length})
            </h3>
          </div>
          {invoices.length > 0 ? (
            <div className="vms-table-wrap">
              <table className="vms-table min-w-[560px]">
                <thead>
                  <tr className="vms-table-head">
                    <th scope="col" className="px-6 py-3">
                      Invoice ID
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
                    <th scope="col" className="px-6 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="vms-table-row">
                      <td className="px-6 py-4 text-sm font-semibold text-ink">
                        {inv.id}
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
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleDownloadInvoice(inv)}
                          aria-label={`Download invoice ${inv.id}`}
                          className="p-2 text-ink-subtle hover:text-primary rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        >
                          <Download className="w-4 h-4" />
                        </button>
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
      )}

      {/* Purchase Requests tab */}
      {activeTab === "purchases" && (
        <section className="vms-panel overflow-hidden">
          <div className="vms-panel-header">
            <h3 className="font-bold text-ink">
              Purchase Requests from CLance ({vendorPurchases.length})
            </h3>
          </div>
          {vendorPurchases.length > 0 ? (
            <div className="vms-table-wrap">
              <table className="vms-table min-w-[640px]">
                <thead>
                  <tr className="vms-table-head">
                    <th scope="col" className="px-6 py-3">
                      Request ID
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Ordered Items
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Total Cost
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
                  {vendorPurchases.map((prq) => (
                    <tr key={prq.id} className="vms-table-row">
                      <td className="px-6 py-4 text-sm font-semibold text-ink">
                        {prq.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-ink-muted">
                        {prq.date}
                      </td>
                      <td className="px-6 py-4 text-xs text-ink-muted">
                        <ul className="list-disc pl-4 space-y-0.5">
                          {prq.items.map((it, idx) => (
                            <li key={idx}>
                              <span className="font-semibold text-ink">
                                {it.name}
                              </span>{" "}
                              x {it.quantity} (${it.price})
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-ink">
                        ${prq.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={prq.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {renderPurchaseAction(prq)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="vms-empty">No purchase requests received yet.</p>
          )}
        </section>
      )}

      {/* Deliver Purchase Order Modal */}
      <Modal
        open={showDeliverModal}
        onClose={() => setShowDeliverModal(false)}
        titleId="deliver-purchase-title"
        className="vms-panel p-6 max-w-md w-full shadow-xl"
      >
        <h2 id="deliver-purchase-title" className="font-bold text-ink mb-4">
          Deliver Purchase Order
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleDeliverPurchase();
          }}
          className="space-y-4"
        >
          <p className="text-sm text-ink-muted">
            Select the payment due date for this delivered order.
          </p>
          <div>
            <label htmlFor="deliver-due-date" className="vms-label mb-1">
              Due Date *
            </label>
            <input
              id="deliver-due-date"
              type="date"
              required
              value={deliverDueDate}
              onChange={(e) => {
                setDeliverDueDate(e.target.value);
                setDeliverError("");
              }}
              min={dueDateRange.min}
              max={dueDateRange.max}
              className="vms-input"
            />
            <p className="mt-1 text-xs text-ink-muted">
              Choose a date from {dueDateRange.min} to {dueDateRange.max}.
            </p>
          </div>
          {deliverError && (
            <p role="alert" className="vms-alert-error">
              {deliverError}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowDeliverModal(false)}
              className="vms-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updatingPurchaseId !== null}
              className="vms-btn-primary"
            >
              {updatingPurchaseId ? "Delivering…" : "Deliver Order"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Catalog tab */}
      {activeTab === "catalog" && (
        <section className="vms-panel overflow-hidden">
          <div className="vms-panel-header flex items-center justify-between">
            <h3 className="font-bold text-ink">
              My Products & Services ({vendor.items?.length || 0})
            </h3>
            <button
              type="button"
              onClick={() => openItemModal()}
              className="vms-btn-primary py-1.5 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add item
            </button>
          </div>
          {!vendor.items || vendor.items.length === 0 ? (
            <p className="vms-empty">
              No items listed in your catalog. Add items so CLance can request
              purchases.
            </p>
          ) : (
            <div className="vms-table-wrap">
              <table className="vms-table min-w-[600px]">
                <thead>
                  <tr className="vms-table-head">
                    <th scope="col" className="px-6 py-3">
                      Item Name
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Description
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {vendor.items.map((item, index) => (
                    <tr key={index} className="vms-table-row">
                      <td className="px-6 py-4 text-sm font-semibold text-ink">
                        {item.name}
                      </td>
                      <td
                        className="px-6 py-4 text-sm text-ink-muted max-w-[280px] truncate"
                        title={item.description}
                      >
                        {item.description || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-primary">
                        ${item.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openItemModal(index)}
                            aria-label={`Edit ${item.name}`}
                            className="p-1.5 text-ink-subtle hover:text-primary rounded"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(index)}
                            aria-label={`Delete ${item.name}`}
                            className="p-1.5 text-ink-subtle hover:text-danger-ink rounded"
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
        </section>
      )}

      {/* Profile Settings tab */}
      {activeTab === "profile" && (
        <section className="vms-panel p-6">
          <h3 className="font-bold text-ink mb-6">Company Profile Settings</h3>
          <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="prof-name" className="vms-label mb-1">
                  Company legal name *
                </label>
                <input
                  id="prof-name"
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, name: e.target.value })
                  }
                  className="vms-input"
                />
              </div>
              <div>
                <label htmlFor="prof-category" className="vms-label mb-1">
                  Business category *
                </label>
                <input
                  id="prof-category"
                  type="text"
                  required
                  value={profileForm.category}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, category: e.target.value })
                  }
                  className="vms-input"
                />
              </div>
              <div>
                <label htmlFor="prof-manager" className="vms-label mb-1">
                  Account manager *
                </label>
                <input
                  id="prof-manager"
                  type="text"
                  required
                  value={profileForm.accountManager}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      accountManager: e.target.value,
                    })
                  }
                  className="vms-input"
                />
              </div>
              <div>
                <label htmlFor="prof-email" className="vms-label mb-1">
                  Corporate billing email *
                </label>
                <input
                  id="prof-email"
                  type="email"
                  required
                  value={profileForm.email}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, email: e.target.value })
                  }
                  className="vms-input"
                />
              </div>
              <PhoneInput
                id="prof-phone"
                label="Business phone number"
                required
                value={profileForm.phone}
                maxLength={30}
                onChange={(value) =>
                  setProfileForm({ ...profileForm, phone: value })
                }
              />
              <div>
                <label htmlFor="prof-address" className="vms-label mb-1">
                  Office address *
                </label>
                <input
                  id="prof-address"
                  type="text"
                  required
                  value={profileForm.address}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, address: e.target.value })
                  }
                  className="vms-input"
                />
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button type="submit" className="vms-btn-primary px-6">
                Save Profile Settings
              </button>
            </div>
          </form>

          {/* Password Change Section */}
          <div className="mt-8 pt-6 border-t border-border">
            <h4 className="font-bold text-ink mb-4">Change Password</h4>
            <form
              onSubmit={handlePasswordSubmit}
              className="space-y-4 max-w-md"
            >
              <div>
                <label htmlFor="current-password" className="vms-label mb-1">
                  Current Password *
                </label>
                <input
                  id="current-password"
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="vms-input"
                />
              </div>
              <div>
                <label htmlFor="new-password" className="vms-label mb-1">
                  New Password *
                </label>
                <input
                  id="new-password"
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="vms-input"
                />
              </div>
              {newPassword && (
                <p className="text-xs text-ink-muted">
                  Password strength:{" "}
                  <span className={`font-semibold ${passwordStrengthClass}`}>
                    {passwordStrength.label}
                  </span>
                </p>
              )}
              <div>
                <label htmlFor="confirm-password" className="vms-label mb-1">
                  Confirm New Password *
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="vms-input"
                />
              </div>
              {passwordError && (
                <p className="text-sm text-danger-ink">{passwordError}</p>
              )}
              <div className="flex justify-end pt-2">
                <button type="submit" className="vms-btn-secondary px-4">
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* Catalog Add/Edit Modal */}
      <Modal
        open={showItemModal}
        onClose={() => setShowItemModal(false)}
        titleId="item-modal-title"
        className="vms-panel p-6 max-w-md w-full shadow-xl"
      >
        <h2 id="item-modal-title" className="font-bold text-ink mb-4">
          {editingItemIndex !== null ? "Edit catalog item" : "Add catalog item"}
        </h2>
        <form onSubmit={handleItemSubmit} className="space-y-4">
          <div>
            <label htmlFor="item-name-input" className="vms-label mb-1">
              Item Name *
            </label>
            <input
              id="item-name-input"
              type="text"
              required
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="vms-input"
            />
          </div>
          <div>
            <label htmlFor="item-price-input" className="vms-label mb-1">
              Price (USD) *
            </label>
            <input
              id="item-price-input"
              type="text"
              inputMode="decimal"
              required
              value={itemPrice}
              onChange={(e) => handlePriceChange(e.target.value)}
              className="vms-input"
            />
          </div>
          <div>
            <label htmlFor="item-desc-input" className="vms-label mb-1">
              Description
            </label>
            <textarea
              id="item-desc-input"
              rows={3}
              value={itemDesc}
              onChange={(e) => setItemDesc(e.target.value)}
              className="vms-input"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowItemModal(false)}
              className="vms-btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="vms-btn-primary">
              {editingItemIndex !== null ? "Save Changes" : "Add Item"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
