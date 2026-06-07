import { LayoutDashboard, Users, UserPlus, CreditCard } from "lucide-react";
import type { UserRole } from "../types.js";

export const ROLE_LABELS: Record<UserRole, string> = {
  Admin: "Admin",
  FinancialManager: "Financial Manager",
  Vendor: "Vendor",
};

export const PORTAL_TITLES: Record<UserRole, string> = {
  Admin: "Admin Portal",
  FinancialManager: "Finance Portal",
  Vendor: "Vendor Portal",
};

export const DEFAULT_VIEW: Record<UserRole, string> = {
  Admin: "dashboard",
  FinancialManager: "payments",
  Vendor: "vendor-portal",
};

export const ROLE_MENU_ITEMS = {
  Admin: [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "vendors", label: "Vendor Directory", icon: Users },
    { id: "onboarding", label: "Onboarding", icon: UserPlus },
  ],
  FinancialManager: [
    { id: "payments", label: "Invoices & Payments", icon: CreditCard },
  ],
  Vendor: [
    { id: "vendor-portal", label: "My Portal", icon: LayoutDashboard },
  ],
} as const;

export function getMenuItemsForRole(role: UserRole) {
  return ROLE_MENU_ITEMS[role];
}

export function canAccessView(role: UserRole, view: string): boolean {
  const allowed = getMenuItemsForRole(role).map((item) => item.id);
  const shared = ["vendor-detail"];
  return allowed.includes(view) || shared.includes(view);
}
