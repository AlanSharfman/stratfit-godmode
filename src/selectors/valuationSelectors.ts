// src/selectors/valuationSelectors.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Valuation Selectors (Phase V-1 + V-2A)
//
// Thin selector layer over the deterministic valuation engine.
// V-1: selectValuation(engineResults) — direct EngineResults path
// V-2A: selectValuationFromSimulation(simResults) — canonical bridge
//       Converts SimulationResults (phase1ScenarioStore) → EngineResults
//       so pages wired to the canonical store can use the V-1 engine.
// ═══════════════════════════════════════════════════════════════════════════

import type { EngineResults, EngineTimelinePoint, EngineSummary } from "@/core/engine/types"
import type { ValuationResults } from "@/valuation/valuationTypes"
import type { SimulationResults, SimulationKpis } from "@/state/phase1ScenarioStore"
import { computeValuation } from "@/valuation/valuationEngine"

/**
 * Select valuation results from engine output.
 *
 * Pure function — no store access, no side effects.
 * Intended to be called by UI components or hooks that already
 * hold a reference to engineResults.
 */
export function selectValuation(engineResults: EngineResults): ValuationResults {
  return computeValuation(engineResults)
}

// ═══════════════════════════════════════════════════════════════════════════
// V-2A BRIDGE — SimulationResults → EngineResults → ValuationResults
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Bridge from canonical SimulationResults (phase1ScenarioStore)
 * to EngineResults consumed by computeValuation.
 *
 * Synthesises a single-point timeline from SimulationKpis.
 * This is a best-effort projection — when the engine exposes
 * a full timeline, this bridge becomes unnecessary.
 */
function buildEngineResultsFromKpis(
  kpis: SimulationKpis,
  horizonMonths: number,
): EngineResults {
  const annualRevenue = kpis.revenue * 12 // kpis.revenue is monthly
  const grossMarginFrac = kpis.grossMargin / 100
  const growthFrac = kpis.growthRate / 100
  const ebitda = annualRevenue * grossMarginFrac

  // Risk heuristic: higher churn + lower runway → higher risk
  const churnRisk = Math.min(1, (kpis.churnRate / 100) * 2)
  const runwayRisk = kpis.runway != null && kpis.runway > 0
    ? Math.max(0, 1 - kpis.runway / 24)
    : 0.5
  const riskIndex = Math.min(1, (churnRisk + runwayRisk) / 2)

  // Build a minimal timeline (one step per horizon year)
  const years = Math.max(1, Math.round(horizonMonths / 12))
  const timeline: EngineTimelinePoint[] = []

  for (let y = 0; y < years; y++) {
    const projectedRevenue = annualRevenue * Math.pow(1 + growthFrac, y)
    const projectedEbitda = projectedRevenue * grossMarginFrac
    timeline.push({
      timeIndex: y,
      revenue: projectedRevenue,
      ebitda: projectedEbitda,
      riskIndex,
      enterpriseValue: 0, // placeholder — computed by valuation engine
    })
  }

  const lastRev = timeline[timeline.length - 1].revenue
  const summary: EngineSummary = {
    peakRevenue: lastRev,
    peakEV: 0,
    avgRiskIndex: riskIndex,
    terminalEbitda: lastRev * grossMarginFrac,
    cagr: growthFrac,
  }

  return { timeline, summary }
}

/**
 * Select valuation from canonical SimulationResults (phase1ScenarioStore).
 *
 * Returns null when no simulation data is available.
 * Pure function — no store access, no side effects.
 */
export function selectValuationFromSimulation(
  simResults: SimulationResults | null | undefined,
): ValuationResults | null {
  if (!simResults?.kpis) return null
  const engineResults = buildEngineResultsFromKpis(
    simResults.kpis,
    simResults.horizonMonths ?? 24,
  )
  return computeValuation(engineResults)
}
