// src/components/KPIGrid.tsx
// STRATFIT — Clean KPI Grid
// Highlight colors match active scenario

import React from "react";
import { useShallow } from "zustand/react/shallow";
import KPICard from "./ui/KPICard";
import { useScenarioStore, SCENARIO_COLORS } from "@/state/scenarioStore";
import type { LeverId } from "@/logic/mountainPeakModel";

// ============================================================================
// KPI CONFIGURATION
// ============================================================================

interface KPIConfig {
  id: string;
  label: string;
  kpiKey: string;
  unit: string;
  widgetType: "bar" | "globe" | "arrow" | "gauge" | "dial" | "chart" | "ring";
  accentColor: string;
  relatedLevers: LeverId[];
  group: "RESILIENCE" | "MOMENTUM" | "QUALITY";
}

const WIDGET_TYPE_TO_LEGACY = {
  bar: "timeCompression",
  globe: "liquidityReservoir",
  arrow: "vectorFlow",
  dial: "efficiencyRotor",
  gauge: "stabilityWave",
  ring: "structuralLift",
  chart: "scaleAura",
} as const;

const KPI_CONFIG: KPIConfig[] = [
  {
    id: "runway",
    label: "RUNWAY",
    kpiKey: "runway",
    unit: "mo",
    widgetType: "bar",
    accentColor: "#00d4ff",
    relatedLevers: ["operatingExpenses", "headcount", "fundingInjection"],
    group: "RESILIENCE",
  },
  {
    id: "cashPosition",
    label: "CASH",
    kpiKey: "cashPosition",
    unit: "$",
    widgetType: "globe",
    accentColor: "#00ffcc",
    relatedLevers: ["pricingAdjustment", "operatingExpenses", "cashSensitivity"],
    group: "RESILIENCE",
  },
  {
    id: "momentum",
    label: "ARR (RUN-RATE)",
    kpiKey: "momentum",
    unit: "$",
    widgetType: "arrow",
    accentColor: "#00ff88",
    relatedLevers: ["revenueGrowth", "marketingSpend", "pricingAdjustment"],
    group: "MOMENTUM",
  },
  {
    id: "burnQuality",
    label: "MONTHLY BURN",
    kpiKey: "burnQuality",
    unit: "$",
    widgetType: "dial",
    accentColor: "#fb7185",
    relatedLevers: ["operatingExpenses", "headcount", "cashSensitivity"],
    group: "QUALITY",
  },
  {
    id: "riskIndex",
    label: "RISK",
    kpiKey: "riskIndex",
    unit: "/100",
    widgetType: "gauge",
    accentColor: "#00ccff",
    relatedLevers: ["churnSensitivity", "fundingInjection"],
    group: "RESILIENCE",
  },
  {
    id: "earningsPower",
    label: "GROSS MARGIN",
    kpiKey: "earningsPower",
    unit: "%",
    widgetType: "ring",
    accentColor: "#00ff88",
    relatedLevers: ["revenueGrowth", "pricingAdjustment", "operatingExpenses"],
    group: "QUALITY",
  },
  {
    id: "enterpriseValue",
    label: "VALUE",
    kpiKey: "enterpriseValue",
    unit: "$",
    widgetType: "chart",
    accentColor: "#00ddff",
    relatedLevers: ["revenueGrowth", "pricingAdjustment", "marketingSpend", "churnSensitivity"],
    group: "MOMENTUM",
  },
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

  const visibleKPIs = KPI_CONFIG;

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
              color={cfg.accentColor}
              widgetType={WIDGET_TYPE_TO_LEGACY[cfg.widgetType]}
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
