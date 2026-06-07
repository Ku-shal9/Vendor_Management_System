import { Menu, LogOut, ArrowLeft } from "lucide-react";
import { UserInfo } from "../types.js";
import { ROLE_LABELS } from "../config/roles.js";

interface HeaderProps {
  user: UserInfo | null;
  onLogout: () => void;
  onToggleSidebar: () => void;
  onNavigate: (view: string) => void;
  onBackToLogin?: () => void;
  showBackToLogin?: boolean;
}

export default function Header({
  user,
  onLogout,
  onToggleSidebar,
  onNavigate,
  onBackToLogin,
  showBackToLogin,
}: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 flex justify-between items-center w-full px-4 md:px-10 h-16 shadow-xs">
      <div className="flex items-center gap-4">
        {showBackToLogin && onBackToLogin && (
          <button
            onClick={onBackToLogin}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>
        )}
        {user && (
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-full text-slate-500 hover:bg-slate-100"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <span
          onClick={() =>
            user &&
            onNavigate(
              user.role === "Admin" ? "dashboard" : user.role === "FinancialManager" ? "payments" : "vendor-portal"
            )
          }
          className="font-display text-xl font-extrabold text-slate-900 cursor-pointer md:text-2xl hover:text-blue-600"
        >
          CLance Solutions
        </span>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="hidden text-right md:flex flex-col">
              <span className="text-[12px] font-semibold text-slate-900">
                {user.name} ({ROLE_LABELS[user.role]})
              </span>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        ) : (
          <span className="text-sm text-slate-500">Vendor Management System</span>
        )}
      </div>
    </header>
  );
}
