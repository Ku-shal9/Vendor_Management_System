import { useState, useEffect } from "react";
import {
  getUserSession,
  setUserSession,
  clearUserSession,
  getViewSession,
  setViewSession,
  clearViewSession,
} from "./utils/session.js";
import {
  Vendor,
  Invoice,
  Bill,
  Registration,
  UserInfo,
  PurchaseRequest,
} from "./types.js";
import {
  DEFAULT_VIEW,
  canAccessView,
  vendorViewToTab,
} from "./config/roles.js";
import { useToast } from "./context/ToastContext.js";
import { useConfirm } from "./context/ConfirmContext.js";
import { useNotifications } from "./context/NotificationContext.js";
import Header from "./components/Header.jsx";
import Sidebar from "./components/Sidebar.jsx";
import BottomNav from "./components/BottomNav.jsx";
import ToastStack from "./components/ToastStack.jsx";
import LoginView from "./components/LoginView.jsx";
import DashboardView from "./components/DashboardView.jsx";
import VendorDirectoryView from "./components/VendorDirectoryView.jsx";
import VendorDetailView from "./components/VendorDetailView.jsx";
import OnboardingView from "./components/OnboardingView.jsx";
import AdminOnboardingView from "./components/AdminOnboardingView.jsx";
import BillingView from "./components/BillingView.jsx";
import PayView from "./components/PayView.jsx";
import PurchasesView from "./components/PurchasesView.jsx";
import VendorPortalView from "./components/VendorPortalView.jsx";

