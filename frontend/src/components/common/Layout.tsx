import { Outlet, useLocation, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MeterReaderSidebar } from "./MeterReaderSidebar";
import { CustomerAdminSidebar } from "./CustomerAdminSidebar";
import { TariffAdminSidebar } from "./TariffAdminSidebar";
import { ApprovalAdminSidebar } from "./ApprovalAdminSidebar";
import { GeneralAdminSidebar } from "./GeneralAdminSidebar";

export type LayoutProps = { children?: ReactNode };

export default function Layout({ children }: LayoutProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

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
      "customer-admin-visualizer": "/customer-admin/visualizer",
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
    "tariff-visualizer": "/tariff-admin/visualizer",
    "zone-scoring": "/tariff-admin/zone-scoring",
    "location-management": "/tariff-admin/location-management",
    "my-metrics": "/tariff-admin/metrics",
  };
  const tariffActive = isTariffAdmin
    ? (() => {
        if (pathname.startsWith("/tariff-admin/zone-scoring")) return "zone-scoring";
        if (pathname.startsWith("/tariff-admin/location-management")) return "location-management";
        const match = pathname.match(/^\/tariff-admin\/(\w+)/);
        if (!match) return "zone-scoring";
        switch (match[1]) {
          case "config": return "tariff-config";
          case "history": return "tariff-history";
          case "visualizer": return "tariff-visualizer";
          case "metrics": return "my-metrics";
          case "areas": return "location-management";
          default: return "zone-scoring";
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
    const path = tariffRouteMap[id] ?? "/tariff-admin/zone-scoring";
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

  return (
    <div className="min-h-screen flex">
      <aside className="w-[260px] fixed inset-y-0 left-0 bg-white shadow z-20">
        {isMeterAdmin ? (
          <MeterReaderSidebar activePage={"meter-reader-" + meterActive} onNavigate={handleMeterNavigate} />
        ) : isCustomerAdmin ? (
          <CustomerAdminSidebar activePage={customerActive ? `customer-admin-${customerActive}` : "customer-admin-customers"} onNavigate={handleCustomerNavigate} />
        ) : isTariffAdmin ? (
          <TariffAdminSidebar currentPage={tariffActive} onNavigate={handleTariffNavigate} onLogout={handleTariffLogout} />
        ) : isApprovalAdmin ? (
          <ApprovalAdminSidebar activePage={approvalActive} />
        ) : isGeneralInfoAdmin ? (
          <GeneralAdminSidebar activePage={generalInfoActive} />
        ) : (
          <Sidebar activePage={superAdminActive} onNavigate={handleSuperAdminNavigate} />
        )}
      </aside>
      <main className="flex-1 ml-[260px] max-w-6xl mx-auto w-full px-4 py-6">
        {children ?? <Outlet />}
      </main>
    </div>
  );
}
