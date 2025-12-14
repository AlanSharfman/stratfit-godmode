// src/components/KPIGrid.tsx
// STRATFIT — 10 Horizontal KPI Cards
// Full width strip, compact, premium styling

import React from "react";
import KPICard, { KPICardProps } from "./ui/KPICard";
import { useScenarioStore } from "@/state/scenarioStore";

// ============================================================================
// 10 KPI CONFIGURATION
// ============================================================================

interface KPIConfig {
  label: string;
  color: string;
  kpiKey: "mrr" | "grossProfit" | "cashBalance" | "burnRate" | "runway" | "cac" | "churnRate" | "ltv" | "ltvCacRatio" | "nrr";
  widgetType: KPICardProps["widgetType"];
  maxValue: number;
}

const KPI_CONFIG: KPIConfig[] = [
  { label: "MRR", color: "#22d3ee", kpiKey: "mrr", widgetType: "sparkline", maxValue: 350000 },
  { label: "GROSS PROFIT", color: "#34d399", kpiKey: "grossProfit", widgetType: "bars", maxValue: 260000 },
  { label: "CASH", color: "#a78bfa", kpiKey: "cashBalance", widgetType: "donut", maxValue: 7000000 },
  { label: "BURN", color: "#f0abfc", kpiKey: "burnRate", widgetType: "gauge", maxValue: 420000 },
  { label: "RUNWAY", color: "#3b82f6", kpiKey: "runway", widgetType: "gauge", maxValue: 36 },
  { label: "CAC", color: "#f59e0b", kpiKey: "cac", widgetType: "bars", maxValue: 6000 },
  { label: "CHURN", color: "#ef4444", kpiKey: "churnRate", widgetType: "donut", maxValue: 10 },
  { label: "LTV", color: "#22c55e", kpiKey: "ltv", widgetType: "sparkline", maxValue: 50000 },
  { label: "LTV:CAC", color: "#06b6d4", kpiKey: "ltvCacRatio", widgetType: "gauge", maxValue: 10 },
  { label: "NRR", color: "#8b5cf6", kpiKey: "nrr", widgetType: "donut", maxValue: 150 },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function KPIGrid() {
  const kpiValues = useScenarioStore((s) => s.kpiValues);

  return (
    <div className="kpi-strip-container">
      <div className="kpi-strip-grid">
        {KPI_CONFIG.map((cfg, i) => {
          const data = kpiValues[cfg.kpiKey];
          const rawValue = data?.value ?? 0;
          const normalizedValue = Math.min(1, rawValue / cfg.maxValue);

          return (
            <KPICard
              key={i}
              index={i}
              label={cfg.label}
              value={data?.display ?? "—"}
              rawValue={normalizedValue}
              color={cfg.color}
              widgetType={cfg.widgetType}
            />
          );
        })}
      </div>

      <style>{`
        .kpi-strip-container {
          width: 100%;
        }

        .kpi-strip-grid {
          display: grid;
          grid-template-columns: repeat(10, 1fr);
          gap: 8px;
        }

        /* Responsive: wrap to 2 rows on smaller screens */
        @media (max-width: 1400px) {
          .kpi-strip-grid {
            grid-template-columns: repeat(10, 1fr);
            gap: 6px;
          }
        }

        @media (max-width: 1200px) {
          .kpi-strip-grid {
            grid-template-columns: repeat(5, 1fr);
            gap: 6px;
          }
        }

        @media (max-width: 768px) {
          .kpi-strip-grid {
            grid-template-columns: repeat(5, 1fr);
            gap: 4px;
          }
        }
      `}</style>
    </div>
  );
}
