// src/components/command/TerrainTheatre.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Terrain Theatre (Command Centre Intelligence Theatre)
//
// Wraps TerrainStage with cinematic director control:
//   - Camera responds to beat.cameraShot via CameraCompositionRig
//   - Highlight type drives terrain visual emphasis
//   - Laser targeting via intelligenceTargetStore
//
// No simulation engine changes. No terrain mesh changes.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useEffect, useMemo } from "react";
import TerrainStage from "@/terrain/TerrainStage";
import CameraCompositionRig from "@/scene/camera/CameraCompositionRig";
import SkyAtmosphere from "@/scene/rigs/SkyAtmosphere";
import type { CameraPreset } from "@/scene/camera/terrainCameraPresets";
import type { TerrainMetrics } from "@/terrain/terrainFromBaseline";
import type { Beat, CameraShot } from "./director/DirectorScript";
import { intelligenceTarget } from "@/stores/intelligenceTargetStore";

// ────────────────────────────────────────────────────────────────────────────
// CAMERA SHOT → PRESET MAPPING
// ────────────────────────────────────────────────────────────────────────────

const SHOT_PRESETS: Record<CameraShot, CameraPreset> = {
  wide: { pos: [-40, 150, 500], target: [-20, 14, 0], fov: 46 },
  track: { pos: [-80, 120, 420], target: [0, 20, -20], fov: 44 },
  zoom: { pos: [-20, 100, 280], target: [-10, 30, -10], fov: 40 },
  pan: { pos: [60, 130, 460], target: [-30, 18, 10], fov: 46 },
};

const DEFAULT_PRESET = SHOT_PRESETS.wide;

// ────────────────────────────────────────────────────────────────────────────
// DEFAULT TERRAIN METRICS (when no simulation data available)
// ────────────────────────────────────────────────────────────────────────────

const EMPTY_METRICS: TerrainMetrics = {
  elevationScale: 1,
  roughness: 1,
  liquidityDepth: 1,
  growthSlope: 0,
  volatility: 0,
};

// ────────────────────────────────────────────────────────────────────────────
// STYLES
// ────────────────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  viewport: {
    position: "relative",
    width: "100%",
    height: "100%",
    borderRadius: 10,
    overflow: "hidden",
    background: "#060d18",
  },
  vignette: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    borderRadius: 10,
    boxShadow:
      "inset 0 0 60px 20px rgba(0, 0, 0, 0.6), inset 0 -40px 60px -10px rgba(0, 0, 0, 0.4)",
    zIndex: 2,
  },
  shotLabel: {
    position: "absolute",
    bottom: 10,
    left: 14,
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: "rgba(34, 211, 238, 0.5)",
    fontFamily: "'Inter', system-ui, sans-serif",
    zIndex: 3,
    pointerEvents: "none",
  },
};

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────────────────────────────────

interface TerrainTheatreProps {
  /** Current director beat (null when idle) */
  currentBeat: Beat | null;
  /** Terrain metrics from simulation (optional) */
  terrainMetrics?: TerrainMetrics;
}

const TerrainTheatre: React.FC<TerrainTheatreProps> = memo(
  ({ currentBeat, terrainMetrics }) => {
    const preset = useMemo<CameraPreset>(() => {
      if (!currentBeat) return DEFAULT_PRESET;
      return SHOT_PRESETS[currentBeat.cameraShot] ?? DEFAULT_PRESET;
    }, [currentBeat]);

    const metrics = terrainMetrics ?? EMPTY_METRICS;

    // Drive intelligence target store from director beats
    useEffect(() => {
      if (currentBeat?.laserTargetKey) {
        intelligenceTarget.set(currentBeat.laserTargetKey);
      } else {
        intelligenceTarget.clear();
      }
      return () => {
        intelligenceTarget.clear();
      };
    }, [currentBeat?.laserTargetKey]);

    return (
      <div style={S.viewport}>
        <TerrainStage
          lockCamera
          pathsEnabled={false}
          terrainMetrics={metrics}
          heatmapEnabled={currentBeat?.highlightType === "risk_zone"}
        >
          <CameraCompositionRig preset={preset} />
          <SkyAtmosphere />
        </TerrainStage>
        <div style={S.vignette} />
        {currentBeat && (
          <div style={S.shotLabel}>
            {currentBeat.cameraShot} — {currentBeat.title}
          </div>
        )}
      </div>
    );
  },
);

TerrainTheatre.displayName = "TerrainTheatre";
export default TerrainTheatre;
