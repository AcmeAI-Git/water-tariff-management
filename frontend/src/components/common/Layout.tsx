import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MeterAdminSidebar } from "./MeterAdminSidebar";

export type LayoutProps = {
  children?: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isMeterAdmin = pathname.startsWith("/meter-admin");
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
    const path = "/meter-admin/" + id.replace(/^meter-admin-/, "");
    navigate(path);
  };

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 fixed inset-y-0 left-0 bg-white shadow z-20">
        {isMeterAdmin ? (
          <MeterAdminSidebar activePage={meterActive} onNavigate={handleMeterNavigate} />
        ) : (
          <Sidebar activePage={""} onNavigate={() => {}} />
        )}
      </aside>

      <main className="flex-1 ml-64 max-w-6xl mx-auto w-full px-4 py-6">
        {children ?? <Outlet />}
      </main>
    </div>
  );
}
