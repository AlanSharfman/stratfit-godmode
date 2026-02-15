// src/components/compare/CompareHybridPanel.tsx
// STRATFIT — Hybrid Monte Carlo + Heatmap Panel

import React, { useMemo, useState, useEffect } from "react";
import { SpaghettiCanvas } from "./SpaghettiCanvas";
import { HeatmapDrivers } from "./HeatmapDrivers";
import { MetricCard } from "./MetricCard";
import { Zap } from "lucide-react";

type Percentiles = { p05: number[]; p50: number[]; p95: number[] };

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function fmtMoneyM(x: number) {
  const sign = x < 0 ? "-" : "";
  const v = Math.abs(x);
  return `${sign}$${v.toFixed(1)}M`;
}

/**
 * MVP data generator.
 * Replace this with your real simulation arrays later:
 * runsA: number[run][t]
 * runsB: number[run][t]
 */
function synthRuns({
  runs = 1200,
  steps = 37,
  seedA = 1.0,
  seedB = 1.0,
}: {
  runs?: number;
  steps?: number;
  seedA?: number;
  seedB?: number;
}) {
  // Deterministic-ish noise (no deps): simple LCG
  let s = 1337;
  const rand = () => {
    s = (s * 48271) % 2147483647;
    return s / 2147483647;
  };

  const mk = (bias: number) =>
    Array.from({ length: runs }, () => {
      let v = 3.2; // "NOW" baseline in $M
      const arr: number[] = [];
      for (let t = 0; t < steps; t++) {
        const drift = (0.06 + bias) * (1 + t / steps);
        const shock = (rand() - 0.5) * 0.22; // volatility
        const meanRevert = (3.2 - v) * 0.02;
        v = Math.max(0, v + drift + shock + meanRevert);
        arr.push(v);
      }
      return arr;
    });

  // B slightly better drift + slightly higher variance
  const runsA = mk(0.00 * seedA);
  const runsB = mk(0.018 * seedB).map((r) =>
    r.map((x, i) => x * (1 + 0.03 * Math.sin(i / 6)))
  );

  return { runsA, runsB };
}

function percentile(sorted: number[], p: number) {
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  const w = idx - lo;
  return sorted[lo] * (1 - w) + sorted[hi] * w;
}

function computeBands(runs: number[][]): Percentiles {
  const steps = runs[0]?.length ?? 0;
  const p05: number[] = [];
  const p50: number[] = [];
  const p95: number[] = [];
  for (let t = 0; t < steps; t++) {
    const col = runs.map((r) => r[t]).slice().sort((a, b) => a - b);
    p05.push(percentile(col, 0.05));
    p50.push(percentile(col, 0.5));
    p95.push(percentile(col, 0.95));
  }
  return { p05, p50, p95 };
}

function confidenceFromBands(a: Percentiles, b: Percentiles, t: number) {
  // Narrower combined band => higher confidence (0..100)
  const wA = Math.max(1e-6, a.p95[t] - a.p05[t]);
  const wB = Math.max(1e-6, b.p95[t] - b.p05[t]);
  const w = (wA + wB) / 2;
  // Scale chosen for MVP aesthetics:
  const score = 100 * (1 / (1 + w / 2.0));
  return clamp(score, 0, 99.5);
}

