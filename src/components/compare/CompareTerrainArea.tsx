// src/components/compare/CompareTerrainArea.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Compare Terrain Area
//
// Orchestrates the top terrain section of the Compare Command Centre.
// Two modes:
//   Split:  Side-by-side CompareTerrainPanel instances (2 or 3)
//   Ghost:  Single primary TerrainStage with ghost terrain overlays
//
// Ghost mode renders secondary terrains as translucent GhostTerrainSurface
// meshes INSIDE the primary TerrainStage Canvas (shared camera/controls).
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo } from "react"
import CompareTerrainPanel from "@/components/compare/CompareTerrainPanel"
import TerrainStage from "@/terrain/TerrainStage"
import CameraCompositionRig from "@/scene/camera/CameraCompositionRig"
import SkyAtmosphere from "@/scene/rigs/SkyAtmosphere"
import GhostTerrainSurface from "@/components/compare/GhostTerrainSurface"
import TerrainHighlightFX from "@/features/compare/TerrainHighlightFX"
import CinematicCamera from "@/features/intelligence/CinematicCamera"
import { LightingModulatorR3F } from "@/features/intelligence/LightingModulator"
import OverlayEngine from "@/features/intelligence/OverlayEngine"
import { useBriefingClock } from "@/features/intelligence/useBriefingClock"
import type { BriefingPlan } from "@/features/intelligence/BriefingDirector"
import type { HighlightTarget } from "@/features/compare/highlightContract"
import type { TerrainMetrics } from "@/terrain/terrainFromBaseline"
import type { TerrainEvent } from "@/domain/events/terrainEventTypes"
import type { ScenarioOption } from "@/components/compare/CompareScenarioSelect"
import type { CompareViewMode, ComparePair } from "@/store/compareStore"

export interface CompareTerrainAreaProps {
  viewMode: CompareViewMode
  nScenarios: 2 | 3
  activePair: ComparePair

  /* Scenario IDs */
  selectedAId: string | null
  selectedBId: string | null
  selectedCId: string | null

  /* Terrain data */
  metricsA: TerrainMetrics
  metricsB: TerrainMetrics
  metricsC: TerrainMetrics
  eventsA: TerrainEvent[]
  eventsB: TerrainEvent[]
  eventsC: TerrainEvent[]

  /* Scenario dropdown */
  scenarioOptions: ScenarioOption[]
  onSelectA: (id: string | null) => void
  onSelectB: (id: string | null) => void
  onSelectC: (id: string | null) => void

  /* Highlight target from insight panel */
  highlightTarget?: HighlightTarget
  highlightTs?: number

  /* Executive Briefing (Ultimate mode) */
  briefingActive?: boolean
  briefingPlan?: BriefingPlan | null
}

/* ── Ghost tint palette (no orange per spec) ── */
const GHOST_B = { tint: 0x808890, emissive: 0x606870 } // white/silver
const GHOST_C = { tint: 0x1a2050, emissive: 0x161840 } // indigo

const AZIMUTH_LIMIT = Math.PI / 4
const POLAR_CENTER = 1.107
const POLAR_LIMIT = Math.PI / 4

