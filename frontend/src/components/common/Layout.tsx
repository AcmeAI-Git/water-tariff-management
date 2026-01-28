import { Outlet, useLocation, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { MeterReaderSidebar } from "./MeterReaderSidebar";
import { CustomerAdminSidebar } from "./CustomerAdminSidebar";
import { TariffAdminSidebar } from "./TariffAdminSidebar";
import { ApprovalAdminSidebar } from "./ApprovalAdminSidebar";
import { GeneralAdminSidebar } from "./GeneralAdminSidebar";
import { Sheet, SheetContent } from "../ui/sheet";
import { useIsMobile } from "../ui/use-mobile";

export type LayoutProps = { children?: ReactNode };

export default function Layout({ children }: LayoutProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  const isMeterAdmin = pathname.startsWith("/meter-reader");
  const isCustomerAdmin = pathname.startsWith("/customer-admin");
  const isTariffAdmin = pathname.startsWith("/tariff-admin");
  const isApprovalAdmin = pathname.startsWith("/approval-admin");
  const isGeneralInfoAdmin = pathname.startsWith("/general-admin");
  const isSuperAdmin = pathname.startsWith("/admin");

  // meter reader helper
  const meterActive = isMeterAdmin
    ? pathname.replace("/meter-reader/", "").replace(/\/.*$/, "")
    : "";

  const handleMeterNavigate = (id: string) => {
    if (id === "logout") {
      localStorage.removeItem("authToken");
      sessionStorage.clear();
      navigate("/login");
      return;
    }
    navigate("/meter-reader/" + id.replace(/^meter-reader-/, ""));
  };

  // customer admin helper
  const customerActive = isCustomerAdmin
    ? pathname.replace("/customer-admin/", "").replace(/\/.*$/, "")
    : "";

  const handleCustomerNavigate = (id: string) => {
    if (id === "logout") {
      localStorage.removeItem("authToken");
      sessionStorage.clear();
      navigate("/login");
      return;
    }
    const map: Record<string, string> = {
      "customer-admin-customers": "/customer-admin/customers",
      "customer-admin-pending": "/customer-admin/pending",
      "customer-admin-metrics": "/customer-admin/metrics",
      "customer-admin-billing": "/customer-admin/billing",
    };
    const path = map[id] ?? "/customer-admin/customers";
    navigate(path);
  };

  // Tariff admin helpers
  const tariffRouteMap: Record<string, string> = {
    "tariff-config": "/tariff-admin/config",
    "tariff-history": "/tariff-admin/history",
    "zone-scoring": "/tariff-admin/zone-scoring",
    "location-management": "/tariff-admin/location-management",
    "my-metrics": "/tariff-admin/metrics",
  };
  const tariffActive = isTariffAdmin
    ? (() => {
        if (pathname.startsWith("/tariff-admin/zone-scoring")) return "zone-scoring";
        if (pathname.startsWith("/tariff-admin/location-management")) return "location-management";
        const match = pathname.match(/^\/tariff-admin\/(\w+)/);
        if (!match) return "tariff-config";
        switch (match[1]) {
          case "config": return "tariff-config";
          case "history": return "tariff-history";
          case "metrics": return "my-metrics";
          case "areas": return "location-management";
          default: return "tariff-config";
        }
      })()
    : "";

  const handleTariffNavigate = (id: string) => {
    if (id === "logout") {
      localStorage.removeItem("authToken");
      sessionStorage.clear();
      navigate("/login");
      return;
    }
    const path = tariffRouteMap[id] ?? "/tariff-admin/config";
    navigate(path);
  };

  const handleTariffLogout = () => {
    localStorage.removeItem("authToken");
    sessionStorage.clear();
    navigate("/login");
  };

  // Approval admin helpers
  const approvalActive = isApprovalAdmin
    ? (() => {
        const match = pathname.match(/^\/approval-admin\/(\w+)/);
        if (!match) return "approval-queue";
        switch (match[1]) {
          case "queue": return "approval-queue";
          case "history": return "my-history";
          case "audit": return "system-audit";
          default: return "approval-queue";
        }
      })()
    : "";

  // General admin helpers
  const generalInfoActive = isGeneralInfoAdmin
    ? (() => {
        const match = pathname.match(/^\/general-admin\/(\w+)/);
        if (!match) return "dashboard";
        switch (match[1]) {
          case "dashboard": return "dashboard";
          case "users": return "users";
          case "audit": return "audit";
          default: return "dashboard";
        }
      })()
    : "";

  // Super admin (Sidebar) helpers
  const superAdminActive = isSuperAdmin
    ? (() => {
        if (pathname.startsWith("/admin/dashboard")) return "dashboard";
        if (pathname.startsWith("/admin/agents")) return "agents";
        if (pathname.startsWith("/admin/audit")) return "audit";
        return "dashboard";
      })()
    : "";

  const handleSuperAdminNavigate = (id: string) => {
    if (id === "logout") {
      localStorage.removeItem("authToken");
      sessionStorage.clear();
      navigate("/login");
      return;
    }
    const routeMap: Record<string, string> = {
      dashboard: "/admin/dashboard",
      agents: "/admin/agents",
      audit: "/admin/audit",
    };
    const path = routeMap[id] ?? "/admin/dashboard";
    navigate(path);
  };

  const renderSidebar = () => {
    if (isMeterAdmin) {
      return <MeterReaderSidebar activePage={"meter-reader-" + meterActive} onNavigate={handleMeterNavigate} />;
    } else if (isCustomerAdmin) {
      return <CustomerAdminSidebar activePage={customerActive ? `customer-admin-${customerActive}` : "customer-admin-customers"} onNavigate={handleCustomerNavigate} />;
    } else if (isTariffAdmin) {
      return <TariffAdminSidebar currentPage={tariffActive} onNavigate={handleTariffNavigate} onLogout={handleTariffLogout} />;
    } else if (isApprovalAdmin) {
      return <ApprovalAdminSidebar activePage={approvalActive} />;
    } else if (isGeneralInfoAdmin) {
      return <GeneralAdminSidebar activePage={generalInfoActive} />;
    } else {
      return <Sidebar activePage={superAdminActive} onNavigate={handleSuperAdminNavigate} />;
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="fixed top-4 left-4 z-30 p-2 bg-white rounded-lg shadow-md border border-gray-200 md:hidden"
          aria-label="Open menu"
        >
          <Menu size={24} className="text-gray-700" />
        </button>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-[260px] fixed inset-y-0 left-0 bg-white shadow z-20">
        {renderSidebar()}
      </aside>

      {/* Mobile Sidebar */}
      {isMobile && (
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-[280px] p-0">
            <div className="h-full overflow-y-auto">
              {renderSidebar()}
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full md:ml-[260px] px-4 md:px-6 py-4 md:py-6 overflow-x-hidden min-w-0">
        {children ?? <Outlet />}
      </main>
    </div>
  );
}
