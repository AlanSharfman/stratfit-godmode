import { useMemo } from "react"
import { SingleEngineResult, ScenarioKpis } from "@/types/engine"

export function getScenarioKpis(
  engineResults: Record<string, SingleEngineResult>,
  scenarioId: string
): ScenarioKpis | null {
  const result = engineResults?.[scenarioId]
  if (!result || !result.kpis) return null
  return result.kpis
}

export function getBaselineKpis(
  engineResults: Record<string, SingleEngineResult>,
  baselineId: string
): ScenarioKpis | null {
  return getScenarioKpis(engineResults, baselineId)
}

export function useScenarioKpis(
  engineResults: Record<string, SingleEngineResult>,
  scenarioId: string
) {
  return useMemo(() => {
    return getScenarioKpis(engineResults, scenarioId)
  }, [engineResults, scenarioId])
}
