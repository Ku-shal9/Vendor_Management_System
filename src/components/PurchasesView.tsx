import { useState, FormEvent } from "react";
import { Plus, Search, Trash2, ShoppingCart } from "lucide-react";
import { Vendor, PurchaseRequest } from "../types.js";
import StatusBadge from "./StatusBadge.jsx";
import Modal from "./Modal.jsx";
import { useConfirm } from "../context/ConfirmContext.js";
import { useToast } from "../context/ToastContext.js";

interface PurchasesViewProps {
  vendors: Vendor[];
  purchases: PurchaseRequest[];
  onAddPurchase: (purchase: Partial<PurchaseRequest>) => void;
  onDeletePurchase: (id: string) => void;
}

export default function PurchasesView({
  vendors,
  purchases,
  onAddPurchase,
  onDeletePurchase,
}: PurchasesViewProps) {
  const confirm = useConfirm();
  const { pushToast } = useToast();
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [purchaseVendorId, setPurchaseVendorId] = useState(vendors[0]?.id || "");
  const [purchaseQuantities, setPurchaseQuantities] = useState<Record<string, string>>({});
  const [searchPurchases, setSearchPurchases] = useState("");

  const selectedPurchaseVendor = vendors.find((v) => v.id === purchaseVendorId);
  const purchaseItemsCatalog = selectedPurchaseVendor?.items || [];
  const purchaseTotal = purchaseItemsCatalog.reduce((sum, item) => {
    const qty = parseInt(purchaseQuantities[item.name] || "0", 10);
    return sum + item.price * qty;
  }, 0);

  const filteredPurchases = purchases.filter(
    (prq) =>
      prq.vendorName.toLowerCase().includes(searchPurchases.toLowerCase()) ||
      prq.id.toLowerCase().includes(searchPurchases.toLowerCase()),
  );

  const handlePurchaseSubmit = (e: FormEvent) => {
    e.preventDefault();
    const vendor = vendors.find((v) => v.id === purchaseVendorId);
    if (!vendor) return;

    const orderedItems = (vendor.items || [])
      .map((item) => ({
        name: item.name,
        price: item.price,
        quantity: parseInt(purchaseQuantities[item.name] || "0", 10),
      }))
      .filter((i) => i.quantity > 0);

    if (orderedItems.length === 0) {
      pushToast("Select at least one item.", "error");
      return;
    }

    onAddPurchase({
      vendorId: vendor.id,
      vendorName: vendor.name,
      items: orderedItems,
      totalAmount: purchaseTotal,
      status: "Pending",
    });
    setShowPurchaseForm(false);
  };

  return (
    <div className="vms-page">
      <div className="flex justify-between items-center gap-4 mb-6">
        <h1 className="vms-title mb-0">Purchase Requests</h1>
        <button type="button" onClick={() => setShowPurchaseForm(true)} disabled={vendors.length === 0} className="vms-btn-primary">
          <Plus className="w-4 h-4" />
          Request purchase
        </button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
        <input type="search" value={searchPurchases} onChange={(e) => setSearchPurchases(e.target.value)} className="vms-input pl-9" aria-label="Search purchase requests" />
      </div>

      <div className="vms-panel overflow-hidden">
        {filteredPurchases.length === 0 ? (
          <p className="vms-empty">No purchase requests.</p>
        ) : (
          <div className="vms-table-wrap">
            <table className="vms-table min-w-[720px]">
              <thead>
                <tr className="vms-table-head">
                  <th scope="col" className="px-6 py-3">Vendor / ID</th>
                  <th scope="col" className="px-6 py-3">Total</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredPurchases.map((prq) => (
                  <tr key={prq.id} className="vms-table-row">
                    <td className="px-6 py-4 text-sm">
                      <div className="font-semibold text-ink">{prq.vendorName}</div>
                      <div className="text-xs text-ink-subtle">{prq.id}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold">${prq.totalAmount.toFixed(2)}</td>
                    <td className="px-6 py-4"><StatusBadge status={prq.status} /></td>
                    <td className="px-6 py-4 text-right">
                      <button type="button" onClick={async () => {
                        const ok = await confirm({ title: "Delete", message: `Delete ${prq.id}?`, confirmLabel: "Delete", destructive: true });
                        if (ok) onDeletePurchase(prq.id);
                      }} className="p-2 text-ink-subtle hover:text-danger-ink"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={showPurchaseForm} onClose={() => setShowPurchaseForm(false)} titleId="purchase-form-title" className="vms-panel p-6 max-w-lg w-full shadow-xl">
        <h2 id="purchase-form-title" className="font-bold text-ink mb-4 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary" /> Request Purchase
        </h2>
        <form onSubmit={handlePurchaseSubmit} className="space-y-4">
          <select value={purchaseVendorId} onChange={(e) => { setPurchaseVendorId(e.target.value); setPurchaseQuantities({}); }} className="vms-input" required>
            {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          {purchaseItemsCatalog.map((item) => (
            <div key={item.name} className="flex justify-between gap-4">
              <span className="text-sm">{item.name} (${item.price})</span>
              <input type="text" inputMode="numeric" value={purchaseQuantities[item.name] || ""} onChange={(e) => setPurchaseQuantities((p) => ({ ...p, [item.name]: e.target.value.replace(/[^0-9]/g, "") }))} className="w-16 vms-input text-center" />
            </div>
          ))}
          <div className="flex justify-between items-center pt-2">
            <span className="font-bold">${purchaseTotal.toFixed(2)}</span>
            <button type="submit" disabled={purchaseTotal === 0} className="vms-btn-primary">Submit</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
