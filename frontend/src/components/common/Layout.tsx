import React from "react";
import { Outlet } from "react-router";
import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar"; // add this import

export type LayoutProps = {
  children?: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 fixed inset-y-0 left-0 bg-white shadow z-20">
        <Sidebar activePage={""} onNavigate={function (): void {
                  throw new Error("Function not implemented.");
              } } />
      </aside>

      <main className="flex-1 ml-64 max-w-6xl mx-auto w-full px-4 py-6">
        {children ?? <Outlet />}
      </main>
    </div>
  );
}
