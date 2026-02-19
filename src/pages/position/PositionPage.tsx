import React, { useMemo, useState } from "react"
import { useShallow } from "zustand/react/shallow"

import TerrainStage from "@/terrain/TerrainStage"
import type { TimeGranularity } from "@/position/TimelineTicks"

import { useSystemBaseline } from "@/system/SystemBaselineProvider"
import { useScenarioStore } from "@/state/scenarioStore"

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

export default function PositionPage() {
  const [granularity, setGranularity] = useState<TimeGranularity>("quarter")

  const { baseline } = useSystemBaseline()

  const { engineResults } = useScenarioStore(
    useShallow((s) => ({
      engineResults: (s as any).engineResults,
    })),
  )

  const vm: PositionViewModel | null = useMemo(() => {
    if (!baseline) return null
    const riskFromEngine =
      (engineResults as any)?.base?.kpis?.riskIndex?.value ??
      (engineResults as any)?.baseline?.kpis?.riskIndex?.value ??
      null

    return buildPositionViewModel(baseline, {
      riskIndexFromEngine: typeof riskFromEngine === "number" ? riskFromEngine : null,
    })
  }, [baseline, engineResults])

  return (
    <div className={styles.page}>
      <TerrainStage granularity={granularity} />

      <div className={styles.kpiDock} aria-label="Position KPIs">
        <KPIOverlay vm={vm} />
      </div>

      <div className={styles.timeScaleDock} aria-label="Time scale control">
        <TimeScaleControl granularity={granularity} setGranularity={setGranularity} />
      </div>

      <div className={styles.rightRail} aria-label="Position briefing">
        <PositionBriefingPanel vm={vm} />
        <DiagnosticsStack vm={vm} />
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
