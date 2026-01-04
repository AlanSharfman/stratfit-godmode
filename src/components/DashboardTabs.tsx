// src/components/DashboardTabs.tsx
// Exact clone of Godmode tab menu for dashboard use
import React, { useState } from "react";

export type DashboardTab = "terrain" | "variances" | "actuals";

const TABS: { id: DashboardTab; label: string }[] = [
  { id: "terrain", label: "Terrain" },
  { id: "variances", label: "Variances" },
  { id: "actuals", label: "Actuals" },
];

export default function DashboardTabs({ value, onChange }: {
  value: DashboardTab;
  onChange: (tab: DashboardTab) => void;
}) {
  const [hovered, setHovered] = useState<DashboardTab | null>(null);
  return (
    <div className="dashboard-tabs-container">
      <div className="dashboard-tabs">
        {TABS.map((tab) => {
          const isActive = value === tab.id;
          return (
            <button
              key={tab.id}
              className={`dashboard-tab${isActive ? " active" : ""}${hovered === tab.id ? " hovered" : ""}`}
              onClick={() => onChange(tab.id)}
              onMouseEnter={() => setHovered(tab.id)}
              onMouseLeave={() => setHovered(null)}
              type="button"
            >
              <span className="tab-label">{tab.label}</span>
              {isActive && <span className="active-bar" />}
            </button>
          );
        })}
      </div>
      <style>{`
        .dashboard-tabs-container { display: flex; justify-content: flex-start; width: 100%; padding: 0 0 18px 0; }
        .dashboard-tabs { display: flex; gap: 10px; background: none; border: none; }
        .dashboard-tab { position: relative; display: flex; align-items: center; gap: 8px; padding: 10px 28px; background: rgba(25, 30, 40, 0.6); border: 2px solid rgba(255,255,255,0.06); border-radius: 10px; color: #fff; font-size: 15px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; cursor: pointer; transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03); }
        .dashboard-tab:not(.active):hover { color: #fff; background: rgba(40,48,60,0.9); border-color: #00e5ff; }
        .dashboard-tab.active { background: linear-gradient(135deg, rgba(0,229,255,0.12), rgba(0,180,220,0.08)); border: 2px solid #00e5ff; color: #fff; box-shadow: 0 8px 32px #00e5ff33, 0 0 60px #00e5ff22, inset 0 1px 0 #fff3, inset 0 0 30px #fff1; }
        .tab-label { font-family: inherit; text-shadow: 0 2px 4px rgba(0,0,0,0.6); }
        .dashboard-tab.active .tab-label { text-shadow: 0 0 20px #00e5ff, 0 2px 8px rgba(0,0,0,0.8); }
        .active-bar { position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); width: 70%; height: 4px; border-radius: 2px; background: #00e5ff; box-shadow: 0 0 16px #00e5ff; animation: barPulse 2s ease-in-out infinite; }
        @keyframes barPulse { 0%,100%{opacity:0.8;} 50%{opacity:1;box-shadow:0 0 24px #00e5ff;} }
      `}</style>
    </div>
  );
}
