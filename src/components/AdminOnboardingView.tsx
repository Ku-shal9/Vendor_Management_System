import { Registration } from "../types.js";
import { useConfirm } from "../context/ConfirmContext.js";

interface AdminOnboardingViewProps {
  registrations: Registration[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export default function AdminOnboardingView({
  registrations,
  onApprove,
  onReject,
}: AdminOnboardingViewProps) {
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
    onReject(id);
  };

  return (
    <div className="vms-page">
      <h1 className="vms-title mb-2">Vendor Onboarding</h1>
      <p className="text-sm text-ink-muted mb-8">
        {pending.length} registration{pending.length === 1 ? "" : "s"} awaiting review.
      </p>

      {pending.length === 0 ? (
        <div className="vms-panel p-12 text-center">
          <p className="text-sm text-ink-muted">No pending registrations. New vendor requests will appear here.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {pending.map((reg) => (
            <li key={reg.id} className="vms-panel p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-ink">{reg.companyName}</h3>
                  <p className="text-sm text-ink-muted mt-1">{reg.category}</p>
                  <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <div>
                      <dt className="vms-label">Contact</dt>
                      <dd className="text-ink mt-1">{reg.contactName}</dd>
                    </div>
                    <div>
                      <dt className="vms-label">Email</dt>
                      <dd className="text-ink mt-1">{reg.contactEmail}</dd>
                    </div>
                    <div>
                      <dt className="vms-label">Phone</dt>
                      <dd className="text-ink mt-1">{reg.contactPhone || "Not provided"}</dd>
                    </div>
                    <div>
                      <dt className="vms-label">Submitted</dt>
                      <dd className="text-ink mt-1">{reg.registeredDate}</dd>
                    </div>
                  </dl>
                  {reg.documents && (reg.documents.license || reg.documents.w9) && (
                    <div className="mt-4 pt-4 border-t border-border-subtle">
                      <dt className="vms-label mb-2">Uploaded Documents</dt>
                      <dd className="flex flex-wrap gap-3">
                        {reg.documents.license && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-muted border border-border rounded-lg text-xs font-semibold text-ink">
                            <span className="text-ink-muted">License:</span>
                            <span className="truncate max-w-[200px]" title={reg.documents.license}>{reg.documents.license}</span>
                          </div>
                        )}
                        {reg.documents.w9 && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-muted border border-border rounded-lg text-xs font-semibold text-ink">
                            <span className="text-ink-muted">W-9:</span>
                            <span className="truncate max-w-[200px]" title={reg.documents.w9}>{reg.documents.w9}</span>
                          </div>
                        )}
                      </dd>
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 gap-2 sm:flex-col sm:items-stretch">
                  <button type="button" onClick={() => onApprove(reg.id)} className="vms-btn-primary">
                    Approve registration
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(reg.id, reg.companyName)}
                    className="vms-btn-secondary text-danger-ink border-danger-ink/20 hover:bg-danger-surface"
                  >
                    Reject request
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
