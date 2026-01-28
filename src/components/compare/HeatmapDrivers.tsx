// src/components/compare/HeatmapDrivers.tsx
// STRATFIT — Driver Sensitivity Heatmap

import React, { useMemo } from "react";

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function cellColor(v: number) {
  // v in [-1..+1]
  // Institutional: deep slate base, cyan positive, amber risk
  const a = Math.abs(v);
  const alpha = 0.10 + a * 0.35;

  if (v >= 0) return `rgba(34,211,238,${alpha})`; // cyan
  return `rgba(234,179,8,${alpha})`;             // signal gold
}

export function HeatmapDrivers({ steps, tIndex }: { steps: number; tIndex: number }) {
  const drivers = useMemo(
    () => [
      "Pricing",
      "Demand",
      "Churn",
      "CAC",
      "Headcount",
      "COGS",
      "Ops Risk",
      "Capital Raise",
    ],
    []
  );

  // MVP scaffold values: deterministic-ish patterns
  const data = useMemo(() => {
    return drivers.map((_, r) =>
      Array.from({ length: steps }, (_, t) => {
        const base = Math.sin((t / 6) + r * 0.7) * 0.65;
        const trend = (t / (steps - 1) - 0.5) * (r % 2 === 0 ? 0.35 : -0.28);
        return clamp(base + trend, -1, 1);
      })
    );
  }, [drivers, steps]);

  return (
    <div className="p-4">
      <div className="grid" style={{ gridTemplateColumns: `140px repeat(${steps}, 1fr)` }}>
        {/* header row */}
        <div className="text-[9px] text-slate-500 font-bold tracking-widest uppercase pr-2 py-2">
          DRIVER
        </div>
        {Array.from({ length: steps }, (_, t) => (
          <div
            key={t}
            className={[
              "text-[9px] text-slate-600 font-mono py-2 text-center",
              t === tIndex ? "text-slate-200" : "",
            ].join(" ")}
          >
            {t % 6 === 0 ? `T+${t}` : ""}
          </div>
        ))}

        {/* rows */}
        {drivers.map((name, r) => (
          <React.Fragment key={name}>
            <div className="text-[10px] text-slate-300 py-2 pr-2 border-t border-slate-800/60">
              {name}
            </div>
            {data[r].map((v, t) => (
              <div
                key={t}
                className={[
                  "h-6 border-t border-slate-800/60 border-l border-slate-800/30",
                  t === tIndex ? "outline outline-1 outline-slate-300/50" : "",
                ].join(" ")}
                style={{ background: cellColor(v) }}
                title={`${name} @ T+${t}: ${v.toFixed(2)}`}
              />
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
