// src/components/position/computePositionInstruments.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Position Instrument Precomputation (Phase C+)
//
// Pure deterministic functions that derive ProbabilityBand, BiasVectorBar,
// and ExecutiveSummaryBar props from engine results. NO side effects.
// Called once per simulation completion — components receive precomputed values.
// ═══════════════════════════════════════════════════════════════════════════

import type { SimulationKpis } from "@/state/phase1ScenarioStore"
import type { ProbabilityBandProps, ProbabilityBandMetric } from "./ProbabilityBand"
import type { BiasVectorBarProps } from "./BiasVectorBar"
import type { ExecutiveSummaryBarProps } from "./ExecutiveSummaryBar"

/* ── Probability Band computation ─────────────────────────────── */

/** Dispersion factor — widens P10/P90 from P50 */
const DISPERSION = 0.25

function computeBand(
  metric: ProbabilityBandMetric,
  label: string,
  p50: number,
  growthRate: number,
  baselineP50?: number,
): ProbabilityBandProps {
  // Dispersion scales with uncertainty
  const spread = Math.abs(p50) * DISPERSION
  const p10 = p50 - spread
  const p90 = p50 + spread

  // Scale bounds: ±40% of p50 for gauge range
  const margin = Math.max(Math.abs(p50) * 0.4, 1)
  const scaleMin = p50 - margin
  const scaleMax = p50 + margin

  // Delta from baseline
  const delta = baselineP50 != null && baselineP50 !== 0
    ? (p50 - baselineP50) / Math.abs(baselineP50)
    : 0

  return {
    metric,
    label,
    p10,
    p50,
    p90,
    scaleMin,
    scaleMax,
    delta,
    medianDisplay: formatCompact(p50),
  }
}

function formatCompact(n: number): string {
  const abs = Math.abs(n)
  const sign = n < 0 ? "-" : ""
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}k`
  if (abs < 1 && abs > 0) return `${sign}${n.toFixed(2)}`
  return `${sign}${Math.round(abs)}`
}

export interface PositionInstruments {
  bands: ProbabilityBandProps[]
  bias: BiasVectorBarProps
  summary: ExecutiveSummaryBarProps
}

export function computePositionInstruments(
  kpis: SimulationKpis,
  baselineKpis?: SimulationKpis | null,
): PositionInstruments {
  // ── Probability bands ──
  const revenueBand = computeBand(
    "revenue",
    "Revenue",
    kpis.revenue,
    kpis.growthRate,
    baselineKpis?.revenue,
  )

  // Valuation: rough 6x revenue multiple for SaaS
  const valuationP50 = kpis.revenue * 12 * 6
  const baselineValuation = baselineKpis ? baselineKpis.revenue * 12 * 6 : undefined
  const valuationBand = computeBand(
    "valuation",
    "Valuation",
    valuationP50,
    kpis.growthRate,
    baselineValuation,
  )

  // Risk: composite score (higher = worse)
  const burnRatio = kpis.revenue > 0 ? kpis.monthlyBurn / kpis.revenue : 1
  const riskP50 = Math.min(1, burnRatio * 0.4 + (1 - Math.min(kpis.growthRate, 1)) * 0.3 + kpis.churnRate * 0.3)
  const baselineBurnRatio = baselineKpis && baselineKpis.revenue > 0
    ? baselineKpis.monthlyBurn / baselineKpis.revenue : undefined
  const baselineRisk = baselineBurnRatio != null
    ? Math.min(1, baselineBurnRatio * 0.4 + (1 - Math.min(baselineKpis!.growthRate, 1)) * 0.3 + baselineKpis!.churnRate * 0.3)
    : undefined
  const riskBand: ProbabilityBandProps = {
    metric: "risk",
    label: "Risk Index",
    p10: Math.max(0, riskP50 - 0.15),
    p50: riskP50,
    p90: Math.min(1, riskP50 + 0.2),
    scaleMin: 0,
    scaleMax: 1,
    delta: baselineRisk != null ? riskP50 - baselineRisk : 0,
    medianDisplay: `${(riskP50 * 100).toFixed(0)}%`,
  }

  // Runway
  const runwayP50 = kpis.runway ?? (kpis.monthlyBurn > 0 ? kpis.cash / kpis.monthlyBurn : 36)
  const baselineRunway = baselineKpis
    ? baselineKpis.runway ?? (baselineKpis.monthlyBurn > 0 ? baselineKpis.cash / baselineKpis.monthlyBurn : 36)
    : undefined
  const runwayBand: ProbabilityBandProps = {
    metric: "runway",
    label: "Runway",
    p10: Math.max(0, runwayP50 - runwayP50 * 0.25),
    p50: runwayP50,
    p90: runwayP50 + runwayP50 * 0.3,
    scaleMin: 0,
    scaleMax: Math.max(36, runwayP50 * 1.5),
    delta: baselineRunway != null && baselineRunway > 0
      ? (runwayP50 - baselineRunway) / baselineRunway
      : 0,
    medianDisplay: `${Math.round(runwayP50)} mo`,
  }

  const bands = [revenueBand, valuationBand, riskBand, runwayBand]

  // ── Bias vector ──
  const revenueDelta = baselineKpis && baselineKpis.revenue > 0
    ? (kpis.revenue - baselineKpis.revenue) / baselineKpis.revenue
    : 0
  const riskDelta = baselineRisk != null ? riskP50 - baselineRisk : 0
  const dispersionDelta = Math.abs(kpis.growthRate - kpis.churnRate) * 0.5

  const bias: BiasVectorBarProps = {
    revenueDelta,
    riskDelta,
    dispersionDelta,
  }

  // ── Executive summary ──
  const liquiditySeverity = runwayP50 < 6 ? 0.9 : runwayP50 < 12 ? 0.5 : 0.2
  const riskSeverity = riskP50

  // Lead clause: highest priority concern
  let leadClause = ""
  if (liquiditySeverity >= 0.75) {
    leadClause = `Runway narrowed to ${Math.round(runwayP50)} months`
  } else if (riskSeverity >= 0.6) {
    leadClause = "Risk index entered elevated band"
  } else if (kpis.growthRate > 0.15) {
    leadClause = "Growth trajectory tracking above baseline"
  } else {
    leadClause = "Operating parameters within tolerance"
  }

  // Delta clause: strongest movement
  let deltaClause = ""
  if (Math.abs(revenueDelta) > 0.1) {
    const dir = revenueDelta > 0 ? "expanded" : "contracted"
    deltaClause = `revenue ${dir} ${(Math.abs(revenueDelta) * 100).toFixed(0)}%`
  } else if (Math.abs(riskDelta) > 0.05) {
    const dir = riskDelta > 0 ? "widened" : "compressed"
    deltaClause = `downside dispersion ${dir}`
  }

  const summary: ExecutiveSummaryBarProps = {
    liquiditySeverity,
    riskSeverity,
    dispersionSeverity: dispersionDelta,
    leadClause,
    deltaClause,
  }

  return { bands, bias, summary }
}
