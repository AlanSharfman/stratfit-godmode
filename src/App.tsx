// src/App.tsx
// STRATFIT — App Shell with Tab Navigation

import React, { useState } from "react";
import DashboardLayout from "./components/layout/DashboardLayout";
import InputsPage from "./pages/InputsPage";
import ErrorBoundary from "./components/ErrorBoundary";
import { LayoutDashboard, Sliders } from "lucide-react";

type Page = "dashboard" | "inputs";

export default function App() {
  const [activePage, setActivePage] = useState<Page>("dashboard");

  return (
    <ErrorBoundary>
      <div className="relative min-h-screen w-full">
        {/* Navigation Bar */}
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0a0a1a]/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-[1920px] items-center justify-between px-6 py-3">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="text-sm font-bold tracking-wide text-white">
                STRATFIT
              </div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-cyan-300">
                GODMODE
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
              <button
                onClick={() => setActivePage("dashboard")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  activePage === "dashboard"
                    ? "bg-white/10 text-white shadow-lg"
                    : "text-white/60 hover:text-white/90"
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </button>
              <button
                onClick={() => setActivePage("inputs")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  activePage === "inputs"
                    ? "bg-white/10 text-white shadow-lg"
                    : "text-white/60 hover:text-white/90"
                }`}
              >
                <Sliders className="h-4 w-4" />
                Inputs
              </button>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-400 shadow-lg shadow-green-400/50" />
              <div className="text-[10px] tracking-wider text-white/60">
                LIVE
              </div>
            </div>
          </div>
        </nav>

        {/* Page Content with top padding for fixed nav */}
        <div className="pt-[60px]">
          {activePage === "dashboard" && <DashboardLayout />}
          {activePage === "inputs" && <InputsPage />}
        </div>
      </div>
    </ErrorBoundary>
  );
}