const CompareTerrainArea: React.FC<CompareTerrainAreaProps> = memo(
  ({
    viewMode,
    nScenarios,
    activePair,
    selectedAId,
    selectedBId,
    selectedCId,
    metricsA,
    metricsB,
    metricsC,
    eventsA,
    eventsB,
    eventsC,
    scenarioOptions,
    onSelectA,
    onSelectB,
    onSelectC,
    highlightTarget,
    highlightTs,
    briefingActive,
    briefingPlan,
  }) => {
    const is3 = nScenarios === 3
    const clockNowMs = useBriefingClock((s) => s.nowMs)
    const clockPaused = useBriefingClock((s) => s.paused)
    const clockActive = useBriefingClock((s) => s.active)
    const clockLightingProgress = useBriefingClock((s) => s.lightingProgress)

    /* ═══ SPLIT VIEW ═══ */
    if (viewMode === "split") {
      return (
        <div style={{ ...S.splitGrid, gridTemplateColumns: is3 ? "1fr 1fr 1fr" : "1fr 1fr" }}>
          <CompareTerrainPanel
            slot="A"
            dotColor="rgba(148,180,214,0.5)"
            terrainMetrics={metricsA}
            events={eventsA}
            selectedId={selectedAId}
            scenarioOptions={scenarioOptions}
            onSelectScenario={onSelectA}
          />
          <CompareTerrainPanel
            slot="B"
            dotColor="rgba(220,230,245,0.8)"
            terrainMetrics={metricsB}
            events={eventsB}
            colorVariant="white"
            selectedId={selectedBId}
            scenarioOptions={scenarioOptions}
            onSelectScenario={onSelectB}
          />
          {is3 && (
            <CompareTerrainPanel
              slot="C"
              dotColor="rgba(168,85,247,0.7)"
              terrainMetrics={metricsC}
              events={eventsC}
              colorVariant="frost"
              selectedId={selectedCId}
              scenarioOptions={scenarioOptions}
              onSelectScenario={onSelectC}
            />
          )}
        </div>
      )
    }

    /* ═══ GHOST VIEW ═══ */
    // Determine ghost opacities based on active pair:
    // Active ghost = 0.30, inactive ghost = 0.18
    const ghostBOpacity =
      activePair === "AB" || activePair === "BC" ? 0.30 : 0.18
    const ghostCOpacity =
      activePair === "AC" || activePair === "BC" ? 0.30 : 0.18

    return (
      <div style={S.ghostContainer}>
        {/* Legend overlay */}
        <div style={S.ghostLegend}>
          <div style={S.legendItem}>
            <span style={{ ...S.legendDot, background: "rgba(148,180,214,0.6)" }} />
            <span style={S.legendLabel}>PRIMARY (A)</span>
          </div>
          <div style={S.legendItem}>
            <span style={{ ...S.legendDot, background: "rgba(220,230,245,0.7)" }} />
            <span style={{
              ...S.legendLabel,
              opacity: activePair === "AB" || activePair === "BC" ? 1 : 0.5,
            }}>GHOST B</span>
          </div>
          {is3 && (
            <div style={S.legendItem}>
              <span style={{ ...S.legendDot, background: "rgba(129,140,248,0.6)" }} />
              <span style={{
                ...S.legendLabel,
                opacity: activePair === "AC" || activePair === "BC" ? 1 : 0.5,
              }}>GHOST C</span>
            </div>
          )}
        </div>

        {/* Single Canvas with primary terrain + ghost overlays */}
        <div style={S.ghostCanvas}>
          <TerrainStage
            terrainMetrics={metricsA}
            minAzimuthAngle={-AZIMUTH_LIMIT}
            maxAzimuthAngle={AZIMUTH_LIMIT}
            minPolarAngle={Math.max(0.3, POLAR_CENTER - POLAR_LIMIT)}
            maxPolarAngle={Math.min(1.8, POLAR_CENTER + POLAR_LIMIT)}
            rotateSpeed={0.25}
          >
            <CameraCompositionRig />
            <SkyAtmosphere />

            {/* ── Terrain highlight FX (insight linking) ── */}
            <TerrainHighlightFX
              active={highlightTarget}
              enabled={!!highlightTarget}
              triggerTs={highlightTs}
            />

            {/* ── Executive Briefing in-canvas subsystems ── */}
            {briefingActive && briefingPlan && (
              <>
                <CinematicCamera
                  active={clockActive}
                  shots={briefingPlan.shots}
                  nowMs={clockNowMs}
                  paused={clockPaused}
                />
                <LightingModulatorR3F active={clockActive} progress={clockLightingProgress} />
                <OverlayEngine
                  active={clockActive}
                  events={briefingPlan.overlays}
                  nowMs={clockNowMs}
                />
              </>
            )}

            {/* Ghost B terrain — emerald tint */}
            <GhostTerrainSurface
              terrainMetrics={metricsB}
              opacity={ghostBOpacity}
              tintColor={GHOST_B.tint}
              emissiveColor={GHOST_B.emissive}
            />

            {/* Ghost C terrain — indigo tint (3-mode only) */}
            {is3 && (
              <GhostTerrainSurface
                terrainMetrics={metricsC}
                opacity={ghostCOpacity}
                tintColor={GHOST_C.tint}
                emissiveColor={GHOST_C.emissive}
              />
            )}
          </TerrainStage>
          <div style={S.ghostVignette} />
        </div>
      </div>
    )
  },
)

CompareTerrainArea.displayName = "CompareTerrainArea"
export default CompareTerrainArea

/* ═══════════════════════════════════════════════════════════════════════════
   INLINE STYLES
   ═══════════════════════════════════════════════════════════════════════════ */

const S: Record<string, React.CSSProperties> = {
  /* ── Split mode ── */
  splitGrid: {
    display: "grid",
    gap: 2,
    minHeight: 0,
    overflow: "hidden",
    height: "100%",
  },

  /* ── Ghost mode ── */
  ghostContainer: {
    position: "relative",
    width: "100%",
    height: "100%",
    minHeight: 0,
    overflow: "hidden",
    background: "#020814",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.04)",
  },

  ghostCanvas: {
    position: "absolute",
    inset: 0,
    borderRadius: 8,
    overflow: "hidden",
  },

  ghostVignette: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    background:
      "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, transparent 10%), " +
      "linear-gradient(to top, rgba(0,0,0,0.2) 0%, transparent 14%)",
    zIndex: 1,
  },

  /* ── Legend ── */
  ghostLegend: {
    position: "absolute",
    top: 10,
    right: 14,
    zIndex: 5,
    display: "flex",
    gap: 12,
    padding: "5px 10px",
    borderRadius: 6,
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(6px)",
    border: "1px solid rgba(255,255,255,0.06)",
  },

  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: 5,
  },

  legendDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    flexShrink: 0,
  },

  legendLabel: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.1em",
    color: "rgba(226,240,255,0.6)",
    fontFamily: "'Inter', system-ui, sans-serif",
    textTransform: "uppercase" as const,
  },
}
