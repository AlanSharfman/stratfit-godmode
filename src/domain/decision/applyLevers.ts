// src/domain/decision/applyLevers.ts
// ═══════════════════════════════════════════════════════════════
// Translate lever values into baseline adjustments for simulation.
//
// Each intent-type lever maps to plausible financial adjustments:
//   hiring       → burn up, growth up (with ramp delay)
//   pricing      → revenue up/down, churn sensitivity
//   cost_reduction → burn down, growth may dip
//   fundraising  → cash up, runway up
//   growth_investment → burn up, growth up with ROI delay
//
// All transforms are linear and clamped. This is demo wiring,
// not a final finance model.
// ═══════════════════════════════════════════════════════════════

import type { LeverValues } from "./LeverValues"

export interface BaselineInputs {
  cash: number
  monthlyBurn: number
  revenue: number
  grossMargin: number
  growthRate: number
  churnRate: number
  headcount: number
  arpa: number
}

export interface AdjustedInputs extends BaselineInputs {
  /** How much the levers shifted overall (0–1 scale, for terrain roughness) */
  leverMagnitude: number
}

/** Clamp a value between lo and hi */
function clamp(val: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, val))
}

/**
 * Apply lever values to baseline inputs, producing adjusted inputs
 * that the simulation engine uses for KPI + terrain computation.
 *
 * If leverValues is empty or all defaults, output === baseline
 * (backward compatible).
 */
export function applyLeversToBaseline(
  baseline: BaselineInputs,
  leverValues: LeverValues,
): AdjustedInputs {
  let cash = baseline.cash
  let burn = baseline.monthlyBurn
  let revenue = baseline.revenue
  let grossMargin = baseline.grossMargin
  let growthRate = baseline.growthRate
  let churnRate = baseline.churnRate
  let headcount = baseline.headcount
  let arpa = baseline.arpa

  // Track total absolute lever shift for leverMagnitude
  let totalShift = 0

  // ── Hiring levers ──
  const hc = leverValues.headcount ?? 0
  if (hc !== 0) {
    // Each head costs ~avgSalary/month; revenue per head ramps
    const costPerHead = burn > 0 && headcount > 0 ? burn / headcount : 8000
    burn += hc * costPerHead
    headcount += hc
    totalShift += Math.abs(hc) / 20
  }
  const salaryBand = leverValues.salaryBand ?? 0
  if (salaryBand !== 0) {
    // Salary band impact: % change to burn
    burn *= 1 + salaryBand / 100
    totalShift += Math.abs(salaryBand) / 20
  }
  const revenueHead = leverValues.revenueHead ?? 0
  if (revenueHead !== 0) {
    // Revenue per head: % uplift to revenue
    revenue *= 1 + revenueHead / 100
    growthRate *= 1 + revenueHead / 200 // partial growth effect
    totalShift += Math.abs(revenueHead) / 30
  }

  // ── Pricing levers ──
  const priceChange = leverValues.priceChange ?? 0
  if (priceChange !== 0) {
    // Price change directly affects revenue and ARPA
    revenue *= 1 + priceChange / 100
    arpa *= 1 + priceChange / 100
    totalShift += Math.abs(priceChange) / 50
  }
  const churnSens = leverValues.churnSensitivity ?? 0
  if (churnSens > 0 && priceChange > 0) {
    // Higher price + churn sensitivity → churn increases
    const churnBump = (priceChange / 100) * (churnSens / 100) * 0.5
    churnRate += churnBump
    totalShift += churnBump * 10
  }
  const volumeImpact = leverValues.volumeImpact ?? 0
  if (volumeImpact !== 0) {
    revenue *= 1 + volumeImpact / 100
    growthRate *= 1 + volumeImpact / 200
    totalShift += Math.abs(volumeImpact) / 20
  }

  // ── Cost reduction levers ──
  const opexReduction = leverValues.opexReduction ?? 0
  if (opexReduction > 0) {
    burn *= 1 - opexReduction / 100
    // Slight growth deceleration from cost cuts
    growthRate *= 1 - opexReduction / 400
    totalShift += opexReduction / 40
  }
  const headcountCut = leverValues.headcountCut ?? 0
  if (headcountCut < 0) {
    const costPerHead = burn > 0 && headcount > 0 ? burn / headcount : 8000
    burn += headcountCut * costPerHead // headcountCut is negative
    headcount += headcountCut
    totalShift += Math.abs(headcountCut) / 20
  }
  const efficiencyGain = leverValues.efficiencyGain ?? 0
  if (efficiencyGain > 0) {
    burn *= 1 - efficiencyGain / 200
    grossMargin += efficiencyGain / 200
    totalShift += efficiencyGain / 30
  }

  // ── Fundraising levers ──
  const capitalRaise = leverValues.capitalRaise ?? 0
  if (capitalRaise > 0) {
    cash += capitalRaise * 1_000_000 // $M → $
    totalShift += capitalRaise / 50
  }
  const useOfProceeds = leverValues.useOfProceeds ?? 0
  if (useOfProceeds > 0 && capitalRaise > 0) {
    // Growth allocation: portion of raise goes to growth spend → burn up
    const growthAlloc = capitalRaise * 1_000_000 * (useOfProceeds / 100)
    const monthlyGrowthSpend = growthAlloc / 24 // spread over 24mo
    burn += monthlyGrowthSpend
    growthRate *= 1 + useOfProceeds / 200
    totalShift += useOfProceeds / 100
  }

  // ── Growth investment levers ──
  const growthSpend = leverValues.growthSpend ?? 0
  if (growthSpend > 0) {
    burn *= 1 + growthSpend / 100
    totalShift += growthSpend / 50
  }
  const growthMulti = leverValues.growthMulti ?? 0
  if (growthMulti > 1) {
    growthRate *= growthMulti
    totalShift += (growthMulti - 1) / 4
  }

  // ── Clamp all outputs to safe ranges ──
  cash = clamp(cash, 0, 1e12)
  burn = clamp(burn, 0, 1e9)
  revenue = clamp(revenue, 0, 1e10)
  grossMargin = clamp(grossMargin, -1, 1)
  growthRate = clamp(growthRate, -0.5, 5)
  churnRate = clamp(churnRate, 0, 1)
  headcount = clamp(Math.round(headcount), 0, 100000)
  arpa = clamp(arpa, 0, 1e8)

  return {
    cash,
    monthlyBurn: burn,
    revenue,
    grossMargin,
    growthRate,
    churnRate,
    headcount,
    arpa,
    leverMagnitude: clamp(totalShift, 0, 1),
  }
}
