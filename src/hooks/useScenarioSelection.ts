import { useMemo } from "react"
import { SingleEngineResult } from "@/types/engine"
import { getScenarioKpis } from "@/logic/kpis/kpiSelectors"
import { selectDivergence } from "@/logic/divergence/selectDivergence"

export function useScenarioSelection(
  engineResults: Record<string, SingleEngineResult>,
  baselineId: string,
  scenarioId: string
) {
  return useMemo(() => {
    const kpis = getScenarioKpis(engineResults, scenarioId)
    const divergence = selectDivergence(engineResults, baselineId, scenarioId)

    return { kpis, divergence }
  }, [engineResults, baselineId, scenarioId])
}
