import { useMemo } from "react"
import { EngineResults, ScenarioKpis } from "@/types/engine"

export function getScenarioKpis(
  engineResults: Record<string, EngineResults>,
  scenarioId: string
): ScenarioKpis | null {
  const result = engineResults?.[scenarioId]
  if (!result || !result.kpis) return null
  return result.kpis
}

export function getBaselineKpis(
  engineResults: Record<string, EngineResults>,
  baselineId: string
): ScenarioKpis | null {
  return getScenarioKpis(engineResults, baselineId)
}

export function useScenarioKpis(
  engineResults: Record<string, EngineResults>,
  scenarioId: string
) {
  return useMemo(() => {
    return getScenarioKpis(engineResults, scenarioId)
  }, [engineResults, scenarioId])
}
