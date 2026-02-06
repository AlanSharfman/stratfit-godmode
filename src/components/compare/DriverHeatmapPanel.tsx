// src/components/compare/DriverHeatmapPanel.tsx
// STRATFIT — Driver Influence Heatmap Panel

import React, { useMemo } from "react";
import clsx from "clsx";
import { DriverHeatmap } from "./types";

type Props = {
  heatmap: DriverHeatmap;
  monthIndex: number;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function mix(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

// no orange; use cyan <-> slate <-> amber-gold
function colorFor(v: number) {
  // v in [-1..1]
  const t = (v + 1) / 2; // 0..1
  // blend cyan -> slate -> amber
  if (t < 0.5) {
    const k = t / 0.5;
    // cyan (34,211,238) -> slate (30,41,59)
    const r = Math.round(mix(34, 30, k));
    const g = Math.round(mix(211, 41, k));
    const b = Math.round(mix(238, 59, k));
    return `rgb(${r},${g},${b})`;
  } else {
    const k = (t - 0.5) / 0.5;
    // slate (30,41,59) -> amber (234,179,8)
    const r = Math.round(mix(30, 234, k));
    const g = Math.round(mix(41, 179, k));
    const b = Math.round(mix(59, 8, k));
    return `rgb(${r},${g},${b})`;
  }
}

export function DriverHeatmapPanel({ heatmap, monthIndex }: Props) {
  const cols = heatmap.values[0]?.length ?? 0;

  const highlightCol = clamp(monthIndex, 0, cols - 1);

  const topDrivers = useMemo(() => {
    // top absolute influence at current month
    const scored = heatmap.drivers.map((d, i) => ({
      d,
      v: heatmap.values[i][highlightCol] ?? 0,
      abs: Math.abs(heatmap.values[i][highlightCol] ?? 0),
    }));
    return scored.sort((a, b) => b.abs - a.abs).slice(0, 3);
  }, [heatmap, highlightCol]);

  return (
    <div className="h-full rounded-2xl border border-slate-800/60 bg-black/30 backdrop-blur p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] tracking-[0.22em] uppercase text-slate-400">Driver Influence</div>
          <div className="mt-1 text-sm text-slate-200 font-semibold">
            What's moving the gap at <span className="text-slate-100">T+{highlightCol}</span>
          </div>
        </div>
        <div className="text-[10px] text-slate-400 font-mono">
          {-1} <span className="mx-1">Baseline</span> · <span className="mx-1">Exploration</span> {+1}
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {topDrivers.map((x) => (
          <div key={x.d} className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-black/25 px-3 py-2">
            <div className="text-slate-200 text-sm">{x.d}</div>
            <div className={clsx("text-xs font-mono", x.v >= 0 ? "text-amber-300" : "text-cyan-300")}>
              {x.v >= 0 ? "+" : ""}
              {(x.v * 100).toFixed(0)}%
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <div className="grid grid-cols-[160px_1fr] gap-3">
          <div className="text-[10px] tracking-[0.22em] uppercase text-slate-500 pt-2">
            Drivers
          </div>
          <div className="text-[10px] tracking-[0.22em] uppercase text-slate-500 pt-2">
            Horizon
          </div>

          {heatmap.drivers.map((d, r) => (
            <React.Fragment key={d}>
              <div className="text-sm text-slate-200 py-2">{d}</div>
              <div className="py-2">
                <div className="relative h-5 rounded-lg overflow-hidden border border-slate-800/60 bg-[#050b14]">
                  <div className="absolute inset-0 flex">
                    {Array.from({ length: cols }, (_, c) => {
                      const v = heatmap.values[r][c] ?? 0;
                      return (
                        <div
                          key={c}
                          className="h-full"
                          style={{
                            width: `${100 / cols}%`,
                            background: colorFor(v),
                            opacity: 0.55,
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* current column indicator */}
                  <div
                    className="absolute top-0 bottom-0 w-[2px] bg-white/60"
                    style={{ left: `${(highlightCol / Math.max(1, cols - 1)) * 100}%` }}
                  />
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

