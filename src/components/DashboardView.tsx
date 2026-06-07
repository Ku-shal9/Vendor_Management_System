import { Users, ShieldAlert } from "lucide-react";
import { Vendor, Registration } from "../types.js";

interface DashboardViewProps {
  vendors: Vendor[];
  registrations: Registration[];
  onApproveRegistration: (id: string) => void;
  onRejectRegistration: (id: string) => void;
  onNavigate: (view: string) => void;
}

export default function DashboardView({
  vendors,
  registrations,
  onApproveRegistration,
  onRejectRegistration,
  onNavigate,
}: DashboardViewProps) {
  const pending = registrations.filter((r) => r.status === "Pending");

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8 pb-24 md:pb-12">
      <h2 className="font-display text-2xl md:text-3xl font-extrabold text-slate-900 mb-8">
        Admin Dashboard
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div
          onClick={() => onNavigate("vendors")}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-600 cursor-pointer"
        >
          <Users className="w-5 h-5 text-blue-600 mb-4" />
          <div className="text-3xl font-extrabold text-slate-900">{vendors.length}</div>
          <div className="text-xs font-bold text-slate-400 uppercase mt-1">Total Vendors</div>
        </div>

        <div
          onClick={() => onNavigate("onboarding")}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-rose-500 cursor-pointer"
        >
          <ShieldAlert className="w-5 h-5 text-rose-600 mb-4" />
          <div className="text-3xl font-extrabold text-slate-900">{pending.length}</div>
          <div className="text-xs font-bold text-slate-400 uppercase mt-1">Pending Approvals</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Pending Vendor Registrations</h3>
        </div>

        {pending.length === 0 ? (
          <p className="px-6 py-8 text-sm text-slate-400 text-center">No pending registrations.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase">
                <th className="px-6 py-3">Company</th>
                <th className="px-6 py-3">Contact</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Registered</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pending.map((reg) => (
                <tr key={reg.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-xs font-bold text-slate-900">{reg.companyName}</td>
                  <td className="px-6 py-4 text-xs text-slate-600">{reg.contactName}</td>
                  <td className="px-6 py-4 text-xs text-slate-600">{reg.contactEmail}</td>
                  <td className="px-6 py-4 text-xs text-slate-500">{reg.registeredDate}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => onApproveRegistration(reg.id)}
                      className="text-emerald-600 hover:text-emerald-700 text-xs font-bold"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => onRejectRegistration(reg.id)}
                      className="text-rose-600 hover:text-rose-700 text-xs font-bold"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
