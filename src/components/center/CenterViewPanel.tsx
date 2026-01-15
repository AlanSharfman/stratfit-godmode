import React, { useEffect, useState } from "react";
import type { CenterViewId } from "@/types/view";
import ScenarioMountain from "@/components/mountain/ScenarioMountain";

import ScenarioDeltaSnapshot from "@/components/ScenarioDeltaSnapshot";

import { useScenario, useDataPoints, useScenarioStore } from "@/state/scenarioStore";
import { onCausal } from "@/ui/causalEvents";

export default function CenterViewPanel(props: { view?: CenterViewId }) {
  const { view = "impact" } = props;
  const scenario = useScenario();
  const dataPoints = useDataPoints();
  const hoveredKpiIndex = useScenarioStore((s) => s.hoveredKpiIndex);

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
            <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/60 via-black/20 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
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

        {view === "impact" && (
          <div className="h-full w-full overflow-auto rounded-3xl border border-slate-700/40 bg-gradient-to-br from-slate-950/60 to-black/80 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
            <ScenarioDeltaSnapshot />
          </div>
        )}

        {view === "compare" && (
          <div style={{ padding: 12, opacity: 0.7 }}>
            Compare (disabled)
          </div>
        )}
      </div>
    </div>
  );
}




