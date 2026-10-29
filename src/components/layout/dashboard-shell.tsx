"use client";

import { useState } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { usePortalTheme } from "@/lib/use-portal-theme";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { dark, className, toggleTheme } = usePortalTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className={`h-dvh overflow-hidden ${className}`}
      style={{
        backgroundColor: "var(--dash-bg)",
        color: "var(--dash-text)",
      }}
    >
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-30 bg-black/45 xl:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <AppSidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />

      {/* Permanent sidebar from xl (1280px+) — drawer on laptop/tablet/emulators */}
      <div className="flex h-dvh min-h-0 min-w-0 flex-col xl:pl-[248px]">
        <AppHeader
          onMenuClick={() => setSidebarOpen(true)}
          dark={dark}
          onToggleTheme={toggleTheme}
        />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-5 py-4 sm:px-6 sm:py-5 md:px-7 md:py-6 xl:px-8 xl:py-8">
          <div className="mx-auto flex h-full min-h-0 w-full max-w-[1600px] min-w-0 flex-col">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
