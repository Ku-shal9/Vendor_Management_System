import {
  LayoutDashboard,
  Users,
  UserPlus,
  CreditCard,
  Receipt,
  Wallet,
  Layers,
  ListOrdered,
  ShoppingBag,
  Settings,
} from "lucide-react";
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
  FinancialManager: "billing",
  Vendor: "vendor-overview",
};

export const ROLE_MENU_ITEMS = {
  Admin: [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "vendors", label: "Vendor Directory", icon: Users },
    { id: "onboarding", label: "Onboarding", icon: UserPlus },
  ],
  FinancialManager: [
    { id: "billing", label: "Billing", icon: Receipt },
    { id: "pay", label: "Pay", icon: Wallet },
    { id: "purchases", label: "Purchase Requests", icon: CreditCard },
  ],
  Vendor: [
    { id: "vendor-overview", label: "Overview", icon: Layers },
    { id: "vendor-invoices", label: "My Invoices", icon: ShoppingBag },
    { id: "vendor-purchases", label: "Purchase Requests", icon: ListOrdered },
    { id: "vendor-catalog", label: "Product Catalog", icon: ShoppingBag },
    { id: "vendor-profile", label: "Profile Settings", icon: Settings },
  ],
} as const;

export type VendorPortalTab =
  | "overview"
  | "invoices"
  | "purchases"
  | "catalog"
  | "profile";

export function vendorViewToTab(view: string): VendorPortalTab {
  const map: Record<string, VendorPortalTab> = {
    "vendor-overview": "overview",
    "vendor-invoices": "invoices",
    "vendor-purchases": "purchases",
    "vendor-catalog": "catalog",
    "vendor-profile": "profile",
  };
  return map[view] || "overview";
}

export function getMenuItemsForRole(role: UserRole) {
  return ROLE_MENU_ITEMS[role];
}

export function canAccessView(role: UserRole, view: string): boolean {
  const allowed = getMenuItemsForRole(role).map((item) => item.id);
  const shared = ["vendor-detail"];
  return allowed.includes(view) || shared.includes(view);
}
