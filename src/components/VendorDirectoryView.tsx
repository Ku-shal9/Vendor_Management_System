import { useState } from "react";
import { Search, ChevronRight, Trash2 } from "lucide-react";
import { Vendor } from "../types.js";
import { useConfirm } from "../context/ConfirmContext.js";

interface VendorDirectoryProps {
  vendors: Vendor[];
  onSelectVendor: (vendor: Vendor) => void;
  onDeleteVendor: (id: string) => void;
}

export default function VendorDirectoryView({
  vendors,
  onSelectVendor,
  onDeleteVendor,
}: VendorDirectoryProps) {
  const confirm = useConfirm();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredVendors = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (vendor: Vendor) => {
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
      <h1 className="vms-title mb-6">Vendor Directory</h1>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-subtle" aria-hidden="true" />
          <input
            type="search"
            aria-label="Search vendors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="vms-input pl-12 py-3"
          />
        </div>
      </div>

      <div className="vms-panel overflow-hidden">
        {filteredVendors.length === 0 ? (
          <p className="vms-empty">
            {searchTerm ? "No vendors match your search." : "No vendors on record yet."}
          </p>
        ) : (
          <div className="vms-table-wrap">
            <table className="vms-table">
              <thead>
                <tr className="vms-table-head">
                  <th scope="col" className="px-6 py-3">Vendor</th>
                  <th scope="col" className="px-6 py-3">Category</th>
                  <th scope="col" className="px-6 py-3">Contact</th>
                  <th scope="col" className="px-6 py-3">Email</th>
                  <th scope="col" className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="vms-table-row">
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => onSelectVendor(vendor)}
                        className="text-sm font-semibold text-ink hover:text-primary text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded"
                      >
                        {vendor.name}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-ink-muted">{vendor.category}</td>
                    <td className="px-6 py-4 text-sm text-ink-muted">{vendor.accountManager}</td>
                    <td className="px-6 py-4 text-sm text-ink-muted">{vendor.email}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectVendor(vendor)}
                          className="vms-link inline-flex items-center gap-1"
                        >
                          View details
                          <ChevronRight className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(vendor)}
                          aria-label={`Delete ${vendor.name}`}
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
    </div>
  );
}
