import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MeterAdminSidebar } from "./MeterAdminSidebar";
import { CustomerAdminSidebar } from "./CustomerAdminSidebar"; // add import

export type LayoutProps = { children?: ReactNode };

export default function Layout({ children }: LayoutProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const isMeterAdmin = pathname.startsWith("/meter-admin");
  const isCustomerAdmin = pathname.startsWith("/customer-admin");

  // meter admin helper (already in your code)
  const meterActive = isMeterAdmin
    ? "meter-admin-" + pathname.replace("/meter-admin/", "").replace(/\/.*$/, "")
    : "";

  const handleMeterNavigate = (id: string) => {
    if (id === "logout") { localStorage.removeItem("authToken"); sessionStorage.clear(); navigate("/login"); return; }
    navigate("/meter-admin/" + id.replace(/^meter-admin-/, ""));
  };

  // customer admin helper
  const customerActive = isCustomerAdmin
    ? pathname.replace("/customer-admin/", "").replace(/\/.*$/, "")
    : "";

  const handleCustomerNavigate = (id: string) => {
    if (id === "logout") { localStorage.removeItem("authToken"); sessionStorage.clear(); navigate("/login"); return; }

    const map: Record<string, string> = {
      "customer-admin-households": "/customer-admin/households",
      "customer-admin-visualizer": "/customer-admin/visualizer",
      "customer-admin-metrics": "/customer-admin/metrics",
    };
    const path = map[id] ?? "/customer-admin/households";
    navigate(path);
  };

  return (
    <div className="min-h-screen flex">
      <aside className="w-[260px] fixed inset-y-0 left-0 bg-white shadow z-20">
        {isMeterAdmin ? (
          <MeterAdminSidebar activePage={"meter-admin-" + meterActive} onNavigate={handleMeterNavigate} />
        ) : isCustomerAdmin ? (
          <CustomerAdminSidebar activePage={customerActive ? `customer-admin-${customerActive}` : "customer-admin-households"} onNavigate={handleCustomerNavigate} />
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
