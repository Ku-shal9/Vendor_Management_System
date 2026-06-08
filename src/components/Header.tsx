import { Menu, LogOut, ArrowLeft } from "lucide-react";
import { UserInfo } from "../types.js";
import { ROLE_LABELS } from "../config/roles.js";
import ThemeToggle from "./ThemeToggle.jsx";

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
    <header className="fixed top-0 left-0 right-0 z-40 bg-surface border-b border-border flex justify-between items-center w-full px-4 md:px-8 h-16 shadow-xs">
      <a href="#main-content" className="vms-skip-link">
        Skip to main content
      </a>
      <div className="flex items-center gap-3 min-w-0">
        {showBackToLogin && onBackToLogin && (
          <button
            type="button"
            onClick={onBackToLogin}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-ink-muted hover:bg-surface-muted rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Back to sign in</span>
          </button>
        )}
        {user && (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Toggle navigation menu"
            className="p-2.5 min-w-11 min-h-11 rounded-lg text-ink-muted hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <button
          type="button"
          onClick={() =>
            user &&
            onNavigate(
              user.role === "Admin" ? "dashboard" : user.role === "FinancialManager" ? "payments" : "vendor-portal"
            )
          }
          className="font-display text-lg font-extrabold text-ink md:text-xl hover:text-primary truncate focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded"
        >
          CLance Solutions
        </button>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <ThemeToggle />
        {user ? (
          <>
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-xs font-semibold text-ink">
                {user.name}
              </span>
              <span className="text-[11px] text-ink-subtle">{ROLE_LABELS[user.role]}</span>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-danger-ink hover:bg-danger-surface border border-danger-ink/20 rounded-lg font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger-ink"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </>
        ) : (
          <span className="text-xs sm:text-sm text-ink-muted hidden sm:inline">Vendor Management System</span>
        )}
      </div>
    </header>
  );
}
