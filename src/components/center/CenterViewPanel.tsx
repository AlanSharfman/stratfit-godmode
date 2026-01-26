import React, { useEffect, useState, useMemo } from "react";
import * as THREE from "three";
import type { CenterViewId } from "@/types/view";
import ScenarioMountain from "@/components/mountain/ScenarioMountain";
import { GodModeMountain } from "@/components/compare/GodModeMountain";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette, SMAA } from "@react-three/postprocessing";
import { Environment } from "@react-three/drei";

// ScenarioData interface for mountain visualization
interface ScenarioData {
  score: number;
  arr: number;
  survival: number;
  runway: number;
  label?: string;
}

// Tab Components
import { RiskTab } from "@/components/Risk";
import { DecisionTab } from "@/components/Decision";
import { ValuationTab } from "@/components/valuation";
import { ImpactGodMode } from "@/components/impact";

import { useScenario, useScenarioStore } from "@/state/scenarioStore";
import { onCausal } from "@/ui/causalEvents";
import { engineResultToMountainForces } from "@/logic/mountainForces";
import { useSimulationStore } from "@/state/simulationStore";
import { useSavedSimulationsStore } from "@/state/savedSimulationsStore";

interface CenterViewPanelProps {
  view?: CenterViewId;
  viewMode?: CenterViewId;
  timelineEnabled?: boolean;
  heatmapEnabled?: boolean;
  onSimulateRequest?: () => void;
}

