import { UserInfo } from "../types.js";
import { getMenuItemsForRole, PORTAL_TITLES } from "../config/roles.js";

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isOpen: boolean;
  user: UserInfo;
}

export default function Sidebar({ currentView, onNavigate, isOpen, user }: SidebarProps) {
  const menuItems = getMenuItemsForRole(user.role);

  return (
    <>
      {isOpen && (
        <div
          onClick={() => onNavigate(currentView)}
          className="fixed inset-0 z-30 bg-black/40 md:hidden backdrop-blur-xs"
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col py-6 pt-20
          ${isOpen ? "w-72" : "w-0 md:w-20 overflow-hidden md:overflow-visible"}`}
      >
        <div className="px-6 mb-6 shrink-0">
          <h2 className="font-display text-sm font-extrabold text-white uppercase tracking-wider whitespace-nowrap">
            {isOpen ? PORTAL_TITLES[user.role] : "VMS"}
          </h2>
        </div>

        <nav className="flex-1 flex flex-col gap-1.5 px-3 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all relative group ${
                  isActive
                    ? "bg-blue-600 text-white font-semibold"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span
                  className={`text-sm whitespace-nowrap ${
                    isOpen ? "opacity-100" : "opacity-0 md:absolute md:left-14 md:bg-slate-950 md:text-white md:px-2.5 md:py-1.5 md:rounded-lg md:text-xs md:opacity-0 md:group-hover:opacity-100"
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
