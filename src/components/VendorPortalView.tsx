import { useState, FormEvent } from "react";
import { Vendor, Invoice, PurchaseRequest, VendorItem } from "../types.js";
import StatusBadge from "./StatusBadge.jsx";
import Modal from "./Modal.jsx";
import { Plus, Pencil, Trash2, Settings, Layers, ListOrdered, ShoppingBag, CheckCircle } from "lucide-react";
import { useConfirm } from "../context/ConfirmContext.js";

interface VendorPortalViewProps {
  vendor: Vendor | undefined;
  invoices: Invoice[];
  purchases: PurchaseRequest[];
  onUpdateVendor: (vendor: Vendor) => void;
  onUpdatePurchase: (id: string, updates: Partial<PurchaseRequest>) => void;
}

export default function VendorPortalView({
  vendor,
  invoices,
  purchases,
  onUpdateVendor,
  onUpdatePurchase,
}: VendorPortalViewProps) {
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState<"overview" | "invoices" | "purchases" | "catalog" | "profile">("overview");

  // Profile Form State
  const [profileForm, setProfileForm] = useState<Vendor>(vendor || {
    id: "",
    name: "",
    category: "",
    accountManager: "",
    email: "",
    phone: "",
    address: ""
  });

  // Catalog Form State
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemDesc, setItemDesc] = useState("");

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

  // Filter purchases for this vendor
  const vendorPurchases = purchases.filter((p) => p.vendorId === vendor.id);

  // Invoices metrics
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const pendingInvoices = invoices.filter((i) => i.status === "Pending");
  const outstandingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  // Profile Update Submission
  const handleProfileSubmit = (e: FormEvent) => {
    e.preventDefault();
    onUpdateVendor(profileForm);
  };

  const handlePhoneChange = (val: string) => {
    // Phone character restriction
    const sanitized = val.replace(/[^0-9+\s()-.]/g, "");
    setProfileForm({ ...profileForm, phone: sanitized });
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
    const confirmed = await confirm({
      title: "Accept Purchase Request",
      message: "Accept this purchase order request and start processing?",
      confirmLabel: "Accept Order",
    });
    if (confirmed) {
      onUpdatePurchase(reqId, { status: "Approved" });
    }
  };

  const handleDeliverPurchase = async (reqId: string) => {
    const confirmed = await confirm({
      title: "Deliver Purchase Order",
      message: "Mark this purchase order as delivered to CLance Solutions?",
      confirmLabel: "Deliver Order",
    });
    if (confirmed) {
      onUpdatePurchase(reqId, { status: "Delivered" });
    }
  };

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-8 pb-24 md:pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="vms-title mb-1">{vendor.name}</h1>
          <p className="text-sm text-ink-muted">Vendor Portal ID: <span className="font-semibold text-ink">{vendor.id}</span></p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 border-b border-border mb-8">
        {[
          { id: "overview", label: "Overview", icon: Layers },
          { id: "invoices", label: "My Invoices", icon: ShoppingBag },
          { id: "purchases", label: "Purchase Requests", icon: ListOrdered },
          { id: "catalog", label: "Product Catalog", icon: ShoppingBag },
          { id: "profile", label: "Profile Settings", icon: Settings },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setActiveTab(id as any);
              if (id === "profile") setProfileForm(vendor);
            }}
            className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-colors focus-visible:outline-none ${
              activeTab === id
                ? "border-primary text-primary"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <section className="vms-panel p-6 md:col-span-2 space-y-4">
            <h3 className="font-bold text-ink mb-2">Company Overview</h3>
            <p className="text-sm text-ink-muted">
              Welcome to your Vendor Portal! You can track invoices, view incoming purchase requests, keep your catalog updated, and edit your profile settings.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-sm">
              <div>
                <dt className="vms-label">Account Representative</dt>
                <dd className="font-semibold text-ink mt-0.5">{vendor.accountManager}</dd>
              </div>
              <div>
                <dt className="vms-label">Business Category</dt>
                <dd className="font-semibold text-ink mt-0.5">{vendor.category}</dd>
              </div>
              <div>
                <dt className="vms-label">Business Address</dt>
                <dd className="font-semibold text-ink mt-0.5">{vendor.address}</dd>
              </div>
              <div>
                <dt className="vms-label">Billing Email</dt>
                <dd className="font-semibold text-ink mt-0.5">{vendor.email}</dd>
              </div>
            </div>
          </section>

          <section className="vms-panel p-6 space-y-4">
            <h3 className="font-bold text-ink mb-2">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border-subtle">
                <span className="text-sm text-ink-muted">Invoices Submitted</span>
                <span className="text-sm font-bold text-ink">{invoices.length}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border-subtle">
                <span className="text-sm text-ink-muted">Outstanding Billings</span>
                <span className="text-sm font-bold text-ink">${outstandingAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border-subtle">
                <span className="text-sm text-ink-muted">Total Paid to Date</span>
                <span className="text-sm font-bold text-success-ink">
                  ${(totalInvoiced - outstandingAmount).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-ink-muted">Active Purchases</span>
                <span className="text-sm font-bold text-ink">{vendorPurchases.filter(p => p.status === "Pending" || p.status === "Approved").length}</span>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Invoices tab */}
      {activeTab === "invoices" && (
        <section className="vms-panel overflow-hidden">
          <div className="vms-panel-header">
            <h3 className="font-bold text-ink">Invoices Overview ({invoices.length})</h3>
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
                    <tr key={inv.id} className="vms-table-row">
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
      )}

      {/* Purchase Requests tab */}
      {activeTab === "purchases" && (
        <section className="vms-panel overflow-hidden">
          <div className="vms-panel-header">
            <h3 className="font-bold text-ink">Purchase Requests from CLance ({vendorPurchases.length})</h3>
          </div>
          {vendorPurchases.length > 0 ? (
            <div className="vms-table-wrap">
              <table className="vms-table min-w-[640px]">
                <thead>
                  <tr className="vms-table-head">
                    <th scope="col" className="px-6 py-3">Request ID</th>
                    <th scope="col" className="px-6 py-3">Date</th>
                    <th scope="col" className="px-6 py-3">Ordered Items</th>
                    <th scope="col" className="px-6 py-3">Total Cost</th>
                    <th scope="col" className="px-6 py-3">Status</th>
                    <th scope="col" className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {vendorPurchases.map((prq) => (
                    <tr key={prq.id} className="vms-table-row">
                      <td className="px-6 py-4 text-sm font-semibold text-ink">{prq.id}</td>
                      <td className="px-6 py-4 text-sm text-ink-muted">{prq.date}</td>
                      <td className="px-6 py-4 text-xs text-ink-muted">
                        <ul className="list-disc pl-4 space-y-0.5">
                          {prq.items.map((it, idx) => (
                            <li key={idx}>
                              <span className="font-semibold text-ink">{it.name}</span> x {it.quantity} (${it.price})
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-ink">${prq.totalAmount.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={prq.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {prq.status === "Pending" && (
                            <button
                              type="button"
                              onClick={() => handleAcceptPurchase(prq.id)}
                              className="px-3 py-1.5 bg-success-ink text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
                            >
                              Accept Request
                            </button>
                          )}
                          {prq.status === "Approved" && (
                            <button
                              type="button"
                              onClick={() => handleDeliverPurchase(prq.id)}
                              className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
                            >
                              Deliver Order
                            </button>
                          )}
                          {prq.status === "Delivered" && (
                            <span className="text-xs font-semibold text-ink-subtle flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5 text-success-ink" /> Delivered
                            </span>
                          )}
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

      {/* Catalog tab */}
      {activeTab === "catalog" && (
        <section className="vms-panel overflow-hidden">
          <div className="vms-panel-header flex items-center justify-between">
            <h3 className="font-bold text-ink">My Products & Services ({vendor.items?.length || 0})</h3>
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
            <p className="vms-empty">No items listed in your catalog. Add items so CLance can request purchases.</p>
          ) : (
            <div className="vms-table-wrap">
              <table className="vms-table min-w-[600px]">
                <thead>
                  <tr className="vms-table-head">
                    <th scope="col" className="px-6 py-3">Item Name</th>
                    <th scope="col" className="px-6 py-3">Description</th>
                    <th scope="col" className="px-6 py-3">Price</th>
                    <th scope="col" className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {vendor.items.map((item, index) => (
                    <tr key={index} className="vms-table-row">
                      <td className="px-6 py-4 text-sm font-semibold text-ink">{item.name}</td>
                      <td className="px-6 py-4 text-sm text-ink-muted max-w-[280px] truncate" title={item.description}>
                        {item.description || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-primary">${item.price.toFixed(2)}</td>
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
                <label htmlFor="prof-name" className="vms-label mb-1">Company legal name *</label>
                <input
                  id="prof-name"
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="vms-input"
                />
              </div>
              <div>
                <label htmlFor="prof-category" className="vms-label mb-1">Business category *</label>
                <input
                  id="prof-category"
                  type="text"
                  required
                  value={profileForm.category}
                  onChange={(e) => setProfileForm({ ...profileForm, category: e.target.value })}
                  className="vms-input"
                />
              </div>
              <div>
                <label htmlFor="prof-manager" className="vms-label mb-1">Account manager *</label>
                <input
                  id="prof-manager"
                  type="text"
                  required
                  value={profileForm.accountManager}
                  onChange={(e) => setProfileForm({ ...profileForm, accountManager: e.target.value })}
                  className="vms-input"
                />
              </div>
              <div>
                <label htmlFor="prof-email" className="vms-label mb-1">Corporate billing email *</label>
                <input
                  id="prof-email"
                  type="email"
                  required
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="vms-input"
                />
              </div>
              <div>
                <label htmlFor="prof-phone" className="vms-label mb-1">Business phone number *</label>
                <input
                  id="prof-phone"
                  type="tel"
                  required
                  value={profileForm.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="vms-input"
                />
              </div>
              <div>
                <label htmlFor="prof-address" className="vms-label mb-1">Office address *</label>
                <input
                  id="prof-address"
                  type="text"
                  required
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
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
        </section>
      )}

      {/* Catalog Add/Edit Modal */}
      <Modal open={showItemModal} onClose={() => setShowItemModal(false)} titleId="item-modal-title" className="vms-panel p-6 max-w-md w-full shadow-xl">
        <h2 id="item-modal-title" className="font-bold text-ink mb-4">
          {editingItemIndex !== null ? "Edit catalog item" : "Add catalog item"}
        </h2>
        <form onSubmit={handleItemSubmit} className="space-y-4">
          <div>
            <label htmlFor="item-name-input" className="vms-label mb-1">Item Name *</label>
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
            <label htmlFor="item-price-input" className="vms-label mb-1">Price (USD) *</label>
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
            <label htmlFor="item-desc-input" className="vms-label mb-1">Description</label>
            <textarea
              id="item-desc-input"
              rows={3}
              value={itemDesc}
              onChange={(e) => setItemDesc(e.target.value)}
              className="vms-input"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowItemModal(false)} className="vms-btn-secondary">
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
