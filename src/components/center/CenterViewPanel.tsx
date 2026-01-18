import React, { useEffect, useState, useMemo } from "react";
import ScenarioMountain from "@/components/mountain/ScenarioMountain";
import ViewModeSelector, { type ViewMode } from "@/components/blocks/ViewModeSelector";
import TerrainToggles from "@/components/blocks/TerrainToggles";
import CompareTabGodMode from "@/components/compare/CompareTabGodMode";
import TradeOffsTab from "@/components/tradeoffs/TradeOffsTab";

import { useScenario, useScenarioStore } from "@/state/scenarioStore";
import { onCausal } from "@/ui/causalEvents";
import { engineResultToMountainForces } from "@/logic/mountainForces";
import { COMPARE_SCENARIOS, mapScenarioId } from "@/data/compareScenarios";

import styles from "./CenterViewPanel.module.css";

export default function CenterViewPanel() {
  const scenario = useScenario();
  const engineResults = useScenarioStore((s) => s.engineResults);
  const hoveredKpiIndex = useScenarioStore((s) => s.hoveredKpiIndex);

  // PHASE-IG: Wire engineResults → mountain forces (7-vector for now)
  const dataPoints = useMemo(() => {
    const er = engineResults?.[scenario];
    return engineResultToMountainForces(er);
  }, [engineResults, scenario]);

  // Main view mode state (Terrain | Trade offs | Compare)
  const [viewMode, setViewMode] = useState<ViewMode>("terrain");

  // Toggle states for Terrain view only
  // DEMO DEFAULTS: Both OFF for clean initial presentation
  const [timelineEnabled, setTimelineEnabled] = useState(false);
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);

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
      {/* VIEW MODE SELECTOR - Integrated Rail */}
      <div className={styles.sfViewSelector}>
        <ViewModeSelector
          activeMode={viewMode}
          onChange={setViewMode}
          rightSlot={
            <TerrainToggles
              timelineEnabled={timelineEnabled}
              heatmapEnabled={heatmapEnabled}
              onTimelineToggle={() => setTimelineEnabled(!timelineEnabled)}
              onHeatmapToggle={() => setHeatmapEnabled(!heatmapEnabled)}
              variant="rail"
            />
          }
        />
      </div>

      {/* G-D MODE: Mountain Stage (fills remaining space) */}
      <div className={styles.sfMountainStage} data-tour="mountain">
        {/* ========================================
            TERRAIN VIEW - Mountain with toggles
            ======================================== */}
        {viewMode === "terrain" && (
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
              {/* MOUNTAIN */}
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
            TRADE OFFS VIEW - Interactive Strategic Decision Sculpting
            ======================================== */}
        {viewMode === "impact" && (
          <div className={styles.sfViewWrapper}>
            <TradeOffsTab
              baseScenario={{
                cash: 2400000, // $2.4M default starting cash
                runway: 18,    // 18 months default runway
                name: scenario
              }}
              onScenarioUpdate={(updatedScenario) => {
                // Handle scenario updates if needed
                console.log('Trade-offs updated:', updatedScenario);
              }}
            />
          </div>
        )}

        {/* ========================================
            COMPARE VIEW - God Mode Dual Mountains
            ======================================== */}
        {viewMode === "compare" && (
          <div className={styles.sfViewWrapper}>
            <CompareTabGodMode
              selectedScenario={mapScenarioId(scenario)}
              scenarios={COMPARE_SCENARIOS}
            />
          </div>
        )}
      </div>
    </div>
  );
}
