import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_KEYS, HEALTH_ELEVATION } from "@/domain/intelligence/kpiZoneMapping"
import type { PositionKpis } from "@/pages/position/overlays/positionState"

/**
 * Generate an AI-optimized PositionKpis snapshot.
 * Pushes every KPI to "strong" health thresholds while keeping
 * relationships realistic — the "this is what your mountain COULD look like."
 */
export function computeOptimalKpis(current: PositionKpis): PositionKpis {
  return {
    arr: Math.max(current.arr * 2.5, 1_200_000),
    burnMonthly: Math.max(current.burnMonthly * 0.6, 10_000),
    runwayMonths: Math.max(24, current.runwayMonths * 2),
    ebitdaMonthly: Math.max(current.ebitdaMonthly * 3, current.revenueMonthly * 0.3),
    riskIndex: Math.min(85, current.riskIndex + 30),
    cashOnHand: Math.max(current.cashOnHand * 3, 2_000_000),
    revenueMonthly: Math.max(current.revenueMonthly * 2.5, 100_000),
    survivalScore: Math.min(95, current.survivalScore + 25),
    grossMarginPct: Math.min(85, Math.max(current.grossMarginPct + 15, 70)),
    valuationEstimate: Math.max(current.valuationEstimate * 4, current.arr * 8),
    growthRatePct: Math.max(current.growthRatePct + 20, 35),
    churnPct: Math.max(0.5, current.churnPct * 0.3),
    efficiencyRatio: Math.max(current.efficiencyRatio * 2, 1.2),
  }
}

/**
 * Generate a narrative comparing current vs optimal terrain.
 */
export function generateOptimalNarrative(current: PositionKpis, optimal: PositionKpis): string {
  const gaps: string[] = []

  const growthGap = optimal.growthRatePct - current.growthRatePct
  if (growthGap > 10) gaps.push(`growth zone is ${Math.round((1 - current.growthRatePct / optimal.growthRatePct) * 100)}% below optimal`)

  const churnGap = current.churnPct - optimal.churnPct
  if (churnGap > 2) gaps.push(`churn is ${churnGap.toFixed(1)}pp above target`)

  const marginGap = optimal.grossMarginPct - current.grossMarginPct
  if (marginGap > 5) gaps.push(`margin ridge has ${marginGap.toFixed(0)}pp of headroom`)

  const runwayGap = optimal.runwayMonths - current.runwayMonths
  if (runwayGap > 6) gaps.push(`runway horizon could extend by ${Math.round(runwayGap)} months`)

  if (gaps.length === 0) {
    return "Your terrain is close to optimal across all zones. Focus on maintaining momentum."
  }

  return `Compared to the optimal terrain: ${gaps.join(". ")}. The primary drivers are churn reduction and growth acceleration, which cascade through 4+ connected zones.`
}
