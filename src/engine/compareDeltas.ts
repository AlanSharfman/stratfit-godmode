// src/engine/compareDeltas.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Compare Delta Engine
//
// Computes the six canonical simulation deltas between two SimulationResults
// objects (typically baseline vs active scenario).
//
// Priority order for each metric:
//   1. simulationResults.projections  — richer, from computeSimulationProjections
//   2. simulationResults.kpis         — raw KPI snapshot (always present)
//   3. inline derivation              — heuristic last resort (EV, EBITDA, Risk)
//
// RULES:
//   - Pure function — no store access, no React hooks
//   - Safe divide: pctDelta is null when baseline is zero
//   - No hard-coded business values
// ═══════════════════════════════════════════════════════════════════════════

import type { SimulationResults, SimulationKpis } from "@/state/phase1ScenarioStore"
import { selectRiskScore } from "@/selectors/riskSelectors"

// ── Output types ─────────────────────────────────────────────────────────

export type DeltaUnit = "currency" | "percent" | "months" | "score"

export interface MetricDelta {
  /** Human-readable metric label */
  label:     string
  /** Value from the left / baseline side */
  baseline:  number
  /** Value from the right / scenario side */
  scenario:  number
  /** scenario − baseline */
  absDelta:  number
  /**
   * ((scenario − baseline) / |baseline|) × 100
   * null when baseline is ≈ 0 (safe divide protection)
   */
  pctDelta:  number | null
  /** true → higher scenario value is favourable */
  upIsGood:  boolean
  /** Controls display formatting */
  unit:      DeltaUnit
}

export interface DeltaMetrics {
  revenueDelta:         MetricDelta
  ebitdaDelta:          MetricDelta
  cashDelta:            MetricDelta
  runwayDelta:          MetricDelta
  riskDelta:            MetricDelta
  enterpriseValueDelta: MetricDelta
}

// ── Internal helpers ──────────────────────────────────────────────────────

/** Safe percentage change — returns null when base is effectively zero. */
function safePct(base: number, scen: number): number | null {
  if (Math.abs(base) < 0.0001) return null
  return ((scen - base) / Math.abs(base)) * 100
}

function makeDelta(
  label:    string,
  unit:     DeltaUnit,
  upIsGood: boolean,
  baseline: number,
  scenario: number,
): MetricDelta {
  return {
    label,
    baseline,
    scenario,
    absDelta: scenario - baseline,
    pctDelta: safePct(baseline, scenario),
    upIsGood,
    unit,
  }
}

/** EV heuristic when projections are absent: ARR × growth-rate multiple (2×–30×). */
function evFromKpis(k: SimulationKpis): number {
  const arr = k.revenue * 12
  const gr  = Math.abs(k.growthRate) <= 1 ? k.growthRate : k.growthRate / 100
  return arr * Math.max(2, Math.min(30, gr * 40))
}

/** EBITDA heuristic: revenue − total monthly burn. */
function ebitdaFromKpis(k: SimulationKpis): number {
  return k.revenue - k.monthlyBurn
}

/**
 * Extract the six canonical metric values from a SimulationResults object.
 *
 * Uses projections (p50 month-0) when available for richer accuracy.
 * Falls back gracefully to kpis-derived values.
 */
function extractValues(results: SimulationResults): {
  revenue:         number
  ebitda:          number
  cash:            number
  runway:          number
  risk:            number
  enterpriseValue: number
} {
  const { kpis, projections } = results

  // Use p50 month-0 projections when available (most accurate)
  const p50 = projections?.probabilityBands?.p50

  return {
    revenue:         (p50?.revenue[0]                      ?? projections?.revenueProjection[0])         ?? kpis.revenue,
    ebitda:          (p50?.ebitda[0]                       ?? projections?.ebitdaProjection[0])          ?? ebitdaFromKpis(kpis),
    cash:            (p50?.cash[0]                         ?? projections?.cashProjection[0])            ?? kpis.cash,
    runway:          (projections?.runwayMonths !== undefined ? projections.runwayMonths : null)         ?? kpis.runway ?? 0,
    risk:            (projections?.riskIndex               !== undefined ? projections.riskIndex : null) ?? selectRiskScore(kpis),
    enterpriseValue: (projections?.enterpriseValueEstimate !== undefined ? projections.enterpriseValueEstimate : null) ?? evFromKpis(kpis),
  }
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Compute the six canonical delta metrics between two SimulationResults.
 *
 * @param baselineResults  Left-side simulation results (Baseline or Scenario A)
 * @param scenarioResults  Right-side simulation results (Scenario B or C)
 * @returns DeltaMetrics or null when either side is unavailable
 */
export function computeDeltas(
  baselineResults: SimulationResults | null | undefined,
  scenarioResults: SimulationResults | null | undefined,
): DeltaMetrics | null {
  if (!baselineResults || !scenarioResults) return null

  const b = extractValues(baselineResults)
  const s = extractValues(scenarioResults)

  return {
    revenueDelta:         makeDelta("Revenue (MRR)",    "currency", true,  b.revenue,         s.revenue),
    ebitdaDelta:          makeDelta("EBITDA (proxy)",   "currency", true,  b.ebitda,          s.ebitda),
    cashDelta:            makeDelta("Cash / Liquidity", "currency", true,  b.cash,            s.cash),
    runwayDelta:          makeDelta("Runway",           "months",   true,  b.runway,          s.runway),
    riskDelta:            makeDelta("Risk Score",       "score",    true,  b.risk,            s.risk),
    enterpriseValueDelta: makeDelta("Enterprise Value", "currency", true,  b.enterpriseValue, s.enterpriseValue),
  }
}
