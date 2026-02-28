// src/selectors/kpiSelectors.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Canonical KPI selector layer
//
// Single read interface between Phase1 simulation results and all UI.
// Pure functions. No stores. No side effects.
// ═══════════════════════════════════════════════════════════════════════════

import type { SimulationKpis } from "@/state/phase1ScenarioStore"
import type { PositionKpis } from "@/pages/position/overlays/positionState"

/** Flat KPI shape consumed by KPIHealthRail and other UI surfaces */
export interface SelectedKpis {
  arr: number
  revenue: number
  runwayMonths: number | null
  burnMonthly: number
  grossMargin: number
  valuation: number | null
  cashOnHand: number
  growthRate: number
  churnRate: number
  headcount: number
  arpa: number
}

/**
 * Extract canonical KPIs from Phase1 simulation results.
 * Returns null if simulationKpis is undefined/null.
 */
export function selectKpis(simulationKpis: SimulationKpis | null | undefined): SelectedKpis | null {
  if (!simulationKpis) return null
  return {
    arr: simulationKpis.revenue * 12,
    revenue: simulationKpis.revenue,
    runwayMonths: simulationKpis.runway,
    burnMonthly: simulationKpis.monthlyBurn,
    grossMargin: simulationKpis.grossMargin,
    valuation: null, // not yet computed by Phase1 engine
    cashOnHand: simulationKpis.cash,
    growthRate: simulationKpis.growthRate,
    churnRate: simulationKpis.churnRate,
    headcount: simulationKpis.headcount,
    arpa: simulationKpis.arpa,
  }
}

/** Delta between two KPI snapshots (scenario − baseline) */
export interface KpiDeltas {
  arrDelta: number
  revenueDelta: number
  runwayDelta: number | null
  burnDelta: number
  grossMarginDelta: number
  cashDelta: number
  growthRateDelta: number
}

/**
 * Compute absolute deltas between scenario and baseline KPIs.
 * Returns null if either input is null.
 */
export function selectKpiDeltas(
  baselineKpis: SelectedKpis | null,
  scenarioKpis: SelectedKpis | null,
): KpiDeltas | null {
  if (!baselineKpis || !scenarioKpis) return null
  return {
    arrDelta: scenarioKpis.arr - baselineKpis.arr,
    revenueDelta: scenarioKpis.revenue - baselineKpis.revenue,
    runwayDelta:
      scenarioKpis.runwayMonths != null && baselineKpis.runwayMonths != null
        ? scenarioKpis.runwayMonths - baselineKpis.runwayMonths
        : null,
    burnDelta: scenarioKpis.burnMonthly - baselineKpis.burnMonthly,
    grossMarginDelta: scenarioKpis.grossMargin - baselineKpis.grossMargin,
    cashDelta: scenarioKpis.cashOnHand - baselineKpis.cashOnHand,
    growthRateDelta: scenarioKpis.growthRate - baselineKpis.growthRate,
  }
}

/**
 * Adapter: Map SimulationKpis → PositionKpis (shape consumed by KPIHealthRail).
 * Fills computed fields (ebitdaMonthly, survivalScore, valuationEstimate)
 * using the same heuristics as buildPositionViewModel.
 * Returns null if simulationKpis is null/undefined.
 */
export function selectPositionKpis(
  simulationKpis: SimulationKpis | null | undefined,
  riskScoreOverride?: number,
): PositionKpis | null {
  if (!simulationKpis) return null

  const arr = simulationKpis.revenue * 12
  const burnMonthly = simulationKpis.monthlyBurn
  const cashOnHand = simulationKpis.cash
  const revenueMonthly = simulationKpis.revenue
  const grossMarginPct = simulationKpis.grossMargin
  const growthRate = simulationKpis.growthRate

  // Runway: from engine or derived
  const runwayMonths = simulationKpis.runway != null && Number.isFinite(simulationKpis.runway)
    ? simulationKpis.runway
    : (burnMonthly > 0 ? cashOnHand / burnMonthly : 999)

  // EBITDA monthly: gross profit − implied opex (approximate from burn - gross profit remainder)
  const grossProfitMonthly = revenueMonthly * Math.min(grossMarginPct / 100, 1)
  const ebitdaMonthly = grossProfitMonthly - (burnMonthly - grossProfitMonthly > 0 ? burnMonthly - grossProfitMonthly : 0)

  // Risk index
  const riskIndex = typeof riskScoreOverride === "number" ? riskScoreOverride : riskFromRunway(runwayMonths)

  // Survival score: same blend as buildPositionViewModel
  const survivalScore = clamp01(Math.round((riskIndex * 0.6) + (Math.min(runwayMonths, 24) / 24) * 40), 0, 100)

  // Valuation: ARR × growth-implied multiple (same heuristic)
  const multiple = clamp01(3 + (growthRate / 10), 1, 20)
  const valuationEstimate = arr > 0 ? arr * multiple : 0

  return {
    arr,
    burnMonthly,
    runwayMonths,
    ebitdaMonthly,
    riskIndex,
    cashOnHand,
    revenueMonthly,
    survivalScore,
    grossMarginPct,
    valuationEstimate,
  }
}

/** Clamp helper (internal) */
function clamp01(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

/** Risk from runway heuristic (matches positionState.ts) */
function riskFromRunway(runway: number): number {
  if (!Number.isFinite(runway)) return 60
  if (runway >= 24) return 85
  if (runway >= 18) return 78
  if (runway >= 12) return 68
  if (runway >= 6) return 52
  return 34
}
