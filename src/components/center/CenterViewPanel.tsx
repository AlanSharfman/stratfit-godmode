// src/components/center/CenterViewPanel.tsx
// STRATFIT GOD MODE — Clean Mountain Compound
// TABS MOVED TO HEADER — This is now just the mountain canvas

import React, { useEffect, useState, useMemo } from "react";
import ScenarioMountain from "@/components/mountain/ScenarioMountain";
import CompareTabGodMode from "@/components/compare/CompareTabGodMode";
import TradeOffsTab from "@/components/tradeoffs/TradeOffsTab";

import { useScenario, useScenarioStore } from "@/state/scenarioStore";
import { onCausal } from "@/ui/causalEvents";
import { engineResultToMountainForces } from "@/logic/mountainForces";

import styles from "./CenterViewPanel.module.css";

// View mode is now controlled by parent (App.tsx via header)
export type ViewMode = "terrain" | "impact" | "compare" | "simulate";

interface CenterViewPanelProps {
  viewMode: ViewMode;
  timelineEnabled?: boolean;
  heatmapEnabled?: boolean;
  onSimulateRequest?: () => void; // When SIMULATE is active, parent handles the overlay
}

export default function CenterViewPanel({ 
  viewMode,
  timelineEnabled = false,
  heatmapEnabled = false,
  onSimulateRequest,
}: CenterViewPanelProps) {
  const scenario = useScenario();
  const engineResults = useScenarioStore((s) => s.engineResults);
  const hoveredKpiIndex = useScenarioStore((s) => s.hoveredKpiIndex);

  // Wire engineResults → mountain forces (7-vector)
  const dataPoints = useMemo(() => {
    const er = engineResults?.[scenario];
    return engineResultToMountainForces(er);
  }, [engineResults, scenario]);

  // CAUSAL HIGHLIGHT — Mountain band
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

  // If SIMULATE mode, trigger the parent's overlay
  useEffect(() => {
    if (viewMode === 'simulate' && onSimulateRequest) {
      onSimulateRequest();
    }
  }, [viewMode, onSimulateRequest]);

  return (
    <div className={styles.sfCenterRoot}>
      {/* MOUNTAIN STAGE — NO TABS, just the canvas */}
      <div className={styles.sfMountainStage} data-tour="mountain">
        
        {/* ========================================
            TERRAIN VIEW - Mountain with toggles
            ======================================== */}
        {(viewMode === "terrain" || viewMode === "simulate") && (
          <div className={styles.sfViewWrapper} data-view="terrain">
            {/* Atmospheric overlays */}
            <div className={styles.sfViewOverlays}>
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_60%,rgba(0,0,0,0.85)_100%)]" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-black/60 via-black/20 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-linear-to-t from-black/80 via-black/30 to-transparent" />
              <div className="pointer-events-none absolute inset-0 rounded-3xl shadow-[inset_0_0_0_1px_rgba(34,211,238,0.06)]" />
            </div>

            {/* Causal highlight band */}
            {bandNonce > 0 && (
              <div
                key={bandNonce}
                className={`${styles.sfCausalBand} sf-causal-band play ${bandStyle === "wash" ? "wash" : ""}`}
                style={{ ["--sf-causal" as string]: bandColor } as React.CSSProperties}
              />
            )}

            <div className="relative h-full w-full">
              <ScenarioMountain 
                scenario={scenario} 
                dataPoints={dataPoints}
                activeKpiIndex={hoveredKpiIndex}
                timelineEnabled={timelineEnabled}
                heatmapEnabled={heatmapEnabled}
              />
            </div>
          </div>
        )}

        {/* ========================================
            TRADE OFFS VIEW
            ======================================== */}
        {viewMode === "impact" && (
          <div className={styles.sfViewWrapper} data-view="trade-offs">
            <TradeOffsTab
              baseScenario={{
                cash: 2400000,
                runway: 18,
                name: scenario
              }}
              onScenarioUpdate={(updatedScenario) => {
                console.log('Trade-offs updated:', updatedScenario);
              }}
            />
          </div>
        )}

        {/* ========================================
            COMPARE VIEW
            ======================================== */}
        {viewMode === "compare" && (
          <div className={styles.sfViewWrapper} data-view="compare">
            <CompareTabGodMode />
          </div>
        )}
      </div>
    </div>
  );
}
