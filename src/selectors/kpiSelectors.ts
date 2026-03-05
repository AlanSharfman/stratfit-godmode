// src/selectors/kpiSelectors.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Canonical KPI selector layer
//
// Single read interface between Phase1 simulation results and all UI.
// Pure functions. No stores. No side effects.
// ═══════════════════════════════════════════════════════════════════════════

import type { SimulationKpis } from "@/state/phase1ScenarioStore"
import type { PositionKpis } from "@/pages/position/overlays/positionState"
import { selectRiskScore } from "@/selectors/riskSelectors"

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
  const arr = simulationKpis.revenue * 12
  const growthRate = simulationKpis.growthRate
  // Valuation: sourced from engine, not UI heuristic (zeroed until engine provides it)
  const valuation = null
  return {
    arr,
    revenue: simulationKpis.revenue,
    runwayMonths: simulationKpis.runway,
    burnMonthly: simulationKpis.monthlyBurn,
    grossMargin: simulationKpis.grossMargin,
    valuation,
    cashOnHand: simulationKpis.cash,
    growthRate,
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

  // grossMargin/growthRate/churnRate may be stored as decimals (0–1) or percentages (0–100).
  // Normalise: if value <= 1, treat as decimal and multiply by 100 to get percentage.
  const toPercent = (v: number) => Math.abs(v) <= 1 && v !== 0 ? v * 100 : v
  const grossMarginPct = toPercent(simulationKpis.grossMargin)

  const runwayMonths = simulationKpis.runway != null && Number.isFinite(simulationKpis.runway)
    ? simulationKpis.runway
    : (burnMonthly > 0 ? cashOnHand / burnMonthly : 999)

  const grossProfitMonthly = revenueMonthly * Math.min(grossMarginPct / 100, 1)
  const ebitdaMonthly = grossProfitMonthly - (burnMonthly - grossProfitMonthly > 0 ? burnMonthly - grossProfitMonthly : 0)

  const riskIndex = typeof riskScoreOverride === "number" ? riskScoreOverride : selectRiskScore(simulationKpis)

  const survivalScore = clamp01(Math.round((riskIndex * 0.6) + (Math.min(runwayMonths, 24) / 24) * 40), 0, 100)

  // Valuation heuristic: ARR × growth-implied revenue multiple (standard SaaS methodology)
  const growthRatePct = toPercent(simulationKpis.growthRate ?? 0)
  const growthMultiple = Math.max(1, Math.min(20, 3 + (growthRatePct / 10)))
  const valuationEstimate = arr > 0 ? arr * growthMultiple : 0

  const churnPct = toPercent(simulationKpis.churnRate ?? 0)
  const headcount = simulationKpis.headcount ?? 1
  const efficiencyRatio = headcount > 0 ? (revenueMonthly * 12) / headcount : 0

  const nrrPct = (simulationKpis as any).nrrPct ?? (churnPct > 0 ? Math.max(60, 100 - churnPct * 0.8) : 100)

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
    growthRatePct,
    churnPct,
    headcount,
    nrrPct,
    efficiencyRatio,
  }
}

/** Clamp helper (internal) */
function clamp01(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}
