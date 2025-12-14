// src/components/KPIGrid.tsx
// STRATFIT — KPI System
// Full width spacing between slider panel and AI panel

import React from "react";
import KPICard from "./ui/KPICard";
import { useScenarioStore } from "@/state/scenarioStore";

// ============================================================================
// KPI CONFIGURATION
// ============================================================================

interface KPIConfig {
  id: string;
  label: string;
  kpiKey: string;
  widgetType: "shrinkingRidge" | "breathingReservoir" | "directionalFlow" | "rotationalArc" | "microJitter" | "verticalLift" | "expandingAura";
  color: string;
  operatorOnly?: boolean;
}

const KPI_CONFIG: KPIConfig[] = [
  { id: "runway", label: "RUNWAY", kpiKey: "runway", widgetType: "shrinkingRidge", color: "#f59e0b" },
  { id: "cashPosition", label: "CASH", kpiKey: "cashPosition", widgetType: "breathingReservoir", color: "#22d3ee" },
  { id: "momentum", label: "MOMENTUM", kpiKey: "momentum", widgetType: "directionalFlow", color: "#22d3ee" },
  { id: "burnQuality", label: "BURN", kpiKey: "burnQuality", widgetType: "rotationalArc", color: "#a78bfa", operatorOnly: true },
  { id: "riskIndex", label: "RISK", kpiKey: "riskIndex", widgetType: "microJitter", color: "#ef4444" },
  { id: "earningsPower", label: "EARNINGS", kpiKey: "earningsPower", widgetType: "verticalLift", color: "#34d399", operatorOnly: true },
  { id: "enterpriseValue", label: "VALUE", kpiKey: "enterpriseValue", widgetType: "expandingAura", color: "#22d3ee" },
];

export { KPI_CONFIG };

// ============================================================================
// COMPONENT
// ============================================================================

export default function KPIGrid() {
  const kpiValues = useScenarioStore((s) => s.kpiValues);
  const hoveredKpiIndex = useScenarioStore((s) => s.hoveredKpiIndex);
  const setHoveredKpiIndex = useScenarioStore((s) => s.setHoveredKpiIndex);
  const viewMode = useScenarioStore((s) => s.viewMode);

  const visibleKPIs = viewMode === "investor" 
    ? KPI_CONFIG.filter(k => !k.operatorOnly)
    : KPI_CONFIG;

  const handleSelect = (index: number) => {
    const actualIndex = KPI_CONFIG.findIndex(k => k.id === visibleKPIs[index].id);
    if (hoveredKpiIndex === actualIndex) {
      setHoveredKpiIndex(null);
    } else {
      setHoveredKpiIndex(actualIndex);
    }
  };

  return (
    <div className="kpi-grid-container">
      <div className="kpi-grid">
        {visibleKPIs.map((cfg, i) => {
          const data = kpiValues[cfg.kpiKey as keyof typeof kpiValues];
          const actualIndex = KPI_CONFIG.findIndex(k => k.id === cfg.id);
          const isActive = hoveredKpiIndex === actualIndex;

          return (
            <KPICard
              key={cfg.id}
              index={i}
              label={cfg.label}
              value={data?.display ?? "—"}
              rawValue={data?.value ?? 0}
              color={cfg.color}
              widgetType={cfg.widgetType}
              isActive={isActive}
              onSelect={handleSelect}
              viewMode={viewMode}
            />
          );
        })}
      </div>

      <style>{`
        .kpi-grid-container {
          width: 100%;
          padding: 0 20px;
        }

        .kpi-grid {
          display: flex;
          justify-content: space-between;
          width: 100%;
        }
      `}</style>
    </div>
  );
}
