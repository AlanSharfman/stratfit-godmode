// src/components/terrain/compare/SplitTerrainView.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Split Terrain View (Phase D1 — God Mode)
//
// Side-by-side synchronized terrain comparison.
// Both sides share identical camera config, lighting, and lock state.
// Mouse orbit enabled: ±45° azimuth + vertical, no zoom, no pan.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo } from "react"
import TerrainStage from "@/terrain/TerrainStage"
import CameraCompositionRig from "@/scene/camera/CameraCompositionRig"
import SkyAtmosphere from "@/scene/rigs/SkyAtmosphere"
import type { TerrainMetrics } from "@/terrain/terrainFromBaseline"
import type { TerrainEvent } from "@/domain/events/terrainEventTypes"

export interface SplitTerrainViewProps {
  metricsA: TerrainMetrics
  metricsB: TerrainMetrics
  eventsA: TerrainEvent[]
  eventsB: TerrainEvent[]
  labelA?: string
  labelB?: string
}

const DEFAULT_METRICS: TerrainMetrics = {
  elevationScale: 1,
  roughness: 1,
  liquidityDepth: 1,
  growthSlope: 0,
  volatility: 0,
}

const AZIMUTH_LIMIT = Math.PI / 4  // ±45°
const POLAR_CENTER = 1.107         // midpoint of default polar range
const POLAR_LIMIT  = Math.PI / 4  // ±45° vertical

const SplitTerrainView: React.FC<SplitTerrainViewProps> = memo(
  ({ metricsA, metricsB, eventsA, eventsB, labelA = "BASELINE (A)", labelB = "SCENARIO (B)" }) => (
    <div style={S.container}>
      {/* ── LEFT: Side A ── */}
      <div style={S.half}>
        <div style={S.label}>
          <span style={S.labelDot} />
          <span style={S.labelText}>{labelA}</span>
        </div>
        <div style={S.viewport}>
          <TerrainStage
            terrainMetrics={{ ...DEFAULT_METRICS, ...metricsA }}
            minAzimuthAngle={-AZIMUTH_LIMIT}
            maxAzimuthAngle={AZIMUTH_LIMIT}
            minPolarAngle={Math.max(0.3, POLAR_CENTER - POLAR_LIMIT)}
            maxPolarAngle={Math.min(1.8, POLAR_CENTER + POLAR_LIMIT)}
            rotateSpeed={0.25}
          >
            <CameraCompositionRig />
            <SkyAtmosphere />
          </TerrainStage>
          <div style={S.vignette} />
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={S.divider} />

      {/* ── RIGHT: Side B ── */}
      <div style={S.half}>
        <div style={S.label}>
          <span style={{ ...S.labelDot, background: "rgba(34,197,94,0.7)" }} />
          <span style={S.labelText}>{labelB}</span>
        </div>
        <div style={S.viewport}>
          <TerrainStage
            terrainMetrics={{ ...DEFAULT_METRICS, ...metricsB }}
            colorVariant="green"
            minAzimuthAngle={-AZIMUTH_LIMIT}
            maxAzimuthAngle={AZIMUTH_LIMIT}
            minPolarAngle={Math.max(0.3, POLAR_CENTER - POLAR_LIMIT)}
            maxPolarAngle={Math.min(1.8, POLAR_CENTER + POLAR_LIMIT)}
            rotateSpeed={0.25}
          >
            <CameraCompositionRig />
            <SkyAtmosphere />
          </TerrainStage>
          <div style={S.vignette} />
        </div>
      </div>
    </div>
  ),
)

SplitTerrainView.displayName = "SplitTerrainView"
export default SplitTerrainView

/* ── Styles ── */

const S: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    width: "100%",
    height: "100%",
    gap: 0,
    position: "relative",
    overflow: "hidden",
  },

  half: {
    flex: 1,
    position: "relative",
    minWidth: 0,
    minHeight: 0,
    overflow: "hidden",
  },

  label: {
    position: "absolute",
    top: 14,
    left: 16,
    zIndex: 3,
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 10px",
    borderRadius: 4,
    background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.08)",
  },

  labelDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "rgba(148,180,214,0.5)",
    flexShrink: 0,
  },

  labelText: {
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: "0.16em",
    textTransform: "uppercase" as const,
    color: "rgba(226,240,255,0.6)",
    fontFamily: "'Inter', system-ui, sans-serif",
  },

  viewport: {
    position: "absolute",
    inset: 4,
    borderRadius: 10,
    overflow: "hidden",
    border: "1px solid rgba(220,230,245,0.2)",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.08), 0 12px 60px rgba(0,0,0,0.4)",
    background: "#020814",
  },

  vignette: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    borderRadius: 10,
    background:
      "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 10%), " +
      "linear-gradient(to top, rgba(0,0,0,0.25) 0%, transparent 14%)",
    zIndex: 1,
  },

  divider: {
    width: 2,
    background: "linear-gradient(180deg, transparent 0%, rgba(34,211,238,0.25) 30%, rgba(34,211,238,0.25) 70%, transparent 100%)",
    flexShrink: 0,
    zIndex: 2,
  },
}
