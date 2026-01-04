// src/components/KPIGrid.tsx
// STRATFIT — Clean KPI Grid
// Highlight colors match active scenario

import React from "react";
import { useShallow } from "zustand/react/shallow";
import KPICard from "./ui/KPICard";
import { useScenarioStore, SCENARIO_COLORS } from "@/state/scenarioStore";

// ============================================================================
// KPI CONFIGURATION
// ============================================================================

interface KPIConfig {
  id: string;
  label: string;
  kpiKey: string;
  widgetType: string;
  color: string;
  operatorOnly?: boolean;
}

const KPI_CONFIG: KPIConfig[] = [
  { id: "runway", label: "RUNWAY", kpiKey: "runway", widgetType: "timeCompression", color: "#5a7d9a" },
  { id: "cashPosition", label: "CASH", kpiKey: "cashPosition", widgetType: "liquidityReservoir", color: "#5a7d9a" },
  { id: "momentum", label: "MOMENTUM", kpiKey: "momentum", widgetType: "vectorFlow", color: "#5a7d9a" },
  { id: "burnQuality", label: "BURN", kpiKey: "burnQuality", widgetType: "efficiencyRotor", color: "#5a7d9a", operatorOnly: true },
  { id: "riskIndex", label: "RISK", kpiKey: "riskIndex", widgetType: "stabilityWave", color: "#5a7d9a" },
  { id: "earningsPower", label: "EARNINGS", kpiKey: "earningsPower", widgetType: "structuralLift", color: "#5a7d9a", operatorOnly: true },
  { id: "enterpriseValue", label: "VALUE", kpiKey: "enterpriseValue", widgetType: "scaleAura", color: "#5a7d9a" },
];

export { KPI_CONFIG };

// ============================================================================
// COMPONENT
// ============================================================================

export default function KPIGrid() {
  const {
    activeScenarioId,
    engineResults,
  } = useScenarioStore(
    useShallow((s) => ({
      activeScenarioId: s.activeScenarioId,
      engineResults: s.engineResults,
    }))
  );

  const hoveredKpiIndex = useScenarioStore((s) => s.hoveredKpiIndex);
  const setHoveredKpiIndex = useScenarioStore((s) => s.setHoveredKpiIndex);
  const viewMode = useScenarioStore((s) => s.viewMode);
  const scenario = useScenarioStore((s) => s.scenario);

  const engineResult = engineResults?.[activeScenarioId];
  const kpiValues = engineResult?.kpis || {};

  // Get scenario color for KPI highlights
  const scenarioColor = SCENARIO_COLORS[scenario].primary;

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

  // Check if any card is active (for dimming non-selected)
  const isAnyActive = hoveredKpiIndex !== null;

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
              isAnyActive={isAnyActive && !isActive}
              onSelect={handleSelect}
              viewMode={viewMode}
              highlightColor={scenarioColor}
            />
          );
        })}
      </div>

      <style>{`
        .kpi-grid-container {
          display: flex;
          justify-content: center;
          width: 100%;
          padding: 6px 0;
        }

        .kpi-grid {
          display: flex;
          gap: 16px;
          justify-content: center;
          align-items: center;
          flex-wrap: nowrap;
          width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          padding-bottom: 4px;
        }

        .kpi-grid > * {
          flex: 0 0 auto;
        }
      `}</style>
    </div>
  );
}
