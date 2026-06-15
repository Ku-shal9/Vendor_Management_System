import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { UserInfo } from "../types.js";
import { getMenuItemsForRole, PORTAL_TITLES } from "../config/roles.js";

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  user: UserInfo;
}

export default function Sidebar({ currentView, onNavigate, isOpen, onToggle, onClose, user }: SidebarProps) {
  const menuItems = getMenuItemsForRole(user.role);

  const handleNavigate = (view: string) => {
    onNavigate(view);
    if (window.matchMedia("(max-width: 767px)").matches) {
      onClose();
    }
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
        aria-label="Main navigation"
        className={`fixed top-0 left-0 bottom-0 z-40 bg-sidebar border-r border-sidebar-border flex flex-col py-6 pt-20 transition-[width,transform] duration-300 ease-out
          ${isOpen ? "w-72 translate-x-0" : "-translate-x-full w-72 md:translate-x-0 md:w-20"}`}
      >
        <div className="px-4 mb-4 shrink-0 flex items-center justify-between gap-2">
          <p
            className={`font-display text-sm font-extrabold text-white uppercase tracking-wider whitespace-nowrap transition-opacity ${
              isOpen ? "opacity-100" : "opacity-0 md:opacity-100 md:truncate md:text-[10px] md:tracking-normal"
            }`}
          >
            {isOpen ? PORTAL_TITLES[user.role] : "VMS"}
          </p>
          <button
            type="button"
            onClick={onToggle}
            aria-label={isOpen ? "Collapse navigation menu" : "Expand navigation menu"}
            className="hidden md:inline-flex items-center justify-center w-9 h-9 rounded-lg text-sidebar-ink hover:bg-sidebar-hover hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary shrink-0"
          >
            {isOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
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
                title={!isOpen ? item.label : undefined}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-colors relative group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  isActive
                    ? "bg-primary text-white font-semibold"
                    : "text-sidebar-ink hover:bg-sidebar-hover hover:text-white"
                } ${!isOpen ? "md:justify-center md:px-0" : ""}`}
              >
                <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span
                  className={`text-sm whitespace-nowrap ${
                    isOpen
                      ? "opacity-100"
                      : "sr-only md:not-sr-only md:sr-only md:absolute md:left-full md:ml-2 md:bg-sidebar md:text-white md:px-2.5 md:py-1.5 md:rounded-lg md:text-xs md:opacity-0 md:group-hover:opacity-100 md:border md:border-sidebar-border md:pointer-events-none"
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
