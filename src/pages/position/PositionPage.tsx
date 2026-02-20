import React, { useCallback, useMemo, useState } from "react"
import { useShallow } from "zustand/react/shallow"

import TerrainStage from "@/terrain/TerrainStage"
import type { TimeGranularity } from "@/position/TimelineTicks"

import { useSystemBaseline } from "@/system/SystemBaselineProvider"
import { useScenarioStore } from "@/state/scenarioStore"
import { useViewTogglesStore } from "@/state/viewTogglesStore"
import { useRenderFlagsStore } from "@/state/renderFlagsStore"
import { useSemanticBalance, DEFAULT_SHL_WEIGHTS } from "@/render/shl"
import type { SemanticLayerKey } from "@/render/shl"

import PositionRightRail from "@/components/position/PositionRightRail"
import CommandCentrePanel from "@/components/diagnostics/CommandCentrePanel"
import BaselineIntelligencePanel from "@/components/baseline/BaselineIntelligencePanel"
import KPIOverlay from "./overlays/KPIOverlay"
import TerrainLegend from "./overlays/TerrainLegend"
import TimeScaleControl from "./overlays/TimeScaleControl"
import {
  buildPositionViewModel,
} from "./overlays/positionState"

import styles from "./PositionOverlays.module.css"

// Diagnostics panel is togglable via close button

function extractRiskIndex(engineResults: unknown): number | null {
  const r = engineResults as any
  const v = r?.base?.kpis?.riskIndex?.value
  return typeof v === "number" && Number.isFinite(v) ? v : null
}

/** Treat an SHL weight > 0 as "on" */
function shlIsOn(weight: number): boolean {
  return weight > 0
}

export default function PositionPage() {
  const [granularity, setGranularity] = useState<TimeGranularity>("quarter")
  const [showDiagnostics, setShowDiagnostics] = useState(true)

  const { baseline } = useSystemBaseline()

  const { engineResults } = useScenarioStore(
    useShallow((s) => ({
      engineResults: (s as any).engineResults,
    })),
  )

  const vm = useMemo(() => {
    if (!baseline) return null
    const riskIndexFromEngine = extractRiskIndex(engineResults)
    return buildPositionViewModel(baseline, { riskIndexFromEngine })
  }, [baseline, engineResults])

  // ── Render flags store ──
  const renderFlags = useRenderFlagsStore()

  // ── SHL weights (semantic highlight layer) ──
  const shlWeights = useSemanticBalance((s) => s.weights)
  const setWeight = useSemanticBalance((s) => s.setWeight)

  const toggleShl = useCallback(
    (key: SemanticLayerKey) => (next: boolean) => {
      setWeight(key, next ? DEFAULT_SHL_WEIGHTS[key] : 0)
    },
    [setWeight],
  )

  // ── View toggles ──
  const heatmapEnabled = useViewTogglesStore((s) => s.heatmapEnabled)
  const toggleHeatmap = useViewTogglesStore((s) => s.toggleHeatmap)

  // ── Diagnostic Groups (NARRATIVE / FIELDS / TOPOGRAPHY) ──
  const diagnosticGroups = [
    {
      heading: "NARRATIVE",
      items: [
        { id: "heatMap", label: "Heat Map", value: heatmapEnabled, onChange: () => toggleHeatmap() },
        { id: "envelope", label: "Envelope", value: renderFlags.showEnvelope, onChange: () => renderFlags.toggle("showEnvelope") },
        { id: "watchDemo", label: "Watch Demo", value: renderFlags.watchDemo, onChange: () => renderFlags.toggle("watchDemo") },
        { id: "annotations", label: "Annotations", value: renderFlags.showAnnotations, onChange: () => renderFlags.toggle("showAnnotations") },
      ],
    },
    {
      heading: "FIELDS",
      items: [
        { id: "riskField", label: "Risk Field", value: shlIsOn(shlWeights.risk), onChange: toggleShl("risk") },
        { id: "confidence", label: "Confidence", value: shlIsOn(shlWeights.confidence), onChange: toggleShl("confidence") },
        { id: "markers", label: "Markers", value: renderFlags.showMarkers, onChange: () => renderFlags.toggle("showMarkers") },
        { id: "preview", label: "Preview", value: renderFlags.showPreview, onChange: () => renderFlags.toggle("showPreview") },
        { id: "flow", label: "Flow", value: shlIsOn(shlWeights.flow), onChange: toggleShl("flow") },
        { id: "diverge", label: "Diverge", value: shlIsOn(shlWeights.divergence), onChange: toggleShl("divergence") },
      ],
    },
    {
      heading: "TOPOGRAPHY",
      items: [
        { id: "heat", label: "Heat", value: shlIsOn(shlWeights.heat), onChange: toggleShl("heat") },
        { id: "resonance", label: "Resonance", value: shlIsOn(shlWeights.resonance), onChange: toggleShl("resonance") },
        { id: "topo", label: "Topo", value: shlIsOn(shlWeights.topography), onChange: toggleShl("topography") },
      ],
    },
  ]

  return (
    <div className={styles.page}>
      <TerrainStage granularity={granularity} />

      <div className={styles.kpiDock} aria-label="Position KPIs">
        <KPIOverlay vm={vm} />
      </div>

      <div className={styles.timeScaleDock} aria-label="Time scale control">
        <TimeScaleControl granularity={granularity} setGranularity={setGranularity} />
      </div>

      {/* ── Right Rail (stacked: Diagnostics + Intelligence) ── */}
      <PositionRightRail>
        {showDiagnostics && (
          <CommandCentrePanel
            groups={diagnosticGroups}
            title="Diagnostics"
            onClose={() => setShowDiagnostics(false)}
          />
        )}
        <BaselineIntelligencePanel />
      </PositionRightRail>

      <div className={styles.legendDock} aria-label="Terrain legend">
        <TerrainLegend />
      </div>

      {!vm && (
        <div className={styles.noBaselineHint}>
          No baseline loaded. Initialise to enable KPIs + diagnostics.
        </div>
      )}
    </div>
  )
}
