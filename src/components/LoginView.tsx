import { useState, FormEvent } from "react";
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, UserPlus } from "lucide-react";
import { UserInfo, UserRole } from "../types.js";
import { ROLE_LABELS } from "../config/roles.js";
interface LoginViewProps {
  onLoginSuccess: (user: UserInfo) => void;
  onRegisterVendor: () => void;
}

export default function LoginView({ onLoginSuccess, onRegisterVendor }: LoginViewProps) {
  const [role, setRole] = useState<UserRole>("Admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRoleChange = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      if (response.ok) {
        const data = await response.json();
        onLoginSuccess(data.user);
      } else {
        setError("Invalid credentials. Check your email, password, and selected role.");
      }
    } catch {
      setError("Unable to reach the server. Confirm the app is running and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-app">
      <div className="w-full max-w-[440px]">
        <header className="mb-6 text-center">
          <div className="inline-flex items-center justify-center gap-2 mb-4">
            <ShieldCheck className="text-primary w-9 h-9" aria-hidden="true" />
            <span className="font-display text-2xl font-extrabold text-ink">CLance VMS</span>
          </div>
          <h1 className="font-display text-lg font-bold text-ink text-balance">Sign in to your portal</h1>
        </header>

        <div className="vms-panel p-8 shadow-md">
          <div
            className="flex p-1 bg-surface-muted rounded-xl mb-6"
            role="radiogroup"
            aria-label="Select role"
          >
            {(["Admin", "FinancialManager", "Vendor"] as const).map((r) => (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={role === r}
                onClick={() => handleRoleChange(r)}
                className={`flex-1 py-2 text-xs text-center font-semibold rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  role === r ? "bg-surface text-ink shadow-xs" : "text-ink-subtle hover:bg-surface/80"
                }`}
              >
                {ROLE_LABELS[r]}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label htmlFor="login-email" className="vms-label">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" aria-hidden="true" />
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
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" aria-hidden="true" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="vms-input pl-11 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-subtle p-1 rounded focus-visible:outline-2 focus-visible:outline-primary"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="vms-alert-error">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="vms-btn-primary w-full py-3">
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                  Signing in...
                </>
              ) : (
                <>
                  <span>Sign in as {ROLE_LABELS[role]}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4">
            <button type="button" onClick={onRegisterVendor} className="vms-btn-secondary w-full py-3">
              <UserPlus className="w-4 h-4" aria-hidden="true" />
              Register as vendor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
