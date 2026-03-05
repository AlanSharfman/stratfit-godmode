// src/components/compare/CompareTerrainPanel.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Compare Terrain Panel
// Single terrain canvas with header containing label + scenario selector.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo } from "react"
import TerrainStage from "@/terrain/TerrainStage"
import CameraCompositionRig from "@/scene/camera/CameraCompositionRig"
import SkyAtmosphere from "@/scene/rigs/SkyAtmosphere"
import type { TerrainMetrics } from "@/terrain/terrainFromBaseline"
import type { TerrainEvent } from "@/domain/events/terrainEventTypes"
import type { TerrainColorVariant } from "@/terrain/terrainMaterials"
import CompareScenarioSelect, {
  type ScenarioOption,
} from "./CompareScenarioSelect"

export interface CompareTerrainPanelProps {
  /** Panel slot label, e.g. "A", "B", "C" */
  slot: string
  /** Accent color for the dot indicator */
  dotColor?: string
  terrainMetrics: TerrainMetrics
  events: TerrainEvent[]
  colorVariant?: TerrainColorVariant
  /** Scenario dropdown */
  selectedId: string | null
  scenarioOptions: ScenarioOption[]
  onSelectScenario: (id: string | null) => void
}

const DEFAULT_METRICS: TerrainMetrics = {
  elevationScale: 1,
  roughness: 1,
  liquidityDepth: 1,
  growthSlope: 0,
  volatility: 0,
}

const AZIMUTH_LIMIT = Math.PI / 4
const POLAR_CENTER = 1.107
const POLAR_LIMIT = Math.PI / 4

const CompareTerrainPanel: React.FC<CompareTerrainPanelProps> = memo(
  ({
    slot,
    dotColor = "rgba(148,180,214,0.5)",
    terrainMetrics,
    events,
    colorVariant,
    selectedId,
    scenarioOptions,
    onSelectScenario,
  }) => {
    const label = selectedId
      ? scenarioOptions.find((o) => o.id === selectedId)?.label ?? `Scenario ${slot}`
      : `Baseline`

    return (
      <div style={S.panel}>
        {/* ── HEADER ── */}
        <div style={S.header}>
          <div style={S.headerLeft}>
            <span style={{ ...S.dot, background: dotColor }} />
            <span style={S.slotTag}>{slot}</span>
            <span style={S.slotLabel}>{label}</span>
          </div>
          <CompareScenarioSelect
            valueId={selectedId}
            options={scenarioOptions}
            onChange={onSelectScenario}
          />
        </div>

        {/* ── TERRAIN CANVAS ── */}
        <div style={S.canvas}>
          <TerrainStage
            terrainMetrics={{ ...DEFAULT_METRICS, ...terrainMetrics }}
            colorVariant={colorVariant}
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
    )
  },
)

CompareTerrainPanel.displayName = "CompareTerrainPanel"
export default CompareTerrainPanel

/* ── Styles ── */

const S: Record<string, React.CSSProperties> = {
  panel: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    minHeight: 0,
    overflow: "hidden",
    background: "rgba(255,255,255,0.01)",
    border: "1px solid rgba(255,255,255,0.04)",
    borderRadius: 8,
    position: "relative",
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: 40,
    padding: "0 12px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    background: "rgba(0,0,0,0.35)",
    flexShrink: 0,
    zIndex: 4,
  },

  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    minWidth: 0,
    overflow: "hidden",
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    flexShrink: 0,
  },

  slotTag: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "0.14em",
    color: "rgba(34,211,238,0.65)",
    fontFamily: "'Inter', system-ui, sans-serif",
    flexShrink: 0,
  },

  slotLabel: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.05em",
    color: "rgba(226,240,255,0.5)",
    fontFamily: "'Inter', system-ui, sans-serif",
    textTransform: "uppercase" as const,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  canvas: {
    flex: 1,
    position: "relative",
    minHeight: 0,
    borderRadius: "0 0 7px 7px",
    overflow: "hidden",
    background: "#020814",
  },

  vignette: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    background:
      "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 10%), " +
      "linear-gradient(to top, rgba(0,0,0,0.25) 0%, transparent 14%)",
    zIndex: 1,
  },
}
