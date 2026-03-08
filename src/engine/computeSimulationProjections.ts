// src/engine/computeSimulationProjections.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Pure simulation projection engine
//
// Accepts SimulationKpis (already computed by any path — WhatIf, Studio, or
// the lever-based store action) and produces forward-looking projections with
// p10 / p50 / p90 probability bands.
//
// RULES:
//   - No store imports at runtime (type-only)
//   - No React hooks
//   - No side effects
//   - Deterministic — same input → same output
// ═══════════════════════════════════════════════════════════════════════════

import type { SimulationKpis } from "@/state/phase1ScenarioStore"
import { timeSimulation, buildKpiSnapshot } from "@/engine/timeSimulation"
import { selectRiskScore } from "@/selectors/riskSelectors"

// ── Output types ─────────────────────────────────────────────────────────

/** One value per simulated month (length = horizonMonths + 1, including month 0). */
export type ProjectionSeries = number[]

export interface ProjectionBand {
  revenue: ProjectionSeries
  ebitda:  ProjectionSeries
  cash:    ProjectionSeries
  runway:  ProjectionSeries
}

export interface SimulationProjections {
  /** Monthly revenue — p50 base case */
  revenueProjection:      ProjectionSeries
  /** Monthly EBITDA proxy (revenue × grossMargin − burn) — p50 base case */
  ebitdaProjection:       ProjectionSeries
  /** Monthly cash balance — p50 base case */
  cashProjection:         ProjectionSeries
  /** Months until cash reaches zero in the p50 scenario (Infinity if never) */
  runwayMonths:           number
  /** 0–100 risk score derived from survival heuristic */
  riskIndex:              number
  /** ARR × growth-rate multiple (SaaS heuristic, capped 2×–30×) */
  enterpriseValueEstimate: number
  /** p10 pessimistic / p50 base / p90 optimistic scenario bands */
  probabilityBands: {
    p10: ProjectionBand
    p50: ProjectionBand
    p90: ProjectionBand
  }
}

// ── Internal helpers ──────────────────────────────────────────────────────

/** Normalise a value that could be 0–1 decimal or 0–100 percentage to 0–100. */
function normTo100(v: number): number {
  return Math.abs(v) <= 1 ? v * 100 : v
}

/** Monthly growth rate from an annual percentage (e.g. 25 → ~0.0188). */
function monthlyRate(annualPct: number): number {
  return Math.pow(1 + annualPct / 100, 1 / 12) - 1
}

/** Extract projection series from a timeSimulation output. */
function extractSeries(
  timeline: ReturnType<typeof timeSimulation>,
  grossMarginFrac: number,
  monthlyBurnBase: number,
): ProjectionBand {
  const revenue: number[] = []
  const ebitda:  number[] = []
  const cash:    number[] = []
  const runway:  number[] = []

  for (const state of timeline) {
    const rev   = state.kpis.revenue ?? 0
    const burn  = state.kpis.burn    ?? monthlyBurnBase
    const c     = state.kpis.cash    ?? 0
    const rwy   = state.kpis.runway  ?? (burn > 0 ? c / burn : 999)
    const ebit  = rev * grossMarginFrac - burn

    revenue.push(Math.max(0, rev))
    ebitda.push(ebit)
    cash.push(Math.max(0, c))
    runway.push(Math.max(0, rwy))
  }

  return { revenue, ebitda, cash, runway }
}

// ── Main export ───────────────────────────────────────────────────────────

/**
 * Compute forward-looking projection series from a single SimulationKpis snapshot.
 *
 * @param kpis          SimulationKpis from any pipeline (WhatIf, Studio, or store)
 * @param horizonMonths Projection horizon in months (default: 24)
 */
export function computeSimulationProjections(
  kpis: SimulationKpis,
  horizonMonths = 24,
): SimulationProjections {
  // Normalise percentage fields (can arrive as 0–1 or 0–100 depending on source)
  const grossMarginPct = normTo100(kpis.grossMargin)
  const growthRatePct  = normTo100(kpis.growthRate)
  const churnPct       = normTo100(kpis.churnRate)
  const grossMarginFrac = grossMarginPct / 100

  const arr    = kpis.revenue * 12
  const evMult = Math.max(2, Math.min(30, (growthRatePct / 100) * 40))
  const ev     = arr * evMult

  const runway0 = kpis.runway ?? (kpis.monthlyBurn > 0 ? kpis.cash / kpis.monthlyBurn : 999)

  // Base snapshot shared across all three variants
  const baseSnap = buildKpiSnapshot({
    cashBalance:    kpis.cash,
    runwayMonths:   runway0,
    growthRatePct,
    arr,
    revenueMonthly: kpis.revenue,
    burnMonthly:    kpis.monthlyBurn,
    churnPct,
    grossMarginPct,
    headcount:      kpis.headcount,
    enterpriseValue: ev,
  })

  // Monthly revenue growth rates for each scenario
  const baseMonthly = monthlyRate(growthRatePct)
  const p10Monthly  = monthlyRate(growthRatePct * 0.65) // pessimistic — 35% growth haircut
  const p90Monthly  = monthlyRate(growthRatePct * 1.35) // optimistic  — 35% growth uplift

  const forces50 = { direct: {} as Record<string, number>, monthlyGrowthRates: { revenue: baseMonthly, arr: baseMonthly } }
  const forces10 = { direct: {} as Record<string, number>, monthlyGrowthRates: { revenue: p10Monthly,  arr: p10Monthly  } }
  const forces90 = { direct: {} as Record<string, number>, monthlyGrowthRates: { revenue: p90Monthly,  arr: p90Monthly  } }

  // p10 — pessimistic: higher burn pressure
  const p10snap = { ...baseSnap, burn: kpis.monthlyBurn * 1.12 }
  // p90 — optimistic: slightly lower burn
  const p90snap = { ...baseSnap, burn: kpis.monthlyBurn * 0.92 }

  const tl50 = timeSimulation(baseSnap, forces50, horizonMonths)
  const tl10 = timeSimulation(p10snap,  forces10, horizonMonths)
  const tl90 = timeSimulation(p90snap,  forces90, horizonMonths)

  const band50 = extractSeries(tl50, grossMarginFrac, kpis.monthlyBurn)
  const band10 = extractSeries(tl10, grossMarginFrac, kpis.monthlyBurn * 1.12)
  const band90 = extractSeries(tl90, grossMarginFrac, kpis.monthlyBurn * 0.92)

  // Runway: first month where p50 cash hits zero; fallback to KPI-derived value
  const cashOut = band50.cash.findIndex((c) => c <= 0)
  const runwayMonths = cashOut > 0
    ? cashOut
    : Number.isFinite(runway0) ? runway0 : horizonMonths

  const riskIndex = selectRiskScore(kpis)

  return {
    revenueProjection:      band50.revenue,
    ebitdaProjection:       band50.ebitda,
    cashProjection:         band50.cash,
    runwayMonths:           Math.min(runwayMonths, horizonMonths),
    riskIndex,
    enterpriseValueEstimate: ev,
    probabilityBands: {
      p10: band10,
      p50: band50,
      p90: band90,
    },
  }
}