export default function App() {
  const { pushToast } = useToast();
  const confirm = useConfirm();
  const { fetchNotifications } = useNotifications();
  const [user, setUser] = useState<UserInfo | null>(() => getUserSession());
  const [currentView, setCurrentView] = useState<string>(() => {
    const savedUser = getUserSession();
    if (savedUser) {
      return getViewSession() || DEFAULT_VIEW[savedUser.role];
    }
    return "login";
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRequest[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAllData = async () => {
    try {
      const [vRes, pRes, rRes, purRes, bRes] = await Promise.all([
        fetch("/api/vendors"),
        fetch("/api/payments"),
        fetch("/api/registrations"),
        fetch("/api/purchases"),
        fetch("/api/bills"),
      ]);

      if (vRes.ok) {
        const vData = await vRes.json();
        setVendors(vData.vendors || []);
      }
      if (pRes.ok) {
        const pData = await pRes.json();
        setInvoices(pData.invoices || []);
      }
      if (rRes.ok) {
        const rData = await rRes.json();
        setRegistrations(rData.registrations || []);
      }
      if (purRes.ok) {
        const purData = await purRes.json();
        setPurchases(purData.purchases || []);
      }
      if (bRes.ok) {
        const bData = await bRes.json();
        setBills(bData.bills || []);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
      pushToast("Could not refresh records. Check your connection.", "error");
    } finally {
      setLoading(false);
    }
  };

  const refreshBills = async () => {
    try {
      const response = await fetch("/api/bills");
      if (response.ok) {
        const data = await response.json();
        setBills(data.bills || []);
      }
    } catch (err) {
      console.error("Failed to refresh bills:", err);
    }
  };

  useEffect(() => {
    fetchAllData();
    const savedUser = getUserSession();
    if (savedUser) {
      fetchNotifications(savedUser.email);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const interval = setInterval(fetchAllData, 5000);
    return () => clearInterval(interval);
  }, [user?.email]);

  const handleLoginSuccess = (loggedInUser: UserInfo) => {
    setUser(loggedInUser);
    const defaultView = DEFAULT_VIEW[loggedInUser.role];
    setCurrentView(defaultView);
    setUserSession(loggedInUser);
    setViewSession(defaultView);
    pushToast(`Signed in as ${loggedInUser.name}`);
    // Fetch notifications for the logged-in user
    fetchNotifications(loggedInUser.email);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView("login");
    setSelectedVendor(null);
    clearUserSession();
    clearViewSession();
  };

  const handleNavigateTo = (view: string) => {
    if (user && !canAccessView(user.role, view)) return;
    setSelectedVendor(null);
    setCurrentView(view);
    setViewSession(view);
  };

  const handleSelectVendorDetail = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setCurrentView("vendor-detail");
    setViewSession("vendor-detail");
  };

  const handleUpdateVendor = async (vendor: Vendor) => {
    const response = await fetch(`/api/vendors/${vendor.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(vendor),
    });
    if (response.ok) {
      const data = await response.json();
      await fetchAllData();
      setSelectedVendor(
        data.vendor || vendors.find((item) => item.id === vendor.id) || null,
      );
      pushToast("Vendor record updated");
    } else {
      pushToast("Vendor update failed", "error");
    }
  };

  const handleDeleteVendor = async (id: string) => {
    const confirmed = await confirm({
      title: "Delete vendor record",
      message:
        "This vendor and their linked data will be removed. This cannot be undone.",
      confirmLabel: "Delete vendor",
      destructive: true,
    });
    if (!confirmed) return;
    const response = await fetch(`/api/vendors/${id}`, { method: "DELETE" });
    if (response.ok) {
      await fetchAllData();
      setCurrentView("vendors");
      setViewSession("vendors");
      pushToast("Vendor record deleted");
    } else {
      pushToast("Vendor delete failed", "error");
    }
  };

  const handleAddInvoice = async (invoicePayload: Partial<Invoice>) => {
    const response = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invoicePayload),
    });
    if (response.ok) {
      await fetchAllData();
      pushToast("Invoice created");
    } else {
      pushToast("Invoice create failed", "error");
    }
  };

  const handleUpdateInvoice = async (id: string, updates: Partial<Invoice>) => {
    const response = await fetch(`/api/invoices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (response.ok) {
      await fetchAllData();
      pushToast("Invoice updated");
    } else {
      pushToast("Invoice update failed", "error");
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    const confirmed = await confirm({
      title: "Delete invoice",
      message: "This invoice will be permanently removed from payment records.",
      confirmLabel: "Delete invoice",
      destructive: true,
    });
    if (!confirmed) return;
    const response = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    if (response.ok) {
      await fetchAllData();
      pushToast("Invoice deleted");
    } else {
      pushToast("Invoice delete failed", "error");
    }
  };

  const handleApproveRegistration = async (id: string) => {
    const response = await fetch("/api/registrations/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (response.ok) {
      await fetchAllData();
      pushToast("Registration approved");
    } else {
      pushToast("Approval failed", "error");
    }
  };

  const handleRejectRegistration = async (id: string) => {
    const response = await fetch("/api/registrations/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (response.ok) {
      await fetchAllData();
      pushToast("Registration rejected");
    } else {
      pushToast("Rejection failed", "error");
    }
  };

  const handleRegistrationSuccess = () => {
    fetchAllData();
    setCurrentView("login");
    clearUserSession();
    clearViewSession();
    pushToast("Registration submitted for review");
  };

  const handleAddPurchase = async (
    purchasePayload: Partial<PurchaseRequest>,
  ) => {
    const response = await fetch("/api/purchases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...purchasePayload,
        createdBy: user?.email,
      }),
    });
    if (response.ok) {
      await fetchAllData();
      pushToast("Purchase request created");
    } else {
      pushToast("Purchase request creation failed", "error");
    }
  };

  const handleUpdatePurchase = async (
    id: string,
    updates: Partial<PurchaseRequest>,
  ) => {
    const response = await fetch(`/api/purchases/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (response.ok) {
      await fetchAllData();
      pushToast("Purchase request updated");
      if (user) fetchNotifications(user.email);
    } else {
      pushToast("Purchase request update failed", "error");
    }
  };

  const handlePayBill = async (billId: string) => {
    const response = await fetch(`/api/bills/${billId}/pay`, {
      method: "POST",
    });
    if (response.ok) {
      await fetchAllData();
      pushToast("Payment successful — invoice generated");
      if (user) fetchNotifications(user.email);
      return true;
    }
    const data = await response.json().catch(() => ({}));
    pushToast(data.error || "Payment failed", "error");
    return false;
  };

  const handleDeletePurchase = async (id: string) => {
    const response = await fetch(`/api/purchases/${id}`, { method: "DELETE" });
    if (response.ok) {
      await fetchAllData();
      pushToast("Purchase request deleted");
    } else {
      pushToast("Purchase request deletion failed", "error");
    }
  };

  const linkedVendor = user?.vendorId
    ? vendors.find((v) => v.id === user.vendorId)
    : undefined;

  const vendorInvoices = user?.vendorId
    ? invoices.filter(
        (i) => i.vendorId === user.vendorId && i.status === "Paid",
      )
    : [];

  const showAuthView =
    !user && (currentView === "login" || currentView === "register");

  return (
    <div className="min-h-screen bg-app text-ink flex flex-col font-sans">
      <Header
        user={user}
        onLogout={handleLogout}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
        onNavigate={handleNavigateTo}
        onBackToLogin={() => setCurrentView("login")}
        showBackToLogin={!user && currentView === "register"}
      />

      <div className="flex-1 flex pt-16">
        {user && (
          <Sidebar
            currentView={
              currentView === "vendor-detail"
                ? "vendors"
                : currentView.startsWith("vendor-")
                  ? currentView
                  : currentView
            }
            onNavigate={handleNavigateTo}
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            onClose={() => setSidebarOpen(false)}
            user={user}
          />
        )}

        <main
          id="main-content"
          tabIndex={-1}
          className={`flex-1 transition-all duration-300 min-w-0 outline-none ${
            user ? (sidebarOpen ? "md:pl-72" : "md:pl-[4.5rem]") : ""
          }`}
        >
          {loading ? (
            <div
              className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center space-y-4"
              role="status"
              aria-live="polite"
            >
              <div
                className="w-11 h-11 border-4 border-primary/20 border-t-primary rounded-full animate-spin"
                aria-hidden="true"
              />
              <p className="text-sm font-semibold text-ink">
                Loading records...
              </p>
            </div>
          ) : showAuthView ? (
            currentView === "register" ? (
              <OnboardingView
                onSuccess={handleRegistrationSuccess}
                onCancel={() => setCurrentView("login")}
              />
            ) : (
              <LoginView
                onLoginSuccess={handleLoginSuccess}
                onRegisterVendor={() => setCurrentView("register")}
              />
            )
          ) : (
            <>
              {currentView === "dashboard" && user?.role === "Admin" && (
                <DashboardView
                  vendors={vendors}
                  registrations={registrations}
                  onApproveRegistration={handleApproveRegistration}
                  onRejectRegistration={handleRejectRegistration}
                  onNavigate={handleNavigateTo}
                />
              )}

              {currentView === "vendors" && user?.role === "Admin" && (
                <VendorDirectoryView
                  vendors={vendors}
                  onSelectVendor={handleSelectVendorDetail}
                  onDeleteVendor={handleDeleteVendor}
                />
              )}

              {currentView === "vendor-detail" &&
                selectedVendor &&
                user?.role === "Admin" && (
                  <VendorDetailView
                    vendor={selectedVendor}
                    invoices={invoices.filter(
                      (i) => i.vendorId === selectedVendor.id,
                    )}
                    onNavigateBack={() => handleNavigateTo("vendors")}
                    onUpdateVendor={handleUpdateVendor}
                    onDeleteVendor={handleDeleteVendor}
                  />
                )}

              {currentView === "onboarding" && user?.role === "Admin" && (
                <AdminOnboardingView
                  registrations={registrations}
                  onApprove={handleApproveRegistration}
                  onReject={handleRejectRegistration}
                />
              )}

              {currentView === "billing" &&
                user?.role === "FinancialManager" && (
                  <BillingView bills={bills} />
                )}

              {currentView === "pay" && user?.role === "FinancialManager" && (
                <PayView bills={bills} onPayBill={handlePayBill} />
              )}

              {currentView === "purchases" &&
                user?.role === "FinancialManager" && (
                  <PurchasesView
                    vendors={vendors}
                    purchases={purchases}
                    onAddPurchase={handleAddPurchase}
                    onDeletePurchase={handleDeletePurchase}
                  />
                )}

              {currentView.startsWith("vendor-") && user?.role === "Vendor" && (
                <VendorPortalView
                  vendor={linkedVendor}
                  invoices={vendorInvoices}
                  purchases={purchases}
                  onUpdateVendor={handleUpdateVendor}
                  onUpdatePurchase={handleUpdatePurchase}
                  user={user}
                  activeTab={vendorViewToTab(currentView)}
                />
              )}
            </>
          )}
        </main>
      </div>

      {user && (
        <BottomNav
          currentView={
            currentView === "vendor-detail"
              ? "vendors"
              : currentView.startsWith("vendor-")
                ? currentView
                : currentView
          }
          onNavigate={handleNavigateTo}
          user={user}
        />
      )}

      <ToastStack />
    </div>
  );
}
