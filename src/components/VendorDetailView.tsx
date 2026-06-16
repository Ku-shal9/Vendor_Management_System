import { useState, FormEvent } from "react";
import {
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Contact,
  Pencil,
  Trash2,
} from "lucide-react";
import { Vendor, Invoice } from "../types.js";
import StatusBadge from "./StatusBadge.jsx";
import Modal from "./Modal.jsx";
import { useConfirm } from "../context/ConfirmContext.js";

interface VendorDetailProps {
  vendor: Vendor;
  invoices: Invoice[];
  onNavigateBack: () => void;
  onUpdateVendor: (vendor: Vendor) => void;
  onDeleteVendor: (id: string) => void;
}

export default function VendorDetailView({
  vendor,
  invoices,
  onNavigateBack,
  onUpdateVendor,
  onDeleteVendor,
}: VendorDetailProps) {
  const confirm = useConfirm();
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState(vendor);

  const handleEditSubmit = (e: FormEvent) => {
    e.preventDefault();
    onUpdateVendor(form);
    setShowEdit(false);
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Delete vendor record",
      message: `Delete ${vendor.name}? This cannot be undone.`,
      confirmLabel: "Delete vendor",
      destructive: true,
    });
    if (!confirmed) return;
    onDeleteVendor(vendor.id);
  };

  return (
    <div className="vms-page">
      <nav
        className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted mb-4"
        aria-label="Breadcrumb"
      >
        <button
          type="button"
          onClick={onNavigateBack}
          className="hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded"
        >
          Vendors
        </button>
        <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        <span className="text-ink">{vendor.name}</span>
      </nav>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pb-6 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary-tint text-primary flex items-center justify-center border border-border font-bold text-lg">
            {vendor.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-xl md:text-2xl font-extrabold text-ink text-balance">
              {vendor.name}
            </h1>
            <p className="text-sm text-ink-muted">{vendor.category}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setForm(vendor);
              setShowEdit(true);
            }}
            className="vms-btn-primary"
          >
            <Pencil className="w-4 h-4" aria-hidden="true" />
            Edit vendor
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="vms-btn-danger"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            Delete vendor
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <section className="vms-panel p-6">
          <h3 className="font-bold text-ink mb-4">Contact information</h3>
          <div className="space-y-4 text-sm">
            {[
              {
                icon: Contact,
                label: "Account manager",
                value: vendor.accountManager,
              },
              { icon: Mail, label: "Email", value: vendor.email },
              { icon: Phone, label: "Phone", value: vendor.phone },
              { icon: MapPin, label: "Address", value: vendor.address },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <Icon
                  className="w-5 h-5 text-primary mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <p className="vms-label">{label}</p>
                  <p className="font-semibold text-ink mt-1">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="vms-panel p-6">
          <h3 className="font-bold text-ink mb-4">Product Catalog</h3>
          {!vendor.items || vendor.items.length === 0 ? (
            <p className="text-sm text-ink-muted italic py-2">
              No catalog items listed.
            </p>
          ) : (
            <ul className="space-y-3 divide-y divide-border-subtle max-h-[200px] overflow-y-auto pr-1">
              {vendor.items.map((item, index) => (
                <li
                  key={index}
                  className={`text-sm ${index > 0 ? "pt-3" : ""}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-semibold text-ink">{item.name}</span>
                    <span className="font-bold text-primary shrink-0">
                      ${item.price.toFixed(2)}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-xs text-ink-subtle mt-0.5">
                      {item.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="vms-panel overflow-hidden mb-6">
        <div className="vms-panel-header">
          <h3 className="font-bold text-ink">Invoices ({invoices.length})</h3>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {invoices.map((inv) => (
                  <tr key={inv.id}>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="vms-empty">No invoices for this vendor.</p>
        )}
      </section>

      <Modal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        titleId="edit-vendor-title"
        className="vms-panel p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <h2 id="edit-vendor-title" className="font-bold text-ink mb-4">
          Edit vendor
        </h2>
        <form onSubmit={handleEditSubmit} className="space-y-3">
          {(
            [
              "name",
              "category",
              "accountManager",
              "email",
              "phone",
              "address",
            ] as const
          ).map((field) => (
            <div key={field}>
              <label
                htmlFor={`edit-${field}`}
                className="vms-label mb-1 capitalize"
              >
                {field === "accountManager" ? "Account manager" : field}
              </label>
              <input
                id={`edit-${field}`}
                value={form[field]}
                onChange={(e) => {
                  const val = e.target.value;
                  if (field === "phone") {
                    setForm({
                      ...form,
                      phone: val.replace(/[^0-9+\s()-.]/g, ""),
                    });
                  } else {
                    setForm({ ...form, [field]: val });
                  }
                }}
                className="vms-input"
              />
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowEdit(false)}
              className="vms-btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="vms-btn-primary">
              Save changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
