import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MeterAdminSidebar } from "./MeterAdminSidebar";
import { CustomerAdminSidebar } from "./CustomerAdminSidebar";
import { TariffAdminSidebar } from "./TariffAdminSidebar";

export type LayoutProps = { children?: ReactNode };

export default function Layout({ children }: LayoutProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const isMeterAdmin = pathname.startsWith("/meter-admin");
  const isCustomerAdmin = pathname.startsWith("/customer-admin");
  const isTariffAdmin = pathname.startsWith("/tariff-admin");

  // meter admin helper
  const meterActive = isMeterAdmin
    ? "meter-admin-" + pathname.replace("/meter-admin/", "").replace(/\/.*$/, "")
    : "";

  const handleMeterNavigate = (id: string) => {
    if (id === "logout") {
      localStorage.removeItem("authToken");
      sessionStorage.clear();
      navigate("/login");
      return;
    }
    navigate("/meter-admin/" + id.replace(/^meter-admin-/, ""));
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
      "customer-admin-households": "/customer-admin/households",
      "customer-admin-visualizer": "/customer-admin/visualizer",
      "customer-admin-metrics": "/customer-admin/metrics",
    };
    const path = map[id] ?? "/customer-admin/households";
    navigate(path);
  };

  // Tariff admin helpers
  const tariffRouteMap: Record<string, string> = {
    "tariff-config": "/tariff-admin/config",
    "tariff-history": "/tariff-admin/history",
    "tariff-visualizer": "/tariff-admin/visualizer",
    "my-metrics": "/tariff-admin/metrics",
  };
  const tariffActive = isTariffAdmin
    ? (() => {
        const match = pathname.match(/^\/tariff-admin\/(\w+)/);
        if (!match) return "tariff-config";
        switch (match[1]) {
          case "config": return "tariff-config";
          case "history": return "tariff-history";
          case "visualizer": return "tariff-visualizer";
          case "metrics": return "my-metrics";
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

  return (
    <div className="min-h-screen flex">
      <aside className="w-[260px] fixed inset-y-0 left-0 bg-white shadow z-20">
        {isMeterAdmin ? (
          <MeterAdminSidebar activePage={"meter-admin-" + meterActive} onNavigate={handleMeterNavigate} />
        ) : isCustomerAdmin ? (
          <CustomerAdminSidebar activePage={customerActive ? `customer-admin-${customerActive}` : "customer-admin-households"} onNavigate={handleCustomerNavigate} />
        ) : isTariffAdmin ? (
          <TariffAdminSidebar currentPage={tariffActive} onNavigate={handleTariffNavigate} onLogout={handleTariffLogout} />
        ) : (
          <Sidebar activePage={""} onNavigate={() => {}} />
        )}
      </aside>
      <main className="flex-1 ml-[260px] max-w-6xl mx-auto w-full px-4 py-6">
        {children ?? <Outlet />}
      </main>
    </div>
  );
}
