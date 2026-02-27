import { SingleEngineResult, DivergenceResult, ScenarioKpis } from "@/types/engine"

/**
 * Compute a lightweight divergence between two ScenarioKpis snapshots.
 * For the full percentile-level divergence, use computeDivergence() from
 * ./computeDivergence which requires SimulationSnapshot inputs.
 */
function computeKpiDivergence(
  baseline: ScenarioKpis,
  scenario: ScenarioKpis
): DivergenceResult {
  return {
    survivalDelta: scenario.survivalProbability - baseline.survivalProbability,
    runwayDelta: scenario.runwayMonths - baseline.runwayMonths,
    enterpriseValueDelta: scenario.enterpriseValue - baseline.enterpriseValue,
    burnDelta: scenario.netBurn - baseline.netBurn,
  }
}

export function selectDivergence(
  engineResults: Record<string, SingleEngineResult>,
  baselineId: string,
  scenarioId: string
): DivergenceResult | null {
  const baseline = engineResults?.[baselineId]
  const scenario = engineResults?.[scenarioId]

  if (!baseline?.kpis || !scenario?.kpis) return null

  return computeKpiDivergence(baseline.kpis, scenario.kpis)
}
