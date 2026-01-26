// src/components/compare/ViewToggle.tsx
// The Enterprise Toggle

import React from "react";
import { LayoutGrid, Mountain } from "lucide-react";

type ViewMode = "terrain" | "grid";

interface ViewToggleProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({ viewMode, setViewMode }) => {
  return (
    <div className="flex items-center gap-1 bg-[#0f172a] p-1 rounded-md border border-slate-800 shadow-sm">
      <button
        type="button"
        aria-pressed={viewMode === "terrain"}
        onClick={() => setViewMode("terrain")}
        className={[
          "group flex items-center gap-2 px-3 py-1.5 rounded text-[11px] font-semibold tracking-wider",
          "transition-colors duration-100",
          "focus:outline-none focus:ring-1 focus:ring-cyan-500/40",
          viewMode === "terrain"
            ? "bg-slate-800 text-cyan-300 border border-slate-700 shadow-sm"
            : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 border border-transparent",
        ].join(" ")}
      >
        <Mountain className="w-3 h-3" />
        RISK TOPOGRAPHY
      </button>

      <div className="w-px h-3 bg-slate-800 mx-1" />

      <button
        type="button"
        aria-pressed={viewMode === "grid"}
        onClick={() => setViewMode("grid")}
        className={[
          "group flex items-center gap-2 px-3 py-1.5 rounded text-[11px] font-semibold tracking-wider",
          "transition-colors duration-100",
          "focus:outline-none focus:ring-1 focus:ring-slate-500/40",
          viewMode === "grid"
            ? "bg-slate-800 text-slate-200 border border-slate-700 shadow-sm"
            : "text-slate-600 hover:text-slate-400 hover:bg-slate-800/50 border border-transparent",
        ].join(" ")}
      >
        <LayoutGrid className="w-3 h-3" />
        FINANCIAL GRID
      </button>
    </div>
  );
};

