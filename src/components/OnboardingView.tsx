import { useState } from "react";
import {
  Upload,
  FileText,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Building2,
  UserSquare,
} from "lucide-react";
import {
  documentMimeTypes,
  MAX_DOCUMENT_SIZE_BYTES,
  validateBase64Document,
  validateEmail,
  validateFilename,
  validateMimeType,
  validateOptionalText,
  validatePanNumber,
  validatePhone,
  validateRequiredText,
} from "../utils/validation.js";
import PhoneInput from "./PhoneInput.jsx";
interface OnboardingViewProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

export default function OnboardingView({
  onSuccess,
  onCancel,
}: OnboardingViewProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [companyName, setCompanyName] = useState("");
  const [category, setCategory] = useState("Cloud Infrastructure");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [w9File, setW9File] = useState<File | null>(null);
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
    if (step === 1) {
      const nameError = validateRequiredText(
        companyName,
        "Company legal name",
        { max: 120 },
      );
      if (nameError) {
        setFormError(nameError);
        return;
      }
    }
    if (step === 2) {
      const nameError = validateRequiredText(fullName, "Contact name", {
        max: 120,
      });
      const emailError = validateEmail(email, "Corporate email");
      const phoneError = validatePhone(phone, false);
      const panError = validatePanNumber(panNumber, "PAN number");
      const addressError = validateOptionalText(
        address,
        "Business address",
        300,
      );
      const error = [
        nameError,
        emailError,
        phoneError,
        panError,
        addressError,
      ].find(Boolean);
      if (error) {
        setFormError(error as string);
        return;
      }
    }
    setStep((prev) => (prev < 3 ? ((prev + 1) as 1 | 2 | 3) : prev));
  };

  const handleStepBackward = () => {
    setFormError("");
    setStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : prev));
  };

  const readFileAsBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1] || "");
      };
      reader.onerror = () => reject(new Error("Could not read file"));
      reader.readAsDataURL(file);
    });

  const handleFormSubmit = async () => {
    setFormError("");
    if (!licenseFile || !w9File) {
      setFormError(
        "Upload both the business license and W-9 before submitting.",
      );
      return;
    }

    const nameError = validateRequiredText(companyName, "Company legal name", {
      max: 120,
    });
    const emailError = validateEmail(email, "Corporate email");
    const phoneError = validatePhone(phone, false);
    const panError = validatePanNumber(panNumber, "PAN number");
    const addressError = validateOptionalText(address, "Business address", 300);
    const formError = [
      nameError,
      emailError,
      phoneError,
      panError,
      addressError,
    ].find(Boolean);
    if (formError) {
      setFormError(formError as string);
      return;
    }

    if (
      !documentMimeTypes.includes(
        licenseFile.type as (typeof documentMimeTypes)[number],
      )
    ) {
      setFormError("Business license must be a PDF file.");
      return;
    }
    if (
      !documentMimeTypes.includes(
        w9File.type as (typeof documentMimeTypes)[number],
      )
    ) {
      setFormError("W-9 document must be a PDF file.");
      return;
    }
    if (
      licenseFile.size > MAX_DOCUMENT_SIZE_BYTES ||
      w9File.size > MAX_DOCUMENT_SIZE_BYTES
    ) {
      setFormError("Each document must be 5MB or smaller.");
      return;
    }

    setSubmitting(true);

    try {
      const [licenseData, w9Data] = await Promise.all([
        readFileAsBase64(licenseFile),
        readFileAsBase64(w9File),
      ]);

      const documentError = [
        validateBase64Document(licenseData, "Business license"),
        validateBase64Document(w9Data, "W-9 document"),
        validateFilename(licenseFile.name, "Business license filename"),
        validateFilename(w9File.name, "W-9 filename"),
        validateMimeType(
          licenseFile.type,
          documentMimeTypes,
          "Business license",
        ),
        validateMimeType(w9File.type, documentMimeTypes, "W-9 document"),
      ].find(Boolean);
      if (documentError) {
        setFormError(documentError as string);
        setSubmitting(false);
        return;
      }

      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          category,
          panNumber,
          contactName: fullName,
          contactEmail: email,
          contactPhone: phone,
          address: address || "Not provided",
          documentsBase64: {
            license: {
              name: licenseFile.name,
              data: licenseData,
              mimeType: licenseFile.type,
            },
            w9: { name: w9File.name, data: w9Data, mimeType: w9File.type },
          },
        }),
      });

      if (response.ok) {
        setOnboarded(true);
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        setFormError(
          "Registration could not be saved. Try again or contact support.",
        );
      }
    } catch {
      setFormError(
        "Network error while submitting. Check your connection and try again.",
      );
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

      <div
        className="flex items-center justify-between relative mb-8 px-1.5"
        aria-label="Registration progress"
      >
        <div
          className="absolute top-4 left-0 right-0 h-0.5 bg-border"
          aria-hidden="true"
        />
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
          <div
            key={n}
            className="relative z-10 flex flex-col items-center gap-1"
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= n
                ? "bg-primary text-white"
                : "bg-surface text-ink-muted border border-border"
                }`}
            >
              {n}
            </div>
            <span
              className={`text-xs font-semibold ${step >= n ? "text-primary" : "text-ink-muted"}`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {onboarded ? (
        <div className="vms-panel p-8 text-center flex flex-col items-center py-16 border-success-ink/20">
          <CheckCircle
            className="text-success-ink w-14 h-14 mb-4"
            aria-hidden="true"
          />
          <h3 className="font-display text-xl font-bold text-ink mb-2">
            Registration submitted
          </h3>
          <p className="text-sm text-ink-muted max-w-md">
            Registration for <strong className="text-ink">{companyName}</strong>{" "}
            is pending admin review.
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
                <Building2
                  className="w-5 h-5 text-primary"
                  aria-hidden="true"
                />
                <h3 className="text-sm font-bold text-ink">Company details</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label htmlFor="comp-legal-name" className="vms-label">
                    Company legal name *
                  </label>
                  <input
                    id="comp-legal-name"
                    type="text"
                    required
                    maxLength={120}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="vms-input"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="vendor-cat-select" className="vms-label">
                    Vendor category *
                  </label>
                  <select
                    id="vendor-cat-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="vms-input"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="vms-panel overflow-hidden">
              <div className="p-5 border-b border-border-subtle bg-surface-muted flex items-center gap-2">
                <UserSquare
                  className="w-5 h-5 text-primary"
                  aria-hidden="true"
                />
                <h3 className="text-sm font-bold text-ink">Contact person</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label htmlFor="acct-manager-name" className="vms-label">
                    Full name *
                  </label>
                  <input
                    id="acct-manager-name"
                    type="text"
                    required
                    maxLength={120}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="vms-input"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="acct-manager-email" className="vms-label">
                      Corporate email *
                    </label>
                    <input
                      id="acct-manager-email"
                      type="email"
                      required
                      maxLength={254}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="vms-input"
                    />
                  </div>
                  <PhoneInput
                    id="acct-manager-phone"
                    label="Phone number"
                    value={phone}
                    maxLength={30}
                    onChange={setPhone}
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="vendor-pan" className="vms-label">
                    PAN number *
                  </label>
                  <input
                    id="vendor-pan"
                    type="text"
                    inputMode="numeric"
                    maxLength={9}
                    value={panNumber}
                    onChange={(e) =>
                      setPanNumber(
                        e.target.value.replace(/\D/g, "").slice(0, 9),
                      )
                    }
                    placeholder="123456789"
                    className="vms-input"
                    required
                  />
                  <p className="text-xs text-ink-muted">
                    Enter a unique 9-digit PAN number.
                  </p>
                </div>
                <div className="space-y-1">
                  <label htmlFor="acct-manager-addr" className="vms-label">
                    Business address
                  </label>
                  <input
                    id="acct-manager-addr"
                    type="text"
                    maxLength={300}
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
                <h3 className="text-sm font-bold text-ink">
                  Compliance documents
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-ink-muted">
                  Upload PDF copies of your company registration and proposal documents. These are
                  required for vendor approval. PDF only, maximum 5MB each.
                </p>

                {/* Business License Upload */}
                <div>
                  <input
                    type="file"
                    id="license-file-input"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setLicenseFile(file);
                    }}
                  />
                  <div
                    onClick={() =>
                      document.getElementById("license-file-input")?.click()
                    }
                    className={`w-full flex items-center justify-between p-4 border-2 border-dashed rounded-xl text-left cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${licenseFile
                      ? "border-success-ink/30 bg-success-surface"
                      : "border-border hover:border-primary/40 hover:bg-surface-muted"
                      }`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        document.getElementById("license-file-input")?.click();
                      }
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <FileText
                        className={`w-5 h-5 ${licenseFile ? "text-success-ink" : "text-ink-subtle"}`}
                        aria-hidden="true"
                      />
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          Company Registration *
                        </p>
                        <p className="text-xs text-ink-muted">
                          {licenseFile
                            ? licenseFile.name
                            : "Select or upload PDF (max 5MB)"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {licenseFile && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLicenseFile(null);
                            const input = document.getElementById(
                              "license-file-input",
                            ) as HTMLInputElement;
                            if (input) input.value = "";
                          }}
                          className="p-1 hover:bg-black/10 rounded text-xs font-semibold text-danger-ink"
                        >
                          Remove
                        </button>
                      )}
                      <Upload
                        className={`w-4 h-4 ${licenseFile ? "text-success-ink" : "text-ink-subtle"}`}
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                </div>

                {/* W-9 Upload */}
                <div>
                  <input
                    type="file"
                    id="w9-file-input"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setW9File(file);
                    }}
                  />
                  <div
                    onClick={() =>
                      document.getElementById("w9-file-input")?.click()
                    }
                    className={`w-full flex items-center justify-between p-4 border-2 border-dashed rounded-xl text-left cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${w9File
                      ? "border-success-ink/30 bg-success-surface"
                      : "border-border hover:border-primary/40 hover:bg-surface-muted"
                      }`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        document.getElementById("w9-file-input")?.click();
                      }
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <FileText
                        className={`w-5 h-5 ${w9File ? "text-success-ink" : "text-ink-subtle"}`}
                        aria-hidden="true"
                      />
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          Propsal Document *
                        </p>
                        <p className="text-xs text-ink-muted">
                          {w9File
                            ? w9File.name
                            : "Select or upload PDF (max 5MB)"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {w9File && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setW9File(null);
                            const input = document.getElementById(
                              "w9-file-input",
                            ) as HTMLInputElement;
                            if (input) input.value = "";
                          }}
                          className="p-1 hover:bg-black/10 rounded text-xs font-semibold text-danger-ink"
                        >
                          Remove
                        </button>
                      )}
                      <Upload
                        className={`w-4 h-4 ${w9File ? "text-success-ink" : "text-ink-subtle"}`}
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          <div className="flex items-center justify-between pt-2">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleStepBackward}
                className="vms-btn-secondary"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                Previous step
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleStepForward}
                className="vms-btn-primary ml-auto"
              >
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
                    <div
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                      aria-hidden="true"
                    />
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
