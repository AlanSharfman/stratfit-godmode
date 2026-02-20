import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useShallow } from "zustand/react/shallow"

import TerrainStage from "@/terrain/TerrainStage"
import type { TimeGranularity } from "@/position/TimelineTicks"

import { useSystemBaseline } from "@/system/SystemBaselineProvider"
import { useScenarioStore } from "@/state/scenarioStore"
import { useViewTogglesStore } from "@/state/viewTogglesStore"
import { useSemanticBalance, DEFAULT_SHL_WEIGHTS } from "@/render/shl"
import type { SemanticLayerKey } from "@/render/shl"

import DiagnosticsDrawer from "@/components/diagnostics/DiagnosticsDrawer"
import KPIOverlay from "./overlays/KPIOverlay"
import PositionBriefingPanel from "./overlays/PositionBriefingPanel"
import DiagnosticsStack from "./overlays/DiagnosticsStack"
import TerrainLegend from "./overlays/TerrainLegend"
import TimeScaleControl from "./overlays/TimeScaleControl"
import {
  buildPositionViewModel,
  type PositionViewModel,
} from "./overlays/positionState"

import styles from "./PositionOverlays.module.css"

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
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false)

  // Local toggles for narrative items without a dedicated store
  const [envelopeOn, setEnvelopeOn] = useState(false)
  const [watchDemoOn, setWatchDemoOn] = useState(false)
  const [annotationsOn, setAnnotationsOn] = useState(false)
  const [markersOn, setMarkersOn] = useState(false)
  const [previewOn, setPreviewOn] = useState(false)

  const navigate = useNavigate()
  const { baseline } = useSystemBaseline()

  useEffect(() => {
    if (!baseline) navigate("/initiate", { replace: true })
  }, [baseline, navigate])

  const { engineResults } = useScenarioStore(
    useShallow((s) => ({
      engineResults: (s as any).engineResults,
    })),
  )

  const vm: PositionViewModel | null = useMemo(() => {
    if (!baseline) return null
    const riskIndexFromEngine = extractRiskIndex(engineResults)
    return buildPositionViewModel(baseline, { riskIndexFromEngine })
  }, [baseline, engineResults])

  // --- SHL weights (semantic highlight layer) ---
  const shlWeights = useSemanticBalance((s) => s.weights)
  const setWeight = useSemanticBalance((s) => s.setWeight)

  const toggleShl = useCallback(
    (key: SemanticLayerKey) => (next: boolean) => {
      setWeight(key, next ? DEFAULT_SHL_WEIGHTS[key] : 0)
    },
    [setWeight],
  )

  // --- View toggles ---
  const heatmapEnabled = useViewTogglesStore((s) => s.heatmapEnabled)
  const toggleHeatmap = useViewTogglesStore((s) => s.toggleHeatmap)

  // ── Diagnostic Groups (original NARRATIVE / FIELDS / TOPOGRAPHY) ──
  const diagnosticGroups = [
    {
      heading: "NARRATIVE",
      items: [
        { id: "heatMap", label: "Heat Map", value: heatmapEnabled, onChange: () => toggleHeatmap() },
        { id: "envelope", label: "Envelope", value: envelopeOn, onChange: (v: boolean) => setEnvelopeOn(v) },
        { id: "watchDemo", label: "Watch Demo", value: watchDemoOn, onChange: (v: boolean) => setWatchDemoOn(v) },
        { id: "annotations", label: "Annotations", value: annotationsOn, onChange: (v: boolean) => setAnnotationsOn(v) },
      ],
    },
    {
      heading: "FIELDS",
      items: [
        { id: "riskField", label: "Risk Field", value: shlIsOn(shlWeights.risk), onChange: toggleShl("risk") },
        { id: "confidence", label: "Confidence", value: shlIsOn(shlWeights.confidence), onChange: toggleShl("confidence") },
        { id: "markers", label: "Markers", value: markersOn, onChange: (v: boolean) => setMarkersOn(v) },
        { id: "preview", label: "Preview", value: previewOn, onChange: (v: boolean) => setPreviewOn(v) },
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

      <div className={styles.overlayLayer}>
        <div className={styles.rightRail} aria-label="Position briefing">
          <PositionBriefingPanel vm={vm} />
          <DiagnosticsStack vm={vm} />
        </div>
      </div>

      <div className={styles.legendDock} aria-label="Terrain legend">
        <TerrainLegend />
      </div>

      {/* Command Centre — always visible in dev */}
      <div className={styles.commandDock}>
        <button
          type="button"
          className={styles.commandButton}
          onClick={() => setDiagnosticsOpen(true)}
          aria-label="Open Command Centre"
        >
          ⌘
        </button>
        <DiagnosticsDrawer
          open={diagnosticsOpen}
          onClose={() => setDiagnosticsOpen(false)}
          groups={diagnosticGroups}
          title="Command Centre"
        />
      </div>

      {!vm && (
        <div className={styles.noBaselineHint}>
          No baseline loaded. Initialise to enable KPIs + diagnostics.
        </div>
      )}
    </div>
  )
}
