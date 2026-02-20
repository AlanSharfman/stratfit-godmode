import React, { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useShallow } from "zustand/react/shallow"

import TerrainStage from "@/terrain/TerrainStage"
import type { TimeGranularity } from "@/position/TimelineTicks"

import { useSystemBaseline } from "@/system/SystemBaselineProvider"
import { useScenarioStore } from "@/state/scenarioStore"

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

export default function PositionPage() {
  const [granularity, setGranularity] = useState<TimeGranularity>("quarter")
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false)

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

  const diagnosticGroups = [
    {
      heading: "Render",
      items: [
        { id: "showGrid", label: "Show Grid", value: false, onChange: () => {} },
        { id: "showMarkers", label: "Show Markers", value: false, onChange: () => {} },
      ],
    },
    {
      heading: "Simulation",
      items: [
        { id: "freezeSim", label: "Freeze Simulation", value: false, onChange: () => {} },
        { id: "showPaths", label: "Show Paths", value: false, onChange: () => {} },
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
