/**
 * STRATFIT — Confidence Band Generator
 *
 * Takes the P50 (median) scenario timeline slices and generates
 * P25 (pessimistic) and P75 (optimistic) variants by applying
 * uncertainty spreads that grow with time horizon.
 */

import type { PositionKpis } from "@/pages/position/overlays/positionState"
import type { TimeSlice } from "@/state/scenarioTimelineStore"

export interface ConfidenceBands {
  p25: TimeSlice[]
  p50: TimeSlice[]
  p75: TimeSlice[]
}

/**
 * Uncertainty spread grows with time. At t=0 there is zero spread;
 * by t=24 months the spread reaches its maximum.
 */
function spreadFactor(t: number): number {
  return Math.min(1, t / 24)
}

const KPI_VOLATILITY: Record<keyof PositionKpis, number> = {
  arr:              0.12,
  burnMonthly:      0.10,
  runwayMonths:     0.15,
  ebitdaMonthly:    0.18,
  riskIndex:        0.08,
  cashOnHand:       0.14,
  revenueMonthly:   0.12,
  survivalScore:    0.06,
  grossMarginPct:   0.05,
  valuationEstimate: 0.20,
  growthRatePct:    0.15,
  churnPct:         0.10,
  headcount:        0.05,
  nrrPct:           0.08,
  efficiencyRatio:  0.06,
}

function applySpread(kpis: PositionKpis, t: number, direction: 1 | -1): PositionKpis {
  const sf = spreadFactor(t)
  const result = { ...kpis }

  for (const key of Object.keys(KPI_VOLATILITY) as (keyof PositionKpis)[]) {
    const vol = KPI_VOLATILITY[key]
    const base = kpis[key] as number
    const shift = base * vol * sf * direction

    if (key === "headcount") {
      ;(result as any)[key] = Math.max(0, Math.round(base + shift))
    } else {
      ;(result as any)[key] = base + shift
    }
  }

  return result
}

/**
 * Generate P25/P50/P75 bands from the median timeline slices.
 * P25 = pessimistic (worse KPIs), P75 = optimistic (better KPIs).
 */
export function buildConfidenceBands(p50Slices: TimeSlice[]): ConfidenceBands {
  const p25: TimeSlice[] = []
  const p75: TimeSlice[] = []

  for (const slice of p50Slices) {
    p25.push({ t: slice.t, kpis: applySpread(slice.kpis, slice.t, -1) })
    p75.push({ t: slice.t, kpis: applySpread(slice.kpis, slice.t, 1) })
  }

  return { p25, p50: p50Slices, p75 }
}
