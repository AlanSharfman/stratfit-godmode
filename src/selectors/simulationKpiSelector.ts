// src/selectors/simulationKpiSelector.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Single KPI Source Selector
//
// All KPI panels MUST read from this selector.
// Returns PositionKpis from the active Phase1 scenario's simulationResults,
// or null if no scenario is active/complete.
// ═══════════════════════════════════════════════════════════════════════════

import { useMemo } from "react"
import { useShallow } from "zustand/react/shallow"
import { usePhase1ScenarioStore } from "@/state/phase1ScenarioStore"
import type { SimulationKpis } from "@/state/phase1ScenarioStore"
import { selectPositionKpis } from "@/selectors/kpiSelectors"
import { selectRiskScore } from "@/selectors/riskSelectors"

/**
 * Flat read-only KPI snapshot extracted from the active scenario's
 * simulationResults.kpis.  All downstream panels consume this shape.
 */
export interface SimulationKpiSnapshot {
  /** Raw SimulationKpis from the store (null if no active scenario) */
  raw: SimulationKpis | null
  /** Whether the active scenario has completed simulation */
  isComplete: boolean
  /** Engine run id (completedAt as string) for risk selector wiring */
  engineRunId: string | undefined
}

/**
 * Hook: read the active scenario's SimulationKpis from phase1ScenarioStore.
 * Returns a stable reference via useShallow.
 */
export function useSimulationKpiSnapshot(): SimulationKpiSnapshot {
  return usePhase1ScenarioStore(
    useShallow((s) => {
      const active = s.scenarios.find((sc) => sc.id === s.activeScenarioId)
      if (!active || !active.simulationResults?.kpis) {
        return { raw: null, isComplete: false, engineRunId: undefined }
      }
      return {
        raw: active.simulationResults.kpis,
        isComplete: active.status === "complete",
        engineRunId: active.simulationResults.completedAt
          ? active.simulationResults.completedAt.toString()
          : undefined,
      }
    }),
  )
}

/**
 * Hook: canonical PositionKpis from the active scenario's simulation.
 * This is the SINGLE source of KPI truth for all UI panels.
 * Returns null when no active scenario with results exists.
 */
export function useSelectSimulationKpis() {
  const { raw, isComplete, engineRunId } = useSimulationKpiSnapshot()
  return useMemo(() => {
    if (!raw) return null
    const riskScore = isComplete ? selectRiskScore(raw, engineRunId) : undefined
    return selectPositionKpis(raw, riskScore)
  }, [raw, isComplete, engineRunId])
}
