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
        setError("Invalid credentials. Please check your email, password, and role.");
      }
    } catch {
      setError("Unable to reach server. Make sure the app is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-slate-50">
      <section className="hidden md:flex md:w-1/2 relative bg-slate-900 items-center justify-center p-12">
        <div className="relative z-10 max-w-lg text-center">
          <div className="w-full h-48 bg-gradient-to-br from-blue-600 to-slate-800 rounded-2xl mb-8 flex items-center justify-center">
            <ShieldCheck className="w-20 h-20 text-white/80" />
          </div>
          <h1 className="font-display text-3xl font-extrabold text-white mb-4">
            CLance Solutions
          </h1>
        </div>
      </section>

      <main className="w-full md:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-[440px] bg-white p-8 rounded-2xl border border-slate-200 shadow-md">
          <header className="mb-8">
            <div className="inline-flex items-center gap-2 mb-3">
              <ShieldCheck className="text-blue-600 w-8 h-8" />
              <span className="font-display text-xl font-extrabold text-slate-900">VMS Portal</span>
            </div>
            <h2 className="font-display text-lg font-bold text-slate-900">Welcome Back</h2>
          </header>

          <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
            {(["Admin", "FinancialManager", "Vendor"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRoleChange(r)}
                className={`flex-1 py-1.5 text-xs text-center font-semibold rounded-lg transition-all ${
                  role === r ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:bg-slate-200/50"
                }`}
              >
                {ROLE_LABELS[r]}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label htmlFor="login-email" className="block text-xs font-bold text-slate-500 uppercase">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="login-password" className="block text-xs font-bold text-slate-500 uppercase">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-rose-600 font-medium bg-rose-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <span>Login as {ROLE_LABELS[role]}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4">
            <button
              type="button"
              onClick={onRegisterVendor}
              className="w-full py-3 border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-50 flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Register Vendor
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