export default function CenterViewPanel(props: CenterViewPanelProps) {
  // Support both `view` and `viewMode` props for compatibility
  const view = props.viewMode ?? props.view ?? "terrain";
  const scenario = useScenario();
  const engineResults = useScenarioStore((s) => s.engineResults);
  const hoveredKpiIndex = useScenarioStore((s) => s.hoveredKpiIndex);

  // PHASE-IG: Wire engineResults → mountain forces (7-vector for now)
  const dataPoints = useMemo(() => {
    const er = engineResults?.[scenario];
    return engineResultToMountainForces(er);
  }, [engineResults, scenario]);

  // GOD MODE MOUNTAIN: Get simulation data from stores
  const simulationSummary = useSimulationStore((s) => s.summary);
  const savedBaseline = useSavedSimulationsStore((s) => s.simulations.find((sim) => sim.isBaseline));

  // Build scenario data for GodModeMountain (Gravity = Time visualization)
  const godModeScenarioA: ScenarioData = useMemo(() => ({
    score: savedBaseline?.summary.overallScore || 
           (engineResults?.base?.kpis?.qualityScore ? Math.round((engineResults.base.kpis.qualityScore as any).value * 100) : 72),
    arr: savedBaseline?.summary.arrMedian || 
         engineResults?.base?.kpis?.arrCurrent?.value || 2100000,
    survival: savedBaseline?.summary.survivalRate 
              ? savedBaseline.summary.survivalRate * 100 
              : (engineResults?.base?.kpis?.runway?.value ? Math.min(100, (engineResults.base.kpis.runway.value / 36) * 100) : 78),
    runway: savedBaseline?.summary.runwayMedian || 
            engineResults?.base?.kpis?.runway?.value || 18,
    label: "BASELINE"
  }), [savedBaseline, engineResults]);

  const godModeScenarioB: ScenarioData = useMemo(() => ({
    score: simulationSummary?.overallScore || 
           (engineResults?.[scenario]?.kpis?.qualityScore ? Math.round((engineResults[scenario].kpis.qualityScore as any).value * 100) : 65),
    arr: simulationSummary?.arrMedian || 
         engineResults?.[scenario]?.kpis?.arrCurrent?.value || 2400000,
    survival: simulationSummary?.survivalRate 
              ? simulationSummary.survivalRate * 100 
              : (engineResults?.[scenario]?.kpis?.runway?.value ? Math.min(100, (engineResults[scenario].kpis.runway.value / 36) * 100) : 68),
    runway: simulationSummary?.runwayMedian || 
            engineResults?.[scenario]?.kpis?.runway?.value || 16,
    label: "EXPLORATION"
  }), [simulationSummary, engineResults, scenario]);

  // CAUSAL HIGHLIGHT — Mountain band (Phase 1, UI-only)
  const [bandNonce, setBandNonce] = useState(0);
  const [bandStyle, setBandStyle] = useState<"solid" | "wash">("solid");
  const [bandColor, setBandColor] = useState("rgba(34,211,238,0.18)");

  // COMPARE timeline: T+0 .. T+36 mapped to 0..1
  const [compareT, setCompareT] = useState(0.5);

  // COMPARE UI state
  const [autopilotOpen, setAutopilotOpen] = useState(false);     // drawer summary
  const [findingsOpen, setFindingsOpen] = useState(false);       // overlay

  useEffect(() => {
    const off = onCausal((detail) => {
      setBandStyle(detail.bandStyle);
      setBandColor(detail.color);
      setBandNonce((n) => n + 1);
    });
    return off;
  }, []);

  // Auto-open Key Findings at end of timeline (T+36)
  useEffect(() => {
    if (compareT >= 0.999) setFindingsOpen(true);
  }, [compareT]);

  return (
    <div className="relative flex h-full w-full flex-col rounded-xl bg-black/40 backdrop-blur-sm border border-white/5 overflow-auto">
      {/* Center Stage */}
      {/* STRATFIT RULE:
          Mountain dominance locked at ~65% viewport height.
          Do not adjust without design sign-off. */}
      <div className="mountain-stage relative w-full flex-1 p-4" data-tour="mountain">
        {view === "terrain" && (
          <div className="relative h-full w-full overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-b from-slate-950 via-slate-900 to-black shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08),0_0_60px_rgba(34,211,238,0.08)]">
            {/* Cyan accent border glow */}
            <div className="pointer-events-none absolute inset-0 rounded-3xl shadow-[inset_0_0_0_1px_rgba(34,211,238,0.2),inset_0_0_30px_rgba(34,211,238,0.05)]" />
            
            {/* Causal highlight band (no labels) — only after explicit user action */}
            {bandNonce > 0 ? (
              <div
                key={bandNonce}
                className={`sf-causal-band play ${bandStyle === "wash" ? "wash" : ""}`}
                style={{ ["--sf-causal" as string]: bandColor } as React.CSSProperties}
              />
            ) : null}

            {/* Dark Wireframe Mountain */}
            <div className="relative h-full w-full" style={{ filter: 'brightness(1.15) saturate(1.2) contrast(1.05)' }}>
              <ScenarioMountain 
                scenario={scenario} 
                dataPoints={dataPoints}
                activeKpiIndex={hoveredKpiIndex}
              />
            </div>
          </div>
        )}

        {/* SIMULATE - Shows during simulation (same mountain + overlay) */}
        {view === "simulate" && (
          <div className="relative h-full w-full overflow-hidden rounded-3xl border border-slate-700/40 bg-black shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_60%,rgba(0,0,0,0.85)_100%)]" />
            <div className="relative h-full w-full">
              <ScenarioMountain 
                scenario={scenario} 
                dataPoints={dataPoints}
                activeKpiIndex={hoveredKpiIndex}
              />
            </div>
          </div>
        )}

        {/* COMPARE - God Mode: Gravity = Time Mountain Visualization */}
        {view === "compare" && (
          <div className="h-full w-full overflow-hidden rounded-3xl border border-slate-700/40 shadow-[0_8px_32px_rgba(0,0,0,0.6)] bg-[#050b14] relative">
            {/* COMPARE TIMELINE (Focus Control) */}
            <div className="pointer-events-auto absolute left-1/2 top-5 z-20 -translate-x-1/2 rounded-xl border border-white/10 bg-black/35 px-4 py-2 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.45)]">
              <div className="flex items-center gap-3">
                <div className="text-[11px] tracking-[0.22em] text-white/60">TIMELINE</div>
                <div className="text-[11px] font-semibold text-white/80">
                  T+{Math.round(compareT * 36)}
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.001}
                  value={compareT}
                  onChange={(e) => setCompareT(parseFloat(e.target.value))}
                  className="w-[260px] accent-cyan-300"
                />
              </div>
            </div>

            {/* AUTOPILOT DRAWER (summary, default closed) */}
            <div className="pointer-events-auto absolute left-6 bottom-6 z-30">
              <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md shadow-[0_14px_60px_rgba(0,0,0,0.55)] overflow-hidden w-[360px]">
                <button
                  onClick={() => setAutopilotOpen(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-cyan-400/15 border border-cyan-300/20 flex items-center justify-center">
                      <span className="text-cyan-200 text-sm">⚡</span>
                    </div>
                    <div className="text-left">
                      <div className="text-[11px] tracking-[0.22em] text-white/55">STRATEGIC AUTOPILOT</div>
                      <div className="text-[12px] font-semibold text-white/85">Path Divergence Analysis</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-1 rounded-full border border-amber-400/20 bg-amber-400/10 text-amber-200">
                      HIGH RISK
                    </span>
                    <span className="text-white/60 text-xs">{autopilotOpen ? "▾" : "▸"}</span>
                  </div>
                </button>

                {autopilotOpen && (
                  <div className="px-4 pb-4">
                    <div className="text-[12px] leading-relaxed text-white/75">
                      Divergence is <span className="text-white/90 font-semibold">ACCELERATING</span>. Gap widens after Month 36.
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                        <div className="text-[10px] text-white/50 tracking-[0.18em]">TOTAL AREA</div>
                        <div className="text-cyan-200 font-semibold">147.4</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                        <div className="text-[10px] text-white/50 tracking-[0.18em]">MAX GAP</div>
                        <div className="text-amber-200 font-semibold">9.3</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                        <div className="text-[10px] text-white/50 tracking-[0.18em]">MOMENTUM</div>
                        <div className="text-rose-200 font-semibold">↗</div>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => setFindingsOpen(true)}
                        className="flex-1 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-[12px] text-cyan-100"
                      >
                        View Key Findings
                      </button>
                      <button
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[12px] text-white/70"
                      >
                        Lock Baseline
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* KEY FINDINGS OVERLAY (event-based) */}
            {findingsOpen && (
              <div className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center">
                <div
                  className="absolute inset-0 bg-black/55"
                  onClick={() => setFindingsOpen(false)}
                />
                <div className="relative w-[720px] max-w-[92vw] rounded-3xl border border-white/10 bg-black/55 backdrop-blur-xl shadow-[0_18px_90px_rgba(0,0,0,0.75)] overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                    <div>
                      <div className="text-[11px] tracking-[0.22em] text-white/55">COMPARE • KEY FINDINGS</div>
                      <div className="text-[16px] font-semibold text-white/90">Path Divergence Summary</div>
                    </div>
                    <button
                      onClick={() => setFindingsOpen(false)}
                      className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 text-white/70"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="px-6 py-5 space-y-3">
                    <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/5 p-4">
                      <div className="text-[12px] font-semibold text-cyan-100">1) Divergence Accelerates After Month 36</div>
                      <div className="text-[12px] text-white/70 mt-1">
                        Decision impact compounds over time; the trajectories separate materially in the late stage.
                      </div>
                    </div>

                    <div className="rounded-2xl border border-indigo-300/15 bg-indigo-300/5 p-4">
                      <div className="text-[12px] font-semibold text-indigo-100">2) Exploration Adds Growth, Raises Volatility</div>
                      <div className="text-[12px] text-white/70 mt-1">
                        Higher upside potential, but volatility increases — buffer requirements rise.
                      </div>
                    </div>

                    <div className="rounded-2xl border border-amber-300/15 bg-amber-300/5 p-4">
                      <div className="text-[12px] font-semibold text-amber-100">3) Recommendation</div>
                      <div className="text-[12px] text-white/70 mt-1">
                        Treat this as a controlled experiment: cap downside exposure, add contingency triggers, and re-run at Month 12 checkpoints.
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-4 border-t border-white/10 flex items-center justify-end gap-2">
                    <button
                      onClick={() => setFindingsOpen(false)}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[12px] text-white/75"
                    >
                      Close
                    </button>
                    <button
                      className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-[12px] text-cyan-100"
                    >
                      Export Findings
                    </button>
                  </div>
                </div>
              </div>
            )}

            <Canvas
              camera={{ position: [0, 4.2, 11.5], fov: 42 }}
              gl={{
                antialias: true,
                alpha: false,
                powerPreference: "high-performance",
              }}
              dpr={[1, 2]}
              onCreated={({ gl }) => {
                gl.toneMappingExposure = 0.95; // Lower exposure for silhouette definition
              }}
            >
              <Environment preset="studio" blur={0.9} />
              <GodModeMountain 
                scenarioA={godModeScenarioA}
                scenarioB={godModeScenarioB}
                t={compareT}
              />
              <EffectComposer disableNormalPass>
                <Bloom
                  luminanceThreshold={1.5}
                  luminanceSmoothing={0.4}
                  intensity={0.6}
                  mipmapBlur
                />
                <Vignette eskil={false} offset={0.1} darkness={0.8} />
                <SMAA />
              </EffectComposer>
            </Canvas>
          </div>
        )}

        {/* IMPACT - Sensitivity analysis */}
        {view === "impact" && (
          <div className="h-full w-full overflow-auto rounded-3xl border border-slate-700/40 bg-linear-to-br from-slate-950/60 to-black/80 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
            <ImpactGodMode />
          </div>
        )}

        {/* RISK - Risk breakdown and threat assessment */}
        {view === "risk" && (
          <div className="h-full w-full overflow-auto rounded-3xl border border-slate-700/40 bg-linear-to-br from-slate-950/60 to-black/80 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
            <RiskTab />
          </div>
        )}

        {/* DECISION - Decision support and recommendations */}
        {view === "decision" && (
          <div className="h-full w-full overflow-auto rounded-3xl border border-slate-700/40 bg-linear-to-br from-slate-950/60 to-black/80 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
            <DecisionTab />
          </div>
        )}

        {/* VALUATION - Company valuation scenarios */}
        {view === "valuation" && (
          <div className="h-full w-full overflow-auto rounded-3xl border border-slate-700/40 bg-linear-to-br from-slate-950/60 to-black/80 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
            <ValuationTab />
          </div>
        )}
      </div>
    </div>
  );
}
