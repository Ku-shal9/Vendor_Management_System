import { useState, FormEvent } from "react";
import { ChevronRight, Phone, Mail, MapPin, Contact, Pencil, Trash2 } from "lucide-react";
import { Vendor, Invoice } from "../types.js";

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
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState(vendor);

  const handleEditSubmit = (e: FormEvent) => {
    e.preventDefault();
    onUpdateVendor(form);
    setShowEdit(false);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8 pb-24 md:pb-8">
      <nav className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase mb-4">
        <span onClick={onNavigateBack} className="cursor-pointer hover:text-blue-600">Vendors</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-blue-600">{vendor.name}</span>
      </nav>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-slate-200">
            <Contact className="w-8 h-8" />
          </div>
          <div>
            <h2 className="font-display text-xl md:text-2xl font-extrabold text-slate-900">{vendor.name}</h2>
            <span className="text-xs text-slate-500">{vendor.category}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => { setForm(vendor); setShowEdit(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-700"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            onClick={() => onDeleteVendor(vendor.id)}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-lg hover:bg-rose-700"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <section className="bg-white border border-slate-200 p-6 rounded-2xl">
          <h3 className="font-bold text-slate-900 mb-4">Contact Information</h3>
          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <Contact className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Account Manager</p>
                <p className="font-semibold">{vendor.accountManager}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Email</p>
                <p className="font-semibold">{vendor.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Phone</p>
                <p className="font-semibold">{vendor.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Address</p>
                <p className="font-semibold">{vendor.address}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">Invoices ({invoices.length})</h3>
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
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100">
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-400">
                    No invoices for this vendor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>

      {showEdit && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-slate-900 mb-4">Edit Vendor</h3>
            <form onSubmit={handleEditSubmit} className="space-y-3">
              {(["name", "category", "accountManager", "email", "phone", "address"] as const).map((field) => (
                <div key={field}>
                  <label className="block text-xs font-bold text-slate-500 mb-1 capitalize">{field}</label>
                  <input
                    value={form[field]}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              ))}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowEdit(false)} className="px-4 py-2 border rounded-xl text-sm">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
