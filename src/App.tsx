import { useState, useEffect } from "react";
import { Vendor, Invoice, Registration, UserInfo } from "./types.js";
import { DEFAULT_VIEW, canAccessView } from "./config/roles.js";
import { useToast } from "./context/ToastContext.js";
import { useConfirm } from "./context/ConfirmContext.js";
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
import PaymentsView from "./components/PaymentsView.jsx";
import VendorPortalView from "./components/VendorPortalView.jsx";

export default function App() {
  const { pushToast } = useToast();
  const confirm = useConfirm();
  const [currentView, setCurrentView] = useState<string>("login");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<UserInfo | null>(null);

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAllData = async () => {
    try {
      const [vRes, pRes, rRes] = await Promise.all([
        fetch("/api/vendors"),
        fetch("/api/payments"),
        fetch("/api/registrations"),
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
    } catch (err) {
      console.error("Failed to fetch data:", err);
      pushToast("Could not refresh records. Check your connection.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleLoginSuccess = (loggedInUser: UserInfo) => {
    setUser(loggedInUser);
    setCurrentView(DEFAULT_VIEW[loggedInUser.role]);
    pushToast(`Signed in as ${loggedInUser.name}`);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView("login");
    setSelectedVendor(null);
  };

  const handleNavigateTo = (view: string) => {
    if (user && !canAccessView(user.role, view)) return;
    setSelectedVendor(null);
    setCurrentView(view);
  };

  const handleSelectVendorDetail = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setCurrentView("vendor-detail");
  };

  const handleUpdateVendor = async (vendor: Vendor) => {
    const response = await fetch(`/api/vendors/${vendor.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(vendor),
    });
    if (response.ok) {
      await fetchAllData();
      pushToast("Vendor record updated");
    } else {
      pushToast("Vendor update failed", "error");
    }
  };

  const handleDeleteVendor = async (id: string) => {
    const confirmed = await confirm({
      title: "Delete vendor record",
      message: "This vendor and their linked data will be removed. This cannot be undone.",
      confirmLabel: "Delete vendor",
      destructive: true,
    });
    if (!confirmed) return;
    const response = await fetch(`/api/vendors/${id}`, { method: "DELETE" });
    if (response.ok) {
      await fetchAllData();
      setCurrentView("vendors");
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
    pushToast("Registration submitted for review");
  };

  const linkedVendor = user?.vendorId
    ? vendors.find((v) => v.id === user.vendorId)
    : undefined;

  const vendorInvoices = user?.vendorId
    ? invoices.filter((i) => i.vendorId === user.vendorId)
    : [];

  const showAuthView = !user && (currentView === "login" || currentView === "register");

  return (
    <div className="min-h-screen bg-app text-ink flex flex-col font-sans">
      <Header
        user={user}
        onLogout={handleLogout}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onNavigate={handleNavigateTo}
        onBackToLogin={() => setCurrentView("login")}
        showBackToLogin={!user && currentView === "register"}
      />

      <div className="flex-1 flex pt-16">
        {user && (
          <Sidebar
            currentView={currentView === "vendor-detail" ? "vendors" : currentView}
            onNavigate={handleNavigateTo}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            user={user}
          />
        )}

        <main
          id="main-content"
          tabIndex={-1}
          className={`flex-1 transition-all duration-300 min-w-0 outline-none ${
            user ? (sidebarOpen ? "md:pl-72" : "md:pl-20") : ""
          }`}
        >
          {loading ? (
            <div className="h-[calc(100vh-4rem)] flex flex-col items-center justify-center space-y-4" role="status" aria-live="polite">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" aria-hidden="true" />
              <p className="text-sm font-semibold text-ink-muted">Loading records...</p>
            </div>
          ) : showAuthView ? (
            currentView === "register" ? (
              <OnboardingView onSuccess={handleRegistrationSuccess} onCancel={() => setCurrentView("login")} />
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

              {currentView === "vendor-detail" && selectedVendor && user?.role === "Admin" && (
                <VendorDetailView
                  vendor={selectedVendor}
                  invoices={invoices.filter((i) => i.vendorId === selectedVendor.id)}
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

              {currentView === "payments" && user?.role === "FinancialManager" && (
                <PaymentsView
                  invoices={invoices}
                  vendors={vendors}
                  onAddInvoice={handleAddInvoice}
                  onUpdateInvoice={handleUpdateInvoice}
                  onDeleteInvoice={handleDeleteInvoice}
                />
              )}

              {currentView === "vendor-portal" && user?.role === "Vendor" && (
                <VendorPortalView
                  vendor={linkedVendor}
                  invoices={vendorInvoices}
                />
              )}
            </>
          )}
        </main>
      </div>

      {user && (
        <BottomNav
          currentView={currentView === "vendor-detail" ? "vendors" : currentView}
          onNavigate={handleNavigateTo}
          user={user}
        />
      )}

      <ToastStack />
    </div>
  );
}
