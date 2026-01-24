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
  onSimulateRequest?: () => void;
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

  const dataPoints = useMemo(() => {
    const er = engineResults?.[activeScenarioId];
    return engineResultToMountainForces(er);
  }, [engineResults, activeScenarioId]);

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

  useEffect(() => {
    if (viewMode === 'simulate' && onSimulateRequest) {
      onSimulateRequest();
    }
  }, [viewMode, onSimulateRequest]);

  const dimOpacity =
    viewMode === "terrain" ? 0 :
    viewMode === "simulate" ? 0.55 :
    viewMode === "compare" || viewMode === "impact" ? 0.25 :
    viewMode === "risk" || viewMode === "decision" || viewMode === "valuation" ? 0.40 :
    0.30;

  return (
    <div className={styles.sfCenterRoot}>
      <div className={styles.sfMountainStage} data-tour="mountain">
        
        {/* MOUNTAIN WRAPPER - uses inline styles to guarantee visibility */}
        <div 
          style={{
            position: 'absolute',
            top: 14,
            left: 14,
            right: 14,
            bottom: 14,
            borderRadius: 14,
            overflow: 'hidden',
            zIndex: 5,
            background: '#0b1220',
            // GOD MODE: Crystal clear vibrant mountain
            filter: 'brightness(1.5) contrast(1.2) saturate(1.15)',
          }}
        >
          {/* MOUNTAIN CANVAS - fills the wrapper */}
          <ScenarioMountain 
            scenario={activeScenarioId}
            dataPoints={dataPoints as number[]}
            activeKpiIndex={hoveredKpiIndex}
            activeLeverId={activeLeverId as any}
            leverIntensity01={leverIntensity01}
            timelineEnabled={timelineEnabled}
            heatmapEnabled={heatmapEnabled}
          />

          {/* DIMMER LAYER */}
          {dimOpacity > 0 && (
            <div 
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 10,
                pointerEvents: 'none',
                background: `radial-gradient(ellipse at center, rgba(0,0,0,${dimOpacity * 0.3}) 0%, rgba(0,0,0,${dimOpacity}) 70%, rgba(0,0,0,${dimOpacity * 1.2}) 100%)`,
              }}
            />
          )}

          {/* TACTICAL BRACKETS */}
          <div className={styles.tacticalBracket} data-corner="tl" />
          <div className={styles.tacticalBracket} data-corner="tr" />
          <div className={styles.tacticalBracket} data-corner="bl" />
          <div className={styles.tacticalBracket} data-corner="br" />

          {/* CAUSAL BAND */}
          {bandNonce > 0 && (
            <div
              key={bandNonce}
              className={`${styles.sfCausalBand} sf-causal-band play ${bandStyle === "wash" ? "wash" : ""}`}
              style={{ ["--sf-causal" as string]: bandColor } as React.CSSProperties}
            />
          )}
        </div>

        {/* TAB OVERLAYS */}
        {viewMode === "impact" && (
          <div className={styles.sfTabOverlay}>
            <TradeOffsTab
              baseScenario={{ cash: 2400000, runway: 18, name: "Base Scenario" }}
              onScenarioUpdate={(s) => console.log('Trade-offs updated:', s)}
            />
          </div>
        )}

        {viewMode === "compare" && (
          <div className={styles.sfTabOverlay}>
            <CompareTab />
          </div>
        )}

        {viewMode === "risk" && (
          <div className={styles.sfTabOverlay}>
            <RiskTab />
          </div>
        )}

        {viewMode === "decision" && (
          <div className={styles.sfTabOverlay}>
            <DecisionTab />
          </div>
        )}

        {viewMode === "valuation" && (
          <div className={styles.sfTabOverlay}>
            <ValuationTab />
          </div>
        )}
      </div>
    </div>
  );
}
