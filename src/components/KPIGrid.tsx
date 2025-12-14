// src/components/KPIGrid.tsx
// STRATFIT — 7 KPI Boxes matching reference design

import React from "react";
import KPICard, { KPICardProps } from "./ui/KPICard";
import { useScenarioStore } from "@/state/scenarioStore";

// ============================================================================
// EXACTLY 7 KPIs
// ============================================================================

interface KPIConfig {
  label: string;
  color: string;
  kpiKey: "mrr" | "grossProfit" | "cashBalance" | "burnRate" | "runway" | "cac" | "churnRate";
  widgetType: KPICardProps["widgetType"];
  maxValue: number;
}

const KPI_CONFIG: KPIConfig[] = [
  { label: "REVENUE", color: "#22d3ee", kpiKey: "mrr", widgetType: "sparkline", maxValue: 350000 },
  { label: "PROFIT", color: "#22d3ee", kpiKey: "grossProfit", widgetType: "bars", maxValue: 260000 },
  { label: "RUNWAY", color: "#f59e0b", kpiKey: "runway", widgetType: "gauge", maxValue: 36 },
  { label: "CASH", color: "#22d3ee", kpiKey: "cashBalance", widgetType: "sparkline", maxValue: 7000000 },
  { label: "BURN RATE", color: "#22d3ee", kpiKey: "burnRate", widgetType: "bars", maxValue: 420000 },
  { label: "EBITDA", color: "#a78bfa", kpiKey: "cac", widgetType: "donut", maxValue: 6000 },
  { label: "RISK", color: "#ef4444", kpiKey: "churnRate", widgetType: "donut", maxValue: 10 },
];

// Export for use in ControlDeck
export { KPI_CONFIG };

// ============================================================================
// COMPONENT
// ============================================================================

export default function KPIGrid() {
  const kpiValues = useScenarioStore((s) => s.kpiValues);
  const hoveredKpiIndex = useScenarioStore((s) => s.hoveredKpiIndex);
  const setHoveredKpiIndex = useScenarioStore((s) => s.setHoveredKpiIndex);

  const handleSelect = (index: number) => {
    if (hoveredKpiIndex === index) {
      setHoveredKpiIndex(null);
    } else {
      setHoveredKpiIndex(index);
    }
  };

  return (
    <div className="kpi-grid">
      {KPI_CONFIG.map((cfg, i) => {
        const data = kpiValues[cfg.kpiKey];
        const rawValue = data?.value ?? 0;
        const normalizedValue = Math.min(1, rawValue / cfg.maxValue);

        return (
          <div key={cfg.kpiKey} className="kpi-slot">
            <KPICard
              index={i}
              label={cfg.label}
              value={data?.display ?? "—"}
              rawValue={normalizedValue}
              color={cfg.color}
              widgetType={cfg.widgetType}
              isExpanded={hoveredKpiIndex === i}
              onSelect={handleSelect}
            />
          </div>
        );
      })}

      <style>{`
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 10px;
        }

        .kpi-slot {
          min-width: 0;
        }

        @media (max-width: 1400px) {
          .kpi-grid {
            gap: 8px;
          }
        }

        @media (max-width: 900px) {
          .kpi-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
