import { useCallback, useMemo } from "react"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import type { PositionKpis } from "@/pages/position/overlays/positionState"
import {
  useScenarioTimelineStore,
  getInterpolatedKpis,
  type TimeHorizon,
} from "@/state/scenarioTimelineStore"
import { buildScenarioTimeline } from "@/engine/buildScenarioTimeline"
import { useTimelineNarration } from "./useTimelineNarration"

/**
 * Composable hook for scenario time evolution.
 * Provides timeline generation, active KPIs for terrain, and voice narration.
 */
export function useScenarioTimeline(baseKpis: PositionKpis | null) {
  const store = useScenarioTimelineStore()
  const { narrate, stop: stopNarration, isNarrating } = useTimelineNarration()

  const generateTimeline = useCallback((
    forces: Partial<Record<KpiKey, number>>,
    label: string,
  ) => {
    if (!baseKpis) return
    const timeline = buildScenarioTimeline(baseKpis, forces, label)
    store.setTimeline(timeline)
  }, [baseKpis, store])

  const activeKpis = useMemo<PositionKpis | null>(() => {
    return getInterpolatedKpis(store.timeline, store.activeHorizon)
  }, [store.timeline, store.activeHorizon])

  const handleVoice = useCallback(() => {
    if (isNarrating) {
      stopNarration()
    } else if (store.timeline) {
      narrate(store.timeline)
    }
  }, [isNarrating, stopNarration, store.timeline, narrate])

  const clearTimeline = useCallback(() => {
    stopNarration()
    store.clear()
  }, [stopNarration, store])

  return {
    timeline: store.timeline,
    activeHorizon: store.activeHorizon as TimeHorizon,
    isPlaying: store.isPlaying,
    activeKpis,
    generateTimeline,
    clearTimeline,
    handleVoice,
    isNarrating,
  }
}
