import { ChevronRight } from "lucide-react";
import { Vendor, Registration } from "../types.js";
import { useConfirm } from "../context/ConfirmContext.js";

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
  const confirm = useConfirm();
  const pending = registrations.filter((r) => r.status === "Pending");

  const handleReject = async (id: string, companyName: string) => {
    const confirmed = await confirm({
      title: "Reject registration",
      message: `Reject the registration for ${companyName}? The applicant will need to submit again.`,
      confirmLabel: "Reject registration",
      destructive: true,
    });
    if (!confirmed) return;
    onRejectRegistration(id);
  };

  return (
    <div className="vms-page">
      <h1 className="vms-title mb-6">Admin Dashboard</h1>

      <div className="vms-summary-bar">
        <span>
          <span className="font-semibold text-ink">{vendors.length}</span> vendors on record
        </span>
        <span aria-hidden="true" className="text-border">|</span>
        <span>
          <span className="font-semibold text-ink">{pending.length}</span> pending approval{pending.length === 1 ? "" : "s"}
        </span>
        {pending.length > 0 && (
          <button type="button" onClick={() => onNavigate("onboarding")} className="vms-link inline-flex items-center gap-1">
            Review onboarding queue
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="vms-panel overflow-hidden">
        <div className="vms-panel-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h3 className="font-bold text-ink">Pending vendor registrations</h3>
          {pending.length > 0 && (
            <button type="button" onClick={() => onNavigate("onboarding")} className="vms-link">
              Open full onboarding view
            </button>
          )}
        </div>

        {pending.length === 0 ? (
          <p className="vms-empty">No pending registrations. New vendor requests will appear here.</p>
        ) : (
          <div className="vms-table-wrap">
            <table className="vms-table">
              <thead>
                <tr className="vms-table-head">
                  <th scope="col" className="px-6 py-3">Company</th>
                  <th scope="col" className="px-6 py-3">Contact</th>
                  <th scope="col" className="px-6 py-3">Email</th>
                  <th scope="col" className="px-6 py-3">Registered</th>
                  <th scope="col" className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {pending.map((reg) => (
                  <tr key={reg.id} className="vms-table-row">
                    <td className="px-6 py-4 text-sm font-semibold text-ink">
                      <div>{reg.companyName}</div>
                      {reg.documents && (reg.documents.license || reg.documents.w9) && (
                        <div className="text-[11px] text-ink-subtle mt-0.5 font-normal flex items-center gap-1.5">
                          {reg.documents.license && <span title={reg.documents.license}>📄 License</span>}
                          {reg.documents.w9 && <span title={reg.documents.w9}>📄 W-9</span>}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-ink-muted">{reg.contactName}</td>
                    <td className="px-6 py-4 text-sm text-ink-muted">{reg.contactEmail}</td>
                    <td className="px-6 py-4 text-sm text-ink-muted">{reg.registeredDate}</td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button
                        type="button"
                        onClick={() => onApproveRegistration(reg.id)}
                        className="text-sm font-semibold text-success-ink hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-success-ink rounded"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(reg.id, reg.companyName)}
                        className="text-sm font-semibold text-danger-ink hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger-ink rounded"
                      >
                        Reject
                      </button>
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