export function CompareHybridPanel() {
  const steps = 37; // T+0..T+36 (monthly)
  const [tIndex, setTIndex] = useState(18);
  const [autopilotOpen, setAutopilotOpen] = useState(true);
  const [findingsOpen, setFindingsOpen] = useState(false);

  // Auto-open Key Findings at end of timeline (T+36)
  useEffect(() => {
    if (tIndex >= 36) setFindingsOpen(true);
  }, [tIndex]);

  const { runsA, runsB } = useMemo(() => synthRuns({ runs: 1600, steps }), [steps]);

  const bandsA = useMemo(() => computeBands(runsA), [runsA]);
  const bandsB = useMemo(() => computeBands(runsB), [runsB]);

  const a50 = bandsA.p50[tIndex];
  const b50 = bandsB.p50[tIndex];
  const delta = b50 - a50;

  const conf = confidenceFromBands(bandsA, bandsB, tIndex);

  return (
    <div className="w-full h-full p-6 bg-[#050b14] relative">
      <div className="max-w-[1400px] mx-auto h-full flex flex-col gap-4">
        {/* KPI Row */}
        <div className="grid grid-cols-12 gap-3">
          <MetricCard
            title="BASELINE (A) — MEDIAN"
            value={fmtMoneyM(a50)}
            sub={`P05 ${fmtMoneyM(bandsA.p05[tIndex])}  •  P95 ${fmtMoneyM(bandsA.p95[tIndex])}`}
            tone="cyan"
          />
          <MetricCard
            title="EXPLORATION (B) — MEDIAN"
            value={fmtMoneyM(b50)}
            sub={`P05 ${fmtMoneyM(bandsB.p05[tIndex])}  •  P95 ${fmtMoneyM(bandsB.p95[tIndex])}`}
            tone="gold"
          />
          <MetricCard
            title="DIVERGENCE GAP (Δ)"
            value={fmtMoneyM(delta)}
            sub={`T+${tIndex} months`}
            tone={delta >= 0 ? "emerald" : "red"}
          />
          <MetricCard
            title="CONFIDENCE"
            value={`${conf.toFixed(0)}%`}
            sub={`Band width drives confidence`}
            tone={conf >= 75 ? "emerald" : conf >= 55 ? "slate" : "red"}
          />
        </div>

        {/* Main: Chart + Heatmap */}
        <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
          {/* Left: Spaghetti */}
          <div className="col-span-8 bg-[#070f1a] border border-slate-800/60 rounded-xl overflow-hidden shadow-[0_0_0_1px_rgba(0,0,0,0.35)] flex flex-col min-h-0">
            <div className="px-4 py-3 border-b border-slate-800/60 flex items-center justify-between">
              <div>
                <div className="text-[11px] tracking-widest text-slate-400 font-semibold uppercase">
                  Monte Carlo Futures — 10,000 Logic (MVP Render)
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Two distributions over time. Density = probability. Bands = P05/P50/P95.
                </div>
              </div>

              <div className="text-[10px] text-slate-400 font-mono bg-slate-900/50 border border-slate-800 px-2 py-1 rounded">
                METRIC: ARR ($M)
              </div>
            </div>

            <div className="flex-1 min-h-0">
              <SpaghettiCanvas
                runsA={runsA}
                runsB={runsB}
                bandsA={bandsA}
                bandsB={bandsB}
                tIndex={tIndex}
                yLabel="$M"
              />
            </div>

            {/* Timeline scrub */}
            <div className="px-4 py-3 border-t border-slate-800/60 bg-[#050b14]">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] text-slate-500 tracking-widest uppercase">
                  Timeline
                </div>
                <div className="text-[10px] font-mono text-slate-300">
                  T+{tIndex} / 36
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={36}
                value={tIndex}
                onChange={(e) => setTIndex(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400"
              />
              <div className="flex justify-between text-[9px] text-slate-600 mt-1 font-mono">
                <span>NOW</span>
                <span>T+12</span>
                <span>T+24</span>
                <span>HORIZON</span>
              </div>
            </div>
          </div>

          {/* Right: Heatmap + Autopilot */}
          <div className="col-span-4 flex flex-col gap-4 min-h-0">
            {/* Driver Heatmap */}
            <div className="bg-[#070f1a] border border-slate-800/60 rounded-xl overflow-hidden shadow-[0_0_0_1px_rgba(0,0,0,0.35)] flex flex-col flex-1 min-h-0">
              <div className="px-4 py-3 border-b border-slate-800/60">
                <div className="text-[11px] tracking-widest text-slate-400 font-semibold uppercase">
                  Driver Heatmap
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Contribution / sensitivity over time (MVP scaffolding).
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-auto">
                <HeatmapDrivers
                  steps={steps}
                  tIndex={tIndex}
                />
              </div>
            </div>

            {/* Strategic Autopilot Panel */}
            <div className="bg-[#070f1a] border border-slate-800/60 rounded-xl overflow-hidden shadow-[0_0_0_1px_rgba(0,0,0,0.35)] shrink-0">
              <button
                onClick={() => setAutopilotOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-cyan-400/15 border border-cyan-500/25 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-cyan-300" />
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] tracking-widest text-slate-500 uppercase">STRATEGIC AUTOPILOT</div>
                    <div className="text-[11px] font-semibold text-slate-200">Path Divergence Analysis</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[9px] px-2 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 font-semibold">
                    HIGH RISK
                  </span>
                  <span className="text-slate-500 text-xs">{autopilotOpen ? "▾" : "▸"}</span>
                </div>
              </button>

              {autopilotOpen && (
                <div className="px-4 pb-4 border-t border-slate-800/60">
                  <div className="pt-3 text-[11px] leading-relaxed text-slate-400">
                    Divergence is <span className="text-slate-200 font-semibold">ACCELERATING</span>. Gap widens after Month 36.
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="rounded-lg border border-slate-700/60 bg-slate-800/30 p-2">
                      <div className="text-[9px] text-slate-500 tracking-widest uppercase">TOTAL AREA</div>
                      <div className="text-cyan-300 font-semibold text-sm">147.4</div>
                    </div>
                    <div className="rounded-lg border border-slate-700/60 bg-slate-800/30 p-2">
                      <div className="text-[9px] text-slate-500 tracking-widest uppercase">MAX GAP</div>
                      <div className="text-amber-300 font-semibold text-sm">9.3</div>
                    </div>
                    <div className="rounded-lg border border-slate-700/60 bg-slate-800/30 p-2">
                      <div className="text-[9px] text-slate-500 tracking-widest uppercase">MOMENTUM</div>
                      <div className="text-rose-300 font-semibold text-sm">↗</div>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => setFindingsOpen(true)}
                      className="flex-1 rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-3 py-2 text-[11px] text-cyan-200 hover:bg-cyan-500/20 transition-colors"
                    >
                      View Key Findings
                    </button>
                    <button
                      className="rounded-lg border border-slate-700/60 bg-slate-800/30 px-3 py-2 text-[11px] text-slate-400 hover:bg-slate-700/40 transition-colors"
                    >
                      Lock Baseline
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KEY FINDINGS OVERLAY */}
      {findingsOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setFindingsOpen(false)}
          />
          <div className="relative w-[720px] max-w-[92vw] rounded-2xl border border-slate-700/60 bg-[#0a1220] shadow-[0_18px_90px_rgba(0,0,0,0.75)] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60">
              <div>
                <div className="text-[10px] tracking-widest text-slate-500 uppercase">COMPARE • KEY FINDINGS</div>
                <div className="text-[15px] font-semibold text-slate-100">Path Divergence Summary</div>
              </div>
              <button
                onClick={() => setFindingsOpen(false)}
                className="h-8 w-8 rounded-lg border border-slate-700/60 bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-5 space-y-3">
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                <div className="text-[12px] font-semibold text-cyan-200">1) Divergence Accelerates After Month 36</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Decision impact compounds over time; the trajectories separate materially in the late stage.
                </div>
              </div>

              <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
                <div className="text-[12px] font-semibold text-indigo-200">2) Exploration Adds Growth, Raises Volatility</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Higher upside potential, but volatility increases — buffer requirements rise.
                </div>
              </div>

              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="text-[12px] font-semibold text-amber-200">3) Recommendation</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Treat this as a controlled experiment: cap downside exposure, add contingency triggers, and re-run at Month 12 checkpoints.
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-700/60 flex items-center justify-end gap-2">
              <button
                onClick={() => setFindingsOpen(false)}
                className="rounded-lg border border-slate-700/60 bg-slate-800/50 px-4 py-2 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
              >
                Close
              </button>
              <button
                className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-4 py-2 text-[11px] text-cyan-200 hover:bg-cyan-500/20 transition-colors"
              >
                Export Findings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
