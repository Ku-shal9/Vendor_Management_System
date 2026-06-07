import { useState, useEffect } from "react";
import { Vendor, Invoice, Registration, UserInfo } from "./types.js";
import { DEFAULT_VIEW, canAccessView } from "./config/roles.js";
import Header from "./components/Header.jsx";
import Sidebar from "./components/Sidebar.jsx";
import BottomNav from "./components/BottomNav.jsx";
import LoginView from "./components/LoginView.jsx";
import DashboardView from "./components/DashboardView.jsx";
import VendorDirectoryView from "./components/VendorDirectoryView.jsx";
import VendorDetailView from "./components/VendorDetailView.jsx";
import OnboardingView from "./components/OnboardingView.jsx";
import AdminOnboardingView from "./components/AdminOnboardingView.jsx";
import PaymentsView from "./components/PaymentsView.jsx";
import VendorPortalView from "./components/VendorPortalView.jsx";

export default function App() {
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
    if (response.ok) fetchAllData();
  };

  const handleDeleteVendor = async (id: string) => {
    if (!confirm("Delete this vendor record?")) return;
    const response = await fetch(`/api/vendors/${id}`, { method: "DELETE" });
    if (response.ok) {
      fetchAllData();
      setCurrentView("vendors");
    }
  };

  const handleAddInvoice = async (invoicePayload: Partial<Invoice>) => {
    const response = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invoicePayload),
    });
    if (response.ok) fetchAllData();
  };

  const handleUpdateInvoice = async (id: string, updates: Partial<Invoice>) => {
    const response = await fetch(`/api/invoices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (response.ok) fetchAllData();
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm("Delete this invoice?")) return;
    const response = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    if (response.ok) fetchAllData();
  };

  const handleApproveRegistration = async (id: string) => {
    const response = await fetch("/api/registrations/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (response.ok) fetchAllData();
  };

  const handleRejectRegistration = async (id: string) => {
    const response = await fetch("/api/registrations/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (response.ok) fetchAllData();
  };

  const handleRegistrationSuccess = () => {
    fetchAllData();
    setCurrentView("login");
  };

  const linkedVendor = user?.vendorId
    ? vendors.find((v) => v.id === user.vendorId)
    : undefined;

  const vendorInvoices = user?.vendorId
    ? invoices.filter((i) => i.vendorId === user.vendorId)
    : [];

  const showAuthView = !user && (currentView === "login" || currentView === "register");

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] flex flex-col font-sans">
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
            user={user}
          />
        )}

        <main
          className={`flex-1 transition-all duration-300 min-w-0 ${
            user ? (sidebarOpen ? "md:pl-72" : "md:pl-20") : ""
          }`}
        >
          {loading ? (
            <div className="h-[calc(100vh-4rem)] flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-[#00687a] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold text-[#45464d]">Loading VMS...</p>
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
    </div>
  );
}
