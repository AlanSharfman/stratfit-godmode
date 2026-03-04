// src/selectors/valuationSelectors.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Valuation Selectors (Phase V-1 + V-2A + V-4)
//
// Thin selector layer over the deterministic valuation engine.
// V-1:  selectValuation(engineResults) — direct EngineResults path
// V-2A: selectValuationFromSimulation(simResults) — canonical bridge
//       Converts SimulationResults (phase1ScenarioStore) → EngineResults
//       so pages wired to the canonical store can use the V-1 engine.
// V-4:  selectWaterfallFromSimulation(simResults, baseline) — waterfall
//       Computes baseline vs scenario EV and sequential marginal
//       attribution across 5 drivers. All math here, never in UI.
// ═══════════════════════════════════════════════════════════════════════════

import type { EngineResults, EngineTimelinePoint, EngineSummary } from "@/core/engine/types"
import type { ValuationResults, WaterfallPayload, WaterfallStep } from "@/valuation/valuationTypes"
import type { SimulationResults, SimulationKpis } from "@/state/phase1ScenarioStore"
import type { Baseline } from "@/types/baseline"
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

// ═══════════════════════════════════════════════════════════════════════════
// V-4 — WATERFALL ATTRIBUTION
// ═══════════════════════════════════════════════════════════════════════════
//
// Sequential marginal attribution:
//   1. Start with baseline KPIs → compute baselineEV
//   2. Mutate one driver group at a time (revenue → margin → capex → risk → terminal)
//   3. Each step's delta = newEV − previousEV after mutation
//   4. Final step absorbs residual so Σ deltas = scenarioEV − baselineEV exactly
//
// All computation happens here. UI receives the payload and renders only.
// ═══════════════════════════════════════════════════════════════════════════

/** Derive direction from delta value */
function stepDirection(delta: number): "up" | "down" | "flat" {
  if (delta > 0) return "up"
  if (delta < 0) return "down"
  return "flat"
}

/** Convert Baseline (8 fields) → SimulationKpis (8 fields + runway) */
function baselineToKpis(baseline: Baseline): SimulationKpis {
  return {
    cash: baseline.cash,
    monthlyBurn: baseline.monthlyBurn,
    revenue: baseline.revenue,
    grossMargin: baseline.grossMargin,
    growthRate: baseline.growthRate,
    churnRate: baseline.churnRate,
    headcount: baseline.headcount,
    arpa: baseline.arpa,
    runway: baseline.monthlyBurn > 0 ? baseline.cash / baseline.monthlyBurn : null,
  }
}

/**
 * Select waterfall attribution from simulation results + baseline.
 *
 * Returns null when insufficient data to compute.
 * Pure function — no store access, no side effects.
 *
 * Sequential driver groups:
 *   1. Revenue Growth — revenue + growthRate
 *   2. Margin Expansion — grossMargin
 *   3. Capital Efficiency — cash + monthlyBurn
 *   4. Risk Adjustment — churnRate (affects risk index → EBITDA multiple)
 *   5. Terminal Growth — headcount + arpa + runway (residual catch-all)
 */
export function selectWaterfallFromSimulation(
  simResults: SimulationResults | null | undefined,
  baseline: Baseline | null | undefined,
): WaterfallPayload | null {
  if (!simResults?.kpis || !baseline) return null

  const horizonMonths = simResults.horizonMonths ?? 24
  const scenKpis = simResults.kpis

  // ── Baseline EV ──
  const baseKpis = baselineToKpis(baseline)
  const baseER = buildEngineResultsFromKpis(baseKpis, horizonMonths)
  const baseVal = computeValuation(baseER)
  const baselineEV = baseVal.blendedValue

  // ── Scenario EV (final target) ──
  const scenER = buildEngineResultsFromKpis(scenKpis, horizonMonths)
  const scenVal = computeValuation(scenER)
  const scenarioEV = scenVal.blendedValue

  // ── Sequential marginal attribution ──
  let currentKpis = { ...baseKpis }
  let currentEV = baselineEV
  const steps: WaterfallStep[] = []

  // Step 1: Revenue Growth (revenue + growthRate)
  currentKpis = { ...currentKpis, revenue: scenKpis.revenue, growthRate: scenKpis.growthRate }
  let er = buildEngineResultsFromKpis(currentKpis, horizonMonths)
  let ev = computeValuation(er).blendedValue
  let delta = ev - currentEV
  steps.push({ id: "revenue_growth", label: "Revenue Growth", delta, direction: stepDirection(delta) })
  currentEV = ev

  // Step 2: Margin Expansion (grossMargin)
  currentKpis = { ...currentKpis, grossMargin: scenKpis.grossMargin }
  er = buildEngineResultsFromKpis(currentKpis, horizonMonths)
  ev = computeValuation(er).blendedValue
  delta = ev - currentEV
  steps.push({ id: "margin_expansion", label: "Margin Expansion", delta, direction: stepDirection(delta) })
  currentEV = ev

  // Step 3: Capital Efficiency (cash + monthlyBurn)
  currentKpis = { ...currentKpis, cash: scenKpis.cash, monthlyBurn: scenKpis.monthlyBurn }
  // Recalculate runway since it depends on cash/burn
  currentKpis.runway = currentKpis.monthlyBurn > 0 ? currentKpis.cash / currentKpis.monthlyBurn : null
  er = buildEngineResultsFromKpis(currentKpis, horizonMonths)
  ev = computeValuation(er).blendedValue
  delta = ev - currentEV
  steps.push({ id: "capital_efficiency", label: "Capital Efficiency", delta, direction: stepDirection(delta) })
  currentEV = ev

  // Step 4: Risk Adjustment (churnRate)
  currentKpis = { ...currentKpis, churnRate: scenKpis.churnRate }
  currentKpis.runway = currentKpis.monthlyBurn > 0 ? currentKpis.cash / currentKpis.monthlyBurn : null
  er = buildEngineResultsFromKpis(currentKpis, horizonMonths)
  ev = computeValuation(er).blendedValue
  delta = ev - currentEV
  steps.push({ id: "risk_adjustment", label: "Risk Adjustment", delta, direction: stepDirection(delta) })
  currentEV = ev

  // Step 5: Terminal Growth (remaining: headcount, arpa + residual)
  // Use actual scenarioEV so Σ deltas = scenarioEV − baselineEV exactly
  delta = scenarioEV - currentEV
  steps.push({ id: "terminal_growth", label: "Terminal Growth", delta, direction: stepDirection(delta) })

  return {
    baselineEV,
    scenarioEV,
    steps,
    notes: {
      method: "DCF + REV + EBITDA (blended)",
      horizonYears: Math.max(1, Math.round(horizonMonths / 12)),
    },
  }
}
