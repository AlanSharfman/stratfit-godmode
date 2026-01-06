// src/components/ViewToggle.tsx
// STRATFIT — View Toggle
// Two lenses over the same engine. Same truth. Different focus.

import React from "react";
import { useScenarioStore } from "@/state/scenarioStore";

export default function ViewToggle() {
  const viewMode = useScenarioStore((s) => s.viewMode);
  const setViewMode = useScenarioStore((s) => s.setViewMode);

  return (
    <div className="view-toggle-container">
      <div 
        className="view-toggle"
        title="Two lenses over the same engine. Same truth. Different focus."
      >
        <button
          className={`toggle-option ${viewMode === "operator" ? "active" : ""}`}
          onClick={() => setViewMode("operator")}
        >
          Operator
        </button>
        <button
          className={`toggle-option ${viewMode === "investor" ? "active" : ""}`}
          onClick={() => setViewMode("investor")}
        >
          Investor
        </button>
        <div 
          className="toggle-indicator"
          style={{ transform: viewMode === "investor" ? "translateX(100%)" : "translateX(0)" }}
        />
      </div>

      <style>{`
        .view-toggle-container {
          display: flex;
          align-items: center;
        }

        .view-toggle {
          position: relative;
          display: flex;
          background: #0d1117;
          border: 1px solid #30363d;
          border-radius: 6px;
          padding: 2px;
          gap: 0;
        }

        .toggle-option {
          position: relative;
          z-index: 1;
          padding: 6px 16px;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.02em;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .toggle-option:hover {
          color: rgba(255, 255, 255, 0.7);
        }

        .toggle-option.active {
          color: #fff;
        }

        .toggle-indicator {
          position: absolute;
          top: 2px;
          left: 2px;
          width: calc(50% - 2px);
          height: calc(100% - 4px);
          background: #21262d;
          border-radius: 4px;
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}

