import { useState } from "react";
import { Upload, FileText, CheckCircle, ArrowRight, ArrowLeft, Building2, UserSquare, ShieldAlert } from "lucide-react";
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

  const categories = [
    "Cloud Infrastructure",
    "ISP & Network Services",
    "Hardware Procurement",
    "Software Licensing",
    "Database Services",
    "Consultancy Outsource"
  ];

  const handleStepForward = () => {
    if (step === 1 && !companyName) {
      alert("Please enter the Company Legal Name.");
      return;
    }
    if (step === 2 && (!fullName || !email)) {
      alert("Please enter both the representative's Name and Corporate Email.");
      return;
    }
    setStep((prev) => (prev + 1) as any);
  };

  const handleStepBackward = () => {
    setStep((prev) => (prev - 1) as any);
  };

  const handleFormSubmit = async () => {
    if (!licenseUploaded || !w9Uploaded) {
      alert("Please upload both compliance documents (Business License & W-9) to satisfy procurement audit criteria.");
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
        })
      });

      if (response.ok) {
        setOnboarded(true);
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        alert("Server failed to register vendor compliance metrics.");
      }
    } catch (err) {
      console.error(err);
      alert("Network disruption while deploying registration payload.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Title Header */}
      <section className="mb-8 select-none">
        <h2 className="font-display text-2xl font-extrabold text-slate-900 mb-1">
          Vendor Registration
        </h2>

        {/* Progress Timeline Stepper */}
        <div className="flex items-center justify-between relative mt-8 mb-6 px-1.5 z-10">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
          <div 
            className="absolute top-1/2 left-0 h-0.5 bg-blue-600 -translate-y-1/2 z-0 transition-all duration-500" 
            style={{ width: step === 1 ? '15%' : step === 2 ? '50%' : '85%' }}
          />

          {/* Step 1 marker */}
          <div className="relative z-10 flex flex-col items-center gap-1 cursor-pointer" onClick={() => setStep(1)}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-xs transition-colors
              ${step >= 1 ? "bg-blue-600 text-white shadow-sm shadow-blue-200" : "bg-slate-200 text-slate-500"}`}>
              1
            </div>
            <span className={`text-[12px] font-bold ${step >= 1 ? "text-blue-600" : "text-slate-500"}`}>General Info</span>
          </div>

          {/* Step 2 marker */}
          <div className="relative z-10 flex flex-col items-center gap-1 cursor-pointer" onClick={() => (companyName ? setStep(2) : null)}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors
              ${step >= 2 ? "bg-blue-600 text-white shadow-sm shadow-blue-200" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
              2
            </div>
            <span className={`text-[12px] font-bold ${step >= 2 ? "text-blue-600" : "text-slate-500"}`}>Contact Pin</span>
          </div>

          {/* Step 3 marker */}
          <div className="relative z-10 flex flex-col items-center gap-1 cursor-pointer" onClick={() => (companyName && fullName ? setStep(3) : null)}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors
              ${step >= 3 ? "bg-blue-600 text-white shadow-sm shadow-blue-200" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
              3
            </div>
            <span className={`text-[12px] font-bold ${step >= 3 ? "text-blue-600" : "text-slate-500"}`}>Compliance</span>
          </div>
        </div>
      </section>

      {/* Steps Content Area */}
      {onboarded ? (
        <div className="bg-white border border-emerald-200 rounded-xl p-8 text-center shadow-xs flex flex-col items-center justify-center select-none py-16 animate-fade-in">
          <CheckCircle className="text-emerald-500 w-16 h-16 mb-4 animate-bounce" />
          <h3 className="font-display text-xl font-bold text-slate-900 mb-2">Registration Submitted!</h3>
          <p className="text-sm text-slate-600 max-w-md">
            Registration for <strong>{companyName}</strong> has been submitted. An admin will review and approve your application.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {step === 1 && (
            <section className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden animate-fade-in">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2 select-none">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-display text-sm font-bold text-slate-905">Company Details</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label htmlFor="comp-legal-name" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Company Legal Name *</label>
                  <input
                    id="comp-legal-name"
                    type="text"
                    required
                    placeholder="e.g. Nexus Tech Systems"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-hidden transition-all bg-white font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="vendor-cat-select" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Vendor Category *</label>
                  <select
                    id="vendor-cat-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-hidden transition-all bg-white font-medium"
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
            <section className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden animate-fade-in">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2 select-none">
                <UserSquare className="w-5 h-5 text-blue-600" />
                <h3 className="font-display text-sm font-bold text-slate-905">Contact Person details</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label htmlFor="acct-manager-name" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name *</label>
                  <input
                    id="acct-manager-name"
                    type="text"
                    required
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-hidden transition-all bg-white font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="acct-manager-email" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Corporate Email *</label>
                    <input
                      id="acct-manager-email"
                      type="email"
                      required
                      placeholder="john.doe@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-hidden transition-all bg-white font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="acct-manager-phone" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                    <input
                      id="acct-manager-phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-hidden transition-all bg-white font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="acct-manager-addr" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Main Business Address</label>
                  <input
                    id="acct-manager-addr"
                    type="text"
                    placeholder="Company Headquarters St, Floor 10, Austin TX"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-hidden transition-all bg-white font-medium"
                  />
                </div>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden animate-fade-in">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2 select-none">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-display text-sm font-bold text-slate-905">Compliance Documentation</h3>
              </div>
              <div className="p-6 space-y-6">
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Please upload valid PDF copies of your legal credentials below. Core security audits require these to avoid downstream system locks. (Max file size: 10MB per unit).
                </p>

                {/* File Slot 1: Business License */}
                <div 
                  onClick={() => setLicenseUploaded(true)}
                  className={`flex items-center justify-between p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all select-none
                    ${licenseUploaded 
                      ? "border-emerald-300 bg-emerald-50/50" 
                      : "border-slate-250 hover:border-blue-605 hover:bg-slate-50"}`}
                >
                  <div className="flex items-center gap-4">
                    <FileText className={`w-5 h-5 ${licenseUploaded ? "text-emerald-500" : "text-slate-400"}`} />
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-900">Business License *</p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {licenseUploaded ? "✅ MSA_License_Verified.pdf Ready" : "Click to select or drag PDF"}
                      </p>
                    </div>
                  </div>
                  <Upload className={`w-4 h-4 ${licenseUploaded ? "text-emerald-500" : "text-slate-400"}`} />
                </div>

                {/* File Slot 2: Tax Documents (W-9) */}
                <div 
                  onClick={() => setW9Uploaded(true)}
                  className={`flex items-center justify-between p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all select-none
                    ${w9Uploaded 
                      ? "border-emerald-300 bg-emerald-50/50" 
                      : "border-slate-250 hover:border-blue-605 hover:bg-slate-50"}`}
                >
                  <div className="flex items-center gap-4">
                    <FileText className={`w-5 h-5 ${w9Uploaded ? "text-emerald-500" : "text-slate-400"}`} />
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-900">Tax Documents / W-9 *</p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {w9Uploaded ? "✅ IRS_W9_Verified_Secured.pdf Ready" : "Click to select or drag PDF"}
                      </p>
                    </div>
                  </div>
                  <Upload className={`w-4 h-4 ${w9Uploaded ? "text-emerald-500" : "text-slate-400"}`} />
                </div>
              </div>
            </section>
          )}

          {/* Stepper Controllers */}
          <div className="flex items-center justify-between pt-4 pb-12 select-none">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleStepBackward}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-250 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                id="onboarding-prev"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous Step
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleStepForward}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors ml-auto shadow-xs cursor-pointer"
                id="onboarding-next"
              >
                Continue Details
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFormSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-7 py-3 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors ml-auto shadow-md disabled:bg-zinc-400 cursor-pointer"
                id="onboarding-submit"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Compliance...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Registration</span>
                    <ArrowRight className="w-4 h-4" />
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
