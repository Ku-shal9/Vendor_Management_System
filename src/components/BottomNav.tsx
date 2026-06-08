import { UserInfo } from "../types.js";
import { getMenuItemsForRole } from "../config/roles.js";

interface BottomNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
  user: UserInfo;
}

export default function BottomNav({ currentView, onNavigate, user }: BottomNavProps) {
  const tabs = getMenuItemsForRole(user.role);

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-2 bg-surface border-t border-border shadow-lg"
      aria-label="Mobile navigation"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentView === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onNavigate(tab.id)}
            aria-current={isActive ? "page" : undefined}
            className={`flex flex-col items-center justify-center px-3 py-2 min-h-[44px] min-w-[44px] rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              isActive ? "bg-primary-tint text-primary font-semibold" : "text-ink-muted"
            }`}
          >
            <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span className="text-xs mt-0.5">{tab.label.split(" ")[0]}</span>
          </button>
        );
      })}
    </nav>
  );
}
