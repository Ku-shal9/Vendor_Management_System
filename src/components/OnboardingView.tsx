import { useState } from "react";
import { Upload, FileText, CheckCircle, ArrowRight, ArrowLeft, Building2, UserSquare } from "lucide-react";
interface OnboardingViewProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

export default function OnboardingView({ onSuccess, onCancel }: OnboardingViewProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [companyName, setCompanyName] = useState("");
  const [category, setCategory] = useState("Cloud Infrastructure");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [licenseUploaded, setLicenseUploaded] = useState(false);
  const [w9Uploaded, setW9Uploaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [formError, setFormError] = useState("");

  const categories = [
    "Cloud Infrastructure",
    "ISP & Network Services",
    "Hardware Procurement",
    "Software Licensing",
    "Database Services",
    "Consultancy Outsource",
  ];

  const handleStepForward = () => {
    setFormError("");
    if (step === 1 && !companyName.trim()) {
      setFormError("Enter the company legal name to continue.");
      return;
    }
    if (step === 2 && (!fullName.trim() || !email.trim())) {
      setFormError("Enter the contact name and corporate email to continue.");
      return;
    }
    setStep((prev) => (prev < 3 ? ((prev + 1) as 1 | 2 | 3) : prev));
  };

  const handleStepBackward = () => {
    setFormError("");
    setStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : prev));
  };

  const handleFormSubmit = async () => {
    setFormError("");
    if (!licenseUploaded || !w9Uploaded) {
      setFormError("Upload both the business license and W-9 before submitting.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          category,
          contactName: fullName,
          contactEmail: email,
          contactPhone: phone,
          address: address || "Not provided",
        }),
      });

      if (response.ok) {
        setOnboarded(true);
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        setFormError("Registration could not be saved. Try again or contact support.");
      }
    } catch {
      setFormError("Network error while submitting. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="vms-page-narrow">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="vms-title mb-1">Vendor registration</h1>
          <p className="text-sm text-ink-muted">Step {step} of 3</p>
        </div>
        {onCancel && !onboarded && (
          <button type="button" onClick={onCancel} className="vms-link">
            Back to sign in
          </button>
        )}
      </div>

      <div className="flex items-center justify-between relative mb-8 px-1.5" aria-label="Registration progress">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-border" aria-hidden="true" />
        <div
          className="absolute top-4 left-0 h-0.5 bg-primary transition-all duration-300"
          style={{ width: step === 1 ? "15%" : step === 2 ? "50%" : "85%" }}
          aria-hidden="true"
        />

        {[
          { n: 1, label: "Company" },
          { n: 2, label: "Contact" },
          { n: 3, label: "Documents" },
        ].map(({ n, label }) => (
          <div key={n} className="relative z-10 flex flex-col items-center gap-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                step >= n ? "bg-primary text-white" : "bg-surface text-ink-muted border border-border"
              }`}
            >
              {n}
            </div>
            <span className={`text-xs font-semibold ${step >= n ? "text-primary" : "text-ink-muted"}`}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {onboarded ? (
        <div className="vms-panel p-8 text-center flex flex-col items-center py-16 border-success-ink/20">
          <CheckCircle className="text-success-ink w-14 h-14 mb-4" aria-hidden="true" />
          <h3 className="font-display text-xl font-bold text-ink mb-2">Registration submitted</h3>
          <p className="text-sm text-ink-muted max-w-md">
            Registration for <strong className="text-ink">{companyName}</strong> is pending admin review.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {formError && (
            <p role="alert" className="vms-alert-error">
              {formError}
            </p>
          )}

          {step === 1 && (
            <section className="vms-panel overflow-hidden">
              <div className="p-5 border-b border-border-subtle bg-surface-muted flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" aria-hidden="true" />
                <h3 className="text-sm font-bold text-ink">Company details</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label htmlFor="comp-legal-name" className="vms-label">Company legal name *</label>
                  <input
                    id="comp-legal-name"
                    type="text"
                    required
                    placeholder="e.g. Nexus Tech Systems"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="vms-input"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="vendor-cat-select" className="vms-label">Vendor category *</label>
                  <select
                    id="vendor-cat-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="vms-input"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="vms-panel overflow-hidden">
              <div className="p-5 border-b border-border-subtle bg-surface-muted flex items-center gap-2">
                <UserSquare className="w-5 h-5 text-primary" aria-hidden="true" />
                <h3 className="text-sm font-bold text-ink">Contact person</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label htmlFor="acct-manager-name" className="vms-label">Full name *</label>
                  <input
                    id="acct-manager-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="vms-input"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="acct-manager-email" className="vms-label">Corporate email *</label>
                    <input
                      id="acct-manager-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="vms-input"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="acct-manager-phone" className="vms-label">Phone number</label>
                    <input
                      id="acct-manager-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="vms-input"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label htmlFor="acct-manager-addr" className="vms-label">Business address</label>
                  <input
                    id="acct-manager-addr"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="vms-input"
                  />
                </div>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="vms-panel overflow-hidden">
              <div className="p-5 border-b border-border-subtle bg-surface-muted flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" aria-hidden="true" />
                <h3 className="text-sm font-bold text-ink">Compliance documents</h3>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-ink-muted">
                  Upload PDF copies of your business license and W-9. These are required for vendor approval.
                </p>

                {[
                  { uploaded: licenseUploaded, setUploaded: setLicenseUploaded, title: "Business license *" },
                  { uploaded: w9Uploaded, setUploaded: setW9Uploaded, title: "Tax documents / W-9 *" },
                ].map(({ uploaded, setUploaded, title }) => (
                  <button
                    key={title}
                    type="button"
                    onClick={() => setUploaded(true)}
                    className={`w-full flex items-center justify-between p-4 border-2 border-dashed rounded-xl text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                      uploaded ? "border-success-ink/30 bg-success-surface" : "border-border hover:border-primary/40 hover:bg-surface-muted"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <FileText className={`w-5 h-5 ${uploaded ? "text-success-ink" : "text-ink-subtle"}`} aria-hidden="true" />
                      <div>
                        <p className="text-sm font-semibold text-ink">{title}</p>
                        <p className="text-xs text-ink-muted">
                          {uploaded ? "Document marked ready" : "Select or upload PDF"}
                        </p>
                      </div>
                    </div>
                    <Upload className={`w-4 h-4 ${uploaded ? "text-success-ink" : "text-ink-subtle"}`} aria-hidden="true" />
                  </button>
                ))}
              </div>
            </section>
          )}

          <div className="flex items-center justify-between pt-2">
            {step > 1 ? (
              <button type="button" onClick={handleStepBackward} className="vms-btn-secondary">
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                Previous step
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button type="button" onClick={handleStepForward} className="vms-btn-primary ml-auto">
                Continue
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFormSubmit}
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 ml-auto bg-ink text-app text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-opacity"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit registration
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
