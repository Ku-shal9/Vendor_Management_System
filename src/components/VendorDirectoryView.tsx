import { useState } from "react";
import { Search, ChevronRight, Trash2 } from "lucide-react";
import { Vendor } from "../types.js";

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
  const [searchTerm, setSearchTerm] = useState("");

  const filteredVendors = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8 pb-24 md:pb-8">
      <h2 className="font-display text-2xl md:text-3xl font-extrabold text-slate-900 mb-8">
        Vendor Directory
      </h2>

      <div className="mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVendors.map((vendor) => (
          <div
            key={vendor.id}
            className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between h-48"
          >
            <div onClick={() => onSelectVendor(vendor)} className="cursor-pointer flex-1">
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200 font-bold text-blue-600 mb-4">
                {vendor.name.substring(0, 2).toUpperCase()}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">{vendor.name}</h3>
              <p className="text-xs text-slate-500">{vendor.category}</p>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => onSelectVendor(vendor)}
                className="flex items-center gap-1 text-xs font-semibold text-blue-600"
              >
                View Details <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeleteVendor(vendor.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
