// src/pages/terrain/TerrainOverlays/TerrainOverlayLayer.tsx
// STRATFIT — Terrain Overlay Orchestrator
// Mounts all overlay layers above MountainEngine canvas.
// Accepts enabled flags + engine outputs. No new simulation runs.

import React from "react";
import HeatmapOverlay from "./HeatmapOverlay";
import TrajectoryOverlay from "./TrajectoryOverlay";
import SensitivityNodes from "./SensitivityNodes";
import ConfidenceBandOverlay from "./ConfidenceBandOverlay";
import HorizonReferenceLine from "./HorizonReferenceLine";
import MountainRegionLabels from "./MountainRegionLabels";

interface TerrainOverlayLayerProps {
  /** Master toggle for intelligence overlays */
  intelligenceEnabled: boolean;
  /** Toggle for heatmap (risk density) */
  heatmapEnabled: boolean;
  /** 7-vector data points from engine */
  dataPoints: number[];
  /** Risk score 0–100 (higher = more dangerous) */
  riskScore: number;
  /** Variance 0–1 derived from scenario spread */
  variance: number;
  /** Runway in months */
  runway: number;
  /** LTV/CAC ratio */
  ltvCac: number;
  /** Survival probability % */
  survivalPct: number;
}

const TerrainOverlayLayer: React.FC<TerrainOverlayLayerProps> = ({
  intelligenceEnabled,
  heatmapEnabled,
  dataPoints,
  riskScore,
  variance,
  runway,
  ltvCac,
  survivalPct,
}) => {
  return (
    <>
      {/* Confidence band — below trajectory */}
      <ConfidenceBandOverlay
        enabled={intelligenceEnabled}
        dataPoints={dataPoints}
        variance={variance}
      />

      {/* Heatmap — risk density gradient */}
      <HeatmapOverlay
        enabled={heatmapEnabled}
        riskScore={riskScore}
        variance={variance}
      />

      {/* Horizon reference line — sustainability threshold */}
      <HorizonReferenceLine
        enabled={intelligenceEnabled}
        survivalPct={survivalPct}
        runway={runway}
      />

      {/* Mountain region labels — zone identifiers at bottom */}
      <MountainRegionLabels
        enabled={intelligenceEnabled}
        dataPoints={dataPoints}
      />

      {/* Trajectory path — median expected line */}
      <TrajectoryOverlay
        enabled={intelligenceEnabled}
        dataPoints={dataPoints}
      />

      {/* Sensitivity nodes — ALWAYS VISIBLE with labels + hover detail */}
      <SensitivityNodes
        enabled={intelligenceEnabled}
        dataPoints={dataPoints}
        riskScore={riskScore}
        runway={runway}
        ltvCac={ltvCac}
        survivalPct={survivalPct}
      />
    </>
  );
};

export default TerrainOverlayLayer;
