// src/components/KPIGrid.tsx
// STRATFIT — KPI Grid with Dynamic Delta Calculation

import React from "react";
import KPICard, { KPICardProps } from "./ui/KPICard";
import { useScenarioStore } from "@/state/scenarioStore";

// ============================================================================
// KPI CONFIGURATION
// ============================================================================

const KPI_CONFIG: Array<{
  label: string;
  widgetType: KPICardProps["widgetType"];
  accentColor: string;
  kpiIndex: number;
  kpiKey: string;
  isInverted: boolean; // True for metrics where lower is better
}> = [
  { label: "MRR", widgetType: "trendSpark", accentColor: "#22d3ee", kpiIndex: 0, kpiKey: "mrr", isInverted: false },
  { label: "GROSS PROFIT", widgetType: "profitColumns", accentColor: "#34d399", kpiIndex: 1, kpiKey: "grossProfit", isInverted: false },
  { label: "CASH", widgetType: "cashArea", accentColor: "#a78bfa", kpiIndex: 2, kpiKey: "cashBalance", isInverted: false },
  { label: "BURN", widgetType: "burnBars", accentColor: "#f0abfc", kpiIndex: 3, kpiKey: "burnRate", isInverted: true },
  { label: "RUNWAY", widgetType: "runwayGauge", accentColor: "#3b82f6", kpiIndex: 4, kpiKey: "runway", isInverted: false },
  { label: "CAC", widgetType: "cacPie", accentColor: "#22d3ee", kpiIndex: 5, kpiKey: "cac", isInverted: true },
  { label: "CHURN", widgetType: "churnRing", accentColor: "#22d3ee", kpiIndex: 6, kpiKey: "churnRate", isInverted: true },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function KPIGrid() {
  const kpiValues = useScenarioStore((s) => s.kpiValues);

  const cards = KPI_CONFIG.map((cfg, i) => {
    const key = cfg.kpiKey as keyof typeof kpiValues;
    const data = kpiValues[key];

    return {
      label: cfg.label,
      widgetType: cfg.widgetType,
      accentColor: cfg.accentColor,
      kpiIndex: cfg.kpiIndex,
      isInverted: cfg.isInverted,
      index: i,
      value: data?.display ?? "—",
      rawValue: data?.value ?? 0,
    };
  });

  return (
    <div className="kpi-grid-wrapper">
      <div className="kpi-grid">
        {cards.map((card) => (
          <div key={card.index} className="kpi-card-wrapper">
            <KPICard {...card} />
          </div>
        ))}
      </div>

      <style>{`
        .kpi-grid-wrapper {
          width: 100%;
          overflow-x: auto;
          padding-bottom: 8px;
        }

        .kpi-grid-wrapper::-webkit-scrollbar {
          display: none;
        }

        .kpi-grid-wrapper {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 12px;
          min-width: 900px;
        }

        .kpi-card-wrapper {
          aspect-ratio: 1 / 1;
          min-width: 120px;
          max-width: 200px;
        }

        @media (max-width: 1200px) {
          .kpi-grid {
            grid-template-columns: repeat(7, minmax(140px, 1fr));
          }
        }

        @media (max-width: 768px) {
          .kpi-grid {
            grid-template-columns: repeat(7, 130px);
          }
        }
      `}</style>
    </div>
  );
}
