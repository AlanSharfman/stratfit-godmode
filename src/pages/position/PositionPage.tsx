import React, { useCallback, useMemo, useState } from "react"
import { useShallow } from "zustand/react/shallow"

import TerrainStage from "@/terrain/TerrainStage"
import { deriveTerrainMetrics } from "@/terrain/terrainFromBaseline"
import type { TimeGranularity } from "@/terrain/TimelineTicks"

import { useSystemBaseline } from "@/system/SystemBaselineProvider"
import { useScenarioStore } from "@/state/scenarioStore"
import { useBaselineStore } from "@/state/baselineStore"
import { useScenarioOverridesStore } from "@/state/scenarioOverridesStore"
import { useViewTogglesStore } from "@/state/viewTogglesStore"
import { useRenderFlagsStore } from "@/state/renderFlagsStore"
import { useSemanticBalance, DEFAULT_SHL_WEIGHTS } from "@/render/shl"
import type { SemanticLayerKey } from "@/render/shl"

import PositionRightRail from "@/components/position/PositionRightRail"
import CommandCentrePanel from "@/components/diagnostics/CommandCentrePanel"
import BaselineIntelligencePanel from "@/components/baseline/BaselineIntelligencePanel"
import QuestionInputBar from "@/components/question/QuestionInputBar"
import KPIOverlay from "./overlays/KPIOverlay"
import PositionHeaderBar from "./components/PositionHeaderBar"
import DiagnosticsSummary from "./components/DiagnosticsSummary"
import ExecutiveNarrativeCard from "./components/ExecutiveNarrativeCard"
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

  const handleQuestionSubmit = useCallback((question: string) => {
    console.log("[Question Submitted]", question)
    // STEP 11 will replace this with classification call
    // STEP 12 will route to Studio with QuestionContext
  }, [])

  const { baseline } = useSystemBaseline()

  const baselineInputs = useBaselineStore((s) => s.baselineInputs)

  const { overrideScenarios, activeOverrideScenarioId } = useScenarioOverridesStore(
    useShallow((s) => ({
      overrideScenarios: s.scenarios,
      activeOverrideScenarioId: s.activeScenarioId,
    })),
  )

  const effectiveInputs = useMemo(() => {
    if (!baselineInputs) return null
    const active = overrideScenarios.find((s) => s.id === activeOverrideScenarioId)
    return active ? ({ ...baselineInputs, ...active.overrides } as const) : baselineInputs
  }, [baselineInputs, overrideScenarios, activeOverrideScenarioId])

  const terrainMetrics = useMemo(
    () => (effectiveInputs ? deriveTerrainMetrics(effectiveInputs) : undefined),
    [effectiveInputs],
  )

  const engineResults = useScenarioStore((s) => s.engineResults)

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
      <TerrainStage granularity={granularity} terrainMetrics={terrainMetrics} />

      <div className={styles.kpiDock} aria-label="Position KPIs">
        <KPIOverlay vm={vm} />
      </div>

      <div className={styles.timeScaleDock} aria-label="Time scale control">
        <TimeScaleControl granularity={granularity} setGranularity={setGranularity} />
      </div>

      {/* ── Right Rail (stacked: Diagnostics + Intelligence) ── */}
      <PositionRightRail>
        <PositionHeaderBar vm={vm} />
        <DiagnosticsSummary vm={vm} />
        <ExecutiveNarrativeCard vm={vm} />

        {showDiagnostics && (
          <CommandCentrePanel
            groups={diagnosticGroups}
            title="Diagnostics"
            onClose={() => setShowDiagnostics(false)}
          />
        )}

        <BaselineIntelligencePanel />
      </PositionRightRail>

      <div className={styles.questionBar}>
        <QuestionInputBar onSubmit={handleQuestionSubmit} />
      </div>

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
