// src/components/compare/CompareGodMode.tsx
// STRATFIT — Compare God Mode Main Component

import React, { useMemo, useState } from "react";
import { DivergenceField } from "./DivergenceField";
import { makeMockCompareData, makeMockHeatmap } from "./mockData";
import { CompareMetric } from "./types";
import { DriverHeatmapPanel } from "./DriverHeatmapPanel";

export function CompareGodMode() {
  const [metric, setMetric] = useState<CompareMetric>("ARR");

  const data = useMemo(() => makeMockCompareData(metric), [metric]);
  const heatmap = useMemo(() => makeMockHeatmap(data.months.length), [data.months.length]);

  const [idx, setIdx] = useState<number>(Math.floor(data.months.length * 0.5));

  return (
    <div className="h-full w-full p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-[10px] tracking-[0.22em] uppercase text-slate-400">COMPARE</div>
          <div className="text-slate-100 text-lg font-semibold">Strategic Divergence</div>
          <div className="text-slate-400 text-xs mt-1">
            Baseline vs Exploration — time-scrub to see when the future splits.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMetric("ARR")}
            className={`px-3 py-2 rounded-xl border text-xs tracking-wide ${
              metric === "ARR"
                ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200"
                : "border-slate-800/70 bg-black/20 text-slate-300"
            }`}
          >
            Metric: ARR
          </button>
          <button
            onClick={() => setMetric("CASH")}
            className={`px-3 py-2 rounded-xl border text-xs tracking-wide ${
              metric === "CASH"
                ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200"
                : "border-slate-800/70 bg-black/20 text-slate-300"
            }`}
          >
            Cash
          </button>
          <button
            onClick={() => setMetric("RUNWAY")}
            className={`px-3 py-2 rounded-xl border text-xs tracking-wide ${
              metric === "RUNWAY"
                ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200"
                : "border-slate-800/70 bg-black/20 text-slate-300"
            }`}
          >
            Runway
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-5 h-[calc(100%-76px)]">
        <div className="relative h-[580px] xl:h-auto">
          <DivergenceField data={data} monthIndex={idx} onScrub={setIdx} />
        </div>

        <div className="h-[520px] xl:h-auto">
          <DriverHeatmapPanel heatmap={heatmap} monthIndex={idx} />
        </div>
      </div>
    </div>
  );
}

