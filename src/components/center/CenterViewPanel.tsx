import React, { useEffect, useState, useMemo } from "react";
import type { CenterViewId } from "@/types/view";
import ScenarioMountain from "@/components/mountain/ScenarioMountain";
import HudKpis from "./HudKpis";

import ScenarioDeltaSnapshot from "@/components/ScenarioDeltaSnapshot";

import { useScenario, useScenarioStore } from "@/state/scenarioStore";
import { onCausal } from "@/ui/causalEvents";
import { engineResultToMountainForces } from "@/logic/mountainForces";

import styles from "./CenterViewPanel.module.css";

export default function CenterViewPanel(props: { view?: CenterViewId }) {
  const { view = "impact" } = props;
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
    <div className={styles.sfCenterRoot}>
      {/* G-D MODE: KPI HUD */}
      <div className={styles.sfHudStage}>
        <HudKpis />
      </div>

      {/* G-D MODE: Mountain Stage (fills remaining space) */}
      <div className={styles.sfMountainStage} data-tour="mountain">
        {view === "terrain" && (
          <div className={styles.sfViewWrapper}>
            {/* Atmospheric overlays */}
            <div className={styles.sfViewOverlays}>
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_60%,rgba(0,0,0,0.85)_100%)]" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-black/60 via-black/20 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-linear-to-t from-black/80 via-black/30 to-transparent" />
              <div className="pointer-events-none absolute inset-0 rounded-3xl shadow-[inset_0_0_0_1px_rgba(34,211,238,0.06)]" />
            </div>

            {/* Causal highlight band (no labels) — only after explicit user action */}
            {bandNonce > 0 ? (
              <div
                key={bandNonce}
                className={`${styles.sfCausalBand} sf-causal-band play ${bandStyle === "wash" ? "wash" : ""}`}
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
          </div>
        )}

        {view === "impact" && (
          <div className={styles.sfViewWrapper} style={{ padding: "24px" }}>
            <ScenarioDeltaSnapshot />
          </div>
        )}

        {view === "compare" && (
          <div className={styles.sfViewWrapper} style={{ padding: "24px", opacity: 0.7 }}>
            Compare (disabled)
          </div>
        )}
      </div>
    </div>
  );
}




