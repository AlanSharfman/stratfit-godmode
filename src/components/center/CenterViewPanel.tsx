import React, { useEffect, useState, useMemo } from "react";
import type { CenterViewId } from "@/types/view";
import ScenarioMountain from "@/components/mountain/ScenarioMountain";
import GodModeMountain from "@/components/mountain/GodModeMountain";
import ScenarioDeltaSnapshot from "@/components/ScenarioDeltaSnapshot";

// Tab Components
import { RiskTab } from "@/components/Risk";
import { DecisionTab } from "@/components/Decision";
import { ValuationTab } from "@/components/valuation";
import { CompareTab } from "@/components/compare";
import { ImpactTab } from "@/components/impact";

import { useScenario, useScenarioStore } from "@/state/scenarioStore";
import { onCausal } from "@/ui/causalEvents";
import { engineResultToMountainForces } from "@/logic/mountainForces";

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
          <div className="relative h-full w-full overflow-auto rounded-3xl border border-slate-700/40 bg-black shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_60%,rgba(0,0,0,0.85)_100%)]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-black/60 via-black/20 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-linear-to-t from-black/80 via-black/30 to-transparent" />
            <div className="pointer-events-none absolute inset-0 rounded-3xl shadow-[inset_0_0_0_1px_rgba(34,211,238,0.06)]" />
            
            {/* Causal highlight band (no labels) — only after explicit user action */}
            {bandNonce > 0 ? (
              <div
                key={bandNonce}
                className={`sf-causal-band play ${bandStyle === "wash" ? "wash" : ""}`}
                style={{ ["--sf-causal" as string]: bandColor } as React.CSSProperties}
              />
            ) : null}

            <div className="relative h-full w-full">
              <ScenarioMountain 
                scenario={scenario} 
                dataPoints={dataPoints}
                activeKpiIndex={hoveredKpiIndex}
              />
            </div>

            <div className="mt-3 px-1">
            </div>
          </div>
        )}

        {/* SIMULATE - Shows during simulation (same mountain + overlay) */}
        {view === "simulate" && (
          <div className="relative h-full w-full overflow-auto rounded-3xl border border-slate-700/40 bg-black shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.03)]">
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

        {/* COMPARE - God Mode: Dual scenario holographic glass mountain with lava rivers */}
        {view === "compare" && (
          <div className="h-full w-full overflow-hidden rounded-3xl border border-slate-700/40 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
            <GodModeMountain />
          </div>
        )}

        {/* IMPACT - Sensitivity analysis */}
        {view === "impact" && (
          <div className="h-full w-full overflow-auto rounded-3xl border border-slate-700/40 bg-linear-to-br from-slate-950/60 to-black/80 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
            <ImpactTab />
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
