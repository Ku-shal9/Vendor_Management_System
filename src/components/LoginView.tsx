import { useState, FormEvent } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  UserPlus,
  KeyRound,
} from "lucide-react";
import Modal from "./Modal.jsx";
import { UserInfo } from "../types.js";
import {
  getPasswordStrength,
  validateStrongPassword,
} from "../utils/password.js";
import { keepCaretAtEnd } from "../utils/inputCaret.js";
interface LoginViewProps {
  onLoginSuccess: (user: UserInfo) => void;
  onRegisterVendor: () => void;
}

export default function LoginView({
  onLoginSuccess,
  onRegisterVendor,
}: LoginViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Forgot password state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStep, setForgotStep] = useState<"email" | "otp" | "reset">(
    "email",
  );
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");

  const forgotPasswordStrength = getPasswordStrength(forgotNewPassword);
  const forgotPasswordStrengthClass = [
    "text-ink-subtle",
    "text-danger-ink",
    "text-danger-ink",
    "text-primary",
    "text-success-ink",
  ][forgotPasswordStrength.score];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        onLoginSuccess(data.user);
      } else {
        setError("Invalid credentials. Check your email and password.");
      }
    } catch {
      setError(
        "Unable to reach the server. Confirm the app is running and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Forgot password handlers
  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: forgotEmail }),
    });

    if (response.ok) {
      setForgotStep("otp");
      setForgotSuccess("OTP sent to your email");
    } else {
      const data = await response.json();
      setForgotError(data.error || "Failed to send reset email");
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setForgotError("");

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError("Passwords do not match");
      return;
    }

    const passwordError = validateStrongPassword(forgotNewPassword, "Password");
    if (passwordError) {
      setForgotError(passwordError);
      return;
    }

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: forgotEmail,
        otp: forgotOtp,
        newPassword: forgotNewPassword,
      }),
    });

    if (response.ok) {
      setForgotSuccess("Password reset successfully! You can now sign in.");
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep("email");
        setForgotEmail("");
        setForgotOtp("");
        setForgotNewPassword("");
        setForgotConfirmPassword("");
        setForgotSuccess("");
      }, 2000);
    } else {
      const data = await response.json();
      setForgotError(data.error || "Failed to reset password");
    }
  };

  const resetForgotModal = () => {
    setShowForgotModal(false);
    setForgotStep("email");
    setForgotEmail("");
    setForgotOtp("");
    setForgotNewPassword("");
    setForgotConfirmPassword("");
    setForgotError("");
    setForgotSuccess("");
  };

  return (
    <>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-app">
        <div className="w-full max-w-[440px]">
          <header className="mb-6 text-center">
            <div className="inline-flex items-center justify-center gap-2 mb-4">
              <ShieldCheck
                className="text-primary w-9 h-9"
                aria-hidden="true"
              />
              <span className="font-display text-2xl font-extrabold text-ink">
                CLance VMS
              </span>
            </div>
            <h1 className="font-display text-lg font-bold text-ink text-balance">
              Sign in to your portal
            </h1>
          </header>

          <div className="vms-panel p-8 shadow-md">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <label htmlFor="login-email" className="vms-label">
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle"
                    aria-hidden="true"
                  />
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="vms-input pl-11"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="login-password" className="vms-label">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle"
                    aria-hidden="true"
                  />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    maxLength={128}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="vms-input pl-11 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-subtle p-1 rounded focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p role="alert" className="vms-alert-error">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="vms-btn-primary w-full py-3"
              >
                {loading ? (
                  <>
                    <div
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                      aria-hidden="true"
                    />
                    Signing in...
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-4">
              <button
                type="button"
                onClick={onRegisterVendor}
                className="vms-btn-secondary w-full py-3"
              >
                <UserPlus className="w-4 h-4" aria-hidden="true" />
                Register as vendor
              </button>
            </div>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        open={showForgotModal}
        onClose={resetForgotModal}
        titleId="forgot-password-title"
        className="vms-panel p-6 max-w-md w-full shadow-xl"
      >
        <h2 id="forgot-password-title" className="font-bold text-ink mb-4">
          Reset Password
        </h2>
        {forgotStep === "email" && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <p className="text-sm text-ink-subtle">
              Enter your email to receive a password reset OTP.
            </p>
            <div>
              <label htmlFor="forgot-email" className="vms-label">
                Email address
              </label>
              <input
                id="forgot-email"
                type="email"
                required
                maxLength={254}
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="vms-input"
              />
            </div>
            {forgotError && (
              <p role="alert" className="vms-alert-error">
                {forgotError}
              </p>
            )}
            {forgotSuccess && (
              <p className="text-sm text-green-600">{forgotSuccess}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={resetForgotModal}
                className="vms-btn-secondary flex-1"
              >
                Cancel
              </button>
              <button type="submit" className="vms-btn-primary flex-1">
                Send OTP
              </button>
            </div>
          </form>
        )}

        {forgotStep === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-sm text-ink-subtle">
              Enter the OTP sent to your email and your new password.
            </p>
            <div>
              <label htmlFor="forgot-otp" className="vms-label">
                OTP Code
              </label>
              <input
                id="forgot-otp"
                type="text"
                required
                value={forgotOtp}
                onChange={(e) => {
                  setForgotOtp(e.target.value.slice(0, 8));
                  keepCaretAtEnd(e);
                }}
                className="vms-input"
                placeholder="Enter 8-character OTP"
                autoComplete="one-time-code"
                inputMode="text"
                maxLength={8}
              />
            </div>
            <div>
              <label htmlFor="forgot-new-password" className="vms-label">
                New Password
              </label>
              <input
                id="forgot-new-password"
                type="password"
                required
                minLength={8}
                maxLength={128}
                value={forgotNewPassword}
                onChange={(e) => {
                  setForgotNewPassword(e.target.value);
                  keepCaretAtEnd(e);
                }}
                className="vms-input"
                autoComplete="new-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
            {forgotNewPassword && (
              <p className="text-xs text-ink-muted">
                Password strength:{" "}
                <span
                  className={`font-semibold ${forgotPasswordStrengthClass}`}
                >
                  {forgotPasswordStrength.label}
                </span>
              </p>
            )}
            <div>
              <label htmlFor="forgot-confirm-password" className="vms-label">
                Confirm Password
              </label>
              <input
                id="forgot-confirm-password"
                type="password"
                required
                minLength={8}
                maxLength={128}
                value={forgotConfirmPassword}
                onChange={(e) => {
                  setForgotConfirmPassword(e.target.value);
                  keepCaretAtEnd(e);
                }}
                className="vms-input"
                autoComplete="new-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
            {forgotError && (
              <p role="alert" className="vms-alert-error">
                {forgotError}
              </p>
            )}
            {forgotSuccess && (
              <p className="text-sm text-green-600">{forgotSuccess}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForgotStep("email")}
                className="vms-btn-secondary flex-1"
              >
                Back
              </button>
              <button type="submit" className="vms-btn-primary flex-1">
                Reset Password
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
