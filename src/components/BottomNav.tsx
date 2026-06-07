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
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-3 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentView === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            className={`flex flex-col items-center justify-center p-1 px-3 transition-all min-h-[44px] ${
              isActive ? "bg-blue-50 text-blue-600 rounded-full font-semibold" : "text-slate-500"
            }`}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="text-[10px] mt-0.5 font-medium">{tab.label.split(" ")[0]}</span>
          </button>
        );
      })}
    </nav>
  );
}
