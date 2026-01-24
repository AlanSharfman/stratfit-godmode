// src/components/center/CenterViewPanel.tsx
// STRATFIT GOD MODE — Clean Mountain Compound
// TABS MOVED TO HEADER — Mountain is ALWAYS visible, tabs overlay on top

import React, { useEffect, useState, useMemo } from "react";
import ScenarioMountain from "@/components/mountain/ScenarioMountain";
import TradeOffsTab from "@/components/tradeoffs/TradeOffsTab";
import CompareTab from "@/components/compare/CompareTab";
import { RiskTab } from "@/components/Risk";
import { DecisionTab } from "@/components/Decision";
import { ValuationTab } from "@/components/valuation";

import { useScenarioStore } from "@/state/scenarioStore";
import { useShallow } from "zustand/react/shallow";
import { onCausal } from "@/ui/causalEvents";
import { engineResultToMountainForces } from "@/logic/mountainForces";

import styles from "./CenterViewPanel.module.css";

// View mode is now controlled by parent (App.tsx via header)
export type ViewMode = "terrain" | "impact" | "compare" | "simulate" | "risk" | "decision" | "valuation";

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
  const {
    activeScenarioId,
    engineResults,
    hoveredKpiIndex,
    activeLeverId,
    leverIntensity01,
  } = useScenarioStore(
    useShallow((s) => ({
      activeScenarioId: s.activeScenarioId,
      engineResults: s.engineResults,
      hoveredKpiIndex: s.hoveredKpiIndex,
      activeLeverId: s.activeLeverId,
      leverIntensity01: s.leverIntensity01,
    }))
  );

  // Engine → mountain forces (7-vector). If missing, ScenarioMountain has safe fallback.
  const dataPoints = useMemo(() => {
    const er = engineResults?.[activeScenarioId];
    return engineResultToMountainForces(er);
  }, [engineResults, activeScenarioId]);

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

  // Dim rules (Design Director locked)
  const dimOpacity =
    viewMode === "terrain" ? 0 :
    viewMode === "simulate" ? 0.55 :
    viewMode === "compare" || viewMode === "impact" ? 0.25 :
    viewMode === "risk" || viewMode === "decision" || viewMode === "valuation" ? 0.40 :
    0.30;

  return (
    <div className={styles.sfCenterRoot}>
      {/* MOUNTAIN STAGE — NO TABS, just the canvas */}
      <div className={styles.sfMountainStage} data-tour="mountain">

        {/* ========================================
           BASE LAYER (ALWAYS ON): Mountain canvas
           ======================================== */}
        <div className={styles.sfViewWrapper} data-view="mountain-base">
            {/* ═══════════════════════════════════════════════════════════════
                TACTICAL BRACKETS — Corner mounting hardware
               ═══════════════════════════════════════════════════════════════ */}
            <div className={styles.tacticalBracket} data-corner="tl" />
            <div className={styles.tacticalBracket} data-corner="tr" />
            <div className={styles.tacticalBracket} data-corner="bl" />
            <div className={styles.tacticalBracket} data-corner="br" />
            
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

            <div className={styles.sfMountainFill}>
              <ScenarioMountain 
                scenario={activeScenarioId}
                dataPoints={dataPoints as number[]}
                activeKpiIndex={hoveredKpiIndex}
                activeLeverId={activeLeverId as any}
                leverIntensity01={leverIntensity01}
                timelineEnabled={timelineEnabled}
                heatmapEnabled={heatmapEnabled}
              />
            </div>

            {/* DIMMER LAYER (page-dependent) */}
            <div className={styles.sfAmbientDim} style={{ opacity: dimOpacity }} />
        </div>

        {/* ========================================
            CONTENT OVERLAYS (on top of mountain)
            ======================================== */}
        {viewMode === "impact" && (
          <div className={styles.sfTabOverlay} data-view="trade-offs">
            <TradeOffsTab
              baseScenario={{
                cash: 2400000,
                runway: 18,
                name: "Base Scenario"
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
          <div className={styles.sfTabOverlay} data-view="compare">
            <CompareTab />
          </div>
        )}

        {/* ========================================
            RISK VIEW
            ======================================== */}
        {viewMode === "risk" && (
          <div className={styles.sfTabOverlay} data-view="risk">
            <RiskTab />
          </div>
        )}

        {/* ========================================
            DECISION VIEW
            ======================================== */}
        {viewMode === "decision" && (
          <div className={styles.sfTabOverlay} data-view="decision">
            <DecisionTab />
          </div>
        )}

        {/* ========================================
            VALUATION VIEW
            ======================================== */}
        {viewMode === "valuation" && (
          <div className={styles.sfTabOverlay} data-view="valuation">
            <ValuationTab />
          </div>
        )}
      </div>
    </div>
  );
}
