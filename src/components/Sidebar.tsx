import { UserInfo } from "../types.js";
import { getMenuItemsForRole, PORTAL_TITLES } from "../config/roles.js";

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isOpen: boolean;
  onClose: () => void;
  user: UserInfo;
}

export default function Sidebar({ currentView, onNavigate, isOpen, onClose, user }: SidebarProps) {
  const menuItems = getMenuItemsForRole(user.role);

  const handleNavigate = (view: string) => {
    onNavigate(view);
    onClose();
  };

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-overlay md:hidden"
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col py-6 pt-20
          ${isOpen ? "w-72" : "w-0 md:w-20 overflow-hidden md:overflow-visible"}`}
        aria-label="Main navigation"
      >
        <div className="px-6 mb-6 shrink-0">
          <p className="font-display text-sm font-extrabold text-white uppercase tracking-wider whitespace-nowrap">
            {isOpen ? PORTAL_TITLES[user.role] : "VMS"}
          </p>
        </div>

        <nav className="flex-1 flex flex-col gap-1.5 px-3 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                aria-current={isActive ? "page" : undefined}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-colors relative group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  isActive
                    ? "bg-primary text-white font-semibold"
                    : "text-sidebar-ink hover:bg-sidebar-hover hover:text-ink"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span
                  className={`text-sm whitespace-nowrap ${
                    isOpen ? "opacity-100" : "opacity-0 md:absolute md:left-14 md:bg-sidebar md:text-ink md:px-2.5 md:py-1.5 md:rounded-lg md:text-xs md:opacity-0 md:group-hover:opacity-100 md:border md:border-sidebar-border"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
