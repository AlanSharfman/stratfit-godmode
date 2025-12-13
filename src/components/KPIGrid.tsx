// src/components/KPIGrid.tsx
import React from "react";
import KPICard, { KPICardProps } from "./ui/KPICard";
import { useScenarioStore } from "@/state/scenarioStore";

const KPI_CONFIG: Array<
  Omit<KPICardProps, "value" | "subValue" | "isPositive" | "index">
> = [
  { label: "MRR", widgetType: "trendSpark", accentColor: "#22d3ee", kpiIndex: 0 },
  { label: "GROSS PROFIT", widgetType: "profitColumns", accentColor: "#34d399", kpiIndex: 1 },
  { label: "CASH", widgetType: "cashArea", accentColor: "#a78bfa", kpiIndex: 2 },
  { label: "BURN", widgetType: "burnBars", accentColor: "#f0abfc", kpiIndex: 3 },
  // Runway must be light red (no yellow)
  { label: "RUNWAY", widgetType: "runwayGauge", accentColor: "#fb7185", kpiIndex: 4 },
  // CAC must be PIE (multi colour)
  { label: "CAC", widgetType: "cacPie", accentColor: "#22d3ee", kpiIndex: 5 },
  // Churn improved ring + spark
  { label: "CHURN", widgetType: "churnRing", accentColor: "#fb7185", kpiIndex: 6 },
];

export default function KPIGrid() {
  const kpiValues = useScenarioStore((s) => s.kpiValues);

  const keys = ["mrr", "grossProfit", "cashBalance", "burnRate", "runway", "cac", "churnRate"] as const;

  const cards = KPI_CONFIG.map((cfg, i) => {
    const key = keys[i];
    const data = kpiValues[key];
    const valNum = data?.value ?? 0;

    // determine positive/negative for delta chip
    const negativeIdx = new Set([3, 5, 6]); // burn, cac, churn “bad if up”
    const isPositive = !negativeIdx.has(i);

    const delta = isPositive ? "+12%" : "-3%"; // placeholder delta (you can wire real deltas later)

    return {
      ...cfg,
      index: i,
      value: data?.display ?? "—",
      subValue: delta,
      isPositive,
    };
  });

  return (
    <div className="w-full relative z-10 px-6 pb-2">
      <div className="flex flex-nowrap gap-4 overflow-x-auto pb-4 no-scrollbar">
        {cards.map((card) => (
          <KPICard key={card.index} {...card} />
        ))}
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
