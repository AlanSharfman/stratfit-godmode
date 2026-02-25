import { selectDivergence } from "../src/logic/divergence/selectDivergence"
import type { EngineResults } from "../src/types/engine"

export function demoLockCheck(
  engineResults: Record<string, EngineResults>,
  baselineId: string,
  scenarioId: string
) {
  const divergence = selectDivergence(engineResults, baselineId, scenarioId)

  if (!divergence) {
    console.error("❌ Divergence not computed")
    return false
  }

  console.log("✅ Divergence OK", divergence)
  return true
}
