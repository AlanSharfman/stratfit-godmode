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

  useEffect(() => {
    const off = onCausal((detail) => {
      setBandStyle(detail.bandStyle);
      setBandColor(detail.color);
      setBandNonce((n) => n + 1);
    });
    return off;
  }, []);

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
          <div className="h-full w-full overflow-hidden rounded-3xl border border-slate-700/40 shadow-[0_8px_32px_rgba(0,0,0,0.6)] bg-[#050b14]">
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
