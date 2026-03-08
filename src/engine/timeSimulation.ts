import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_KEYS } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_GRAPH, propagateForce } from "./kpiDependencyGraph"

export type KpiSnapshot = Record<KpiKey, number>

export interface TippingPoint {
  month: number
  kpi: KpiKey
  threshold: "critical" | "watch"
  value: number
}

export interface TimelineState {
  month: number
  kpis: KpiSnapshot
  tippingPoints: TippingPoint[]
}

const CRITICAL_THRESHOLDS: Partial<Record<KpiKey, { low?: number; high?: number }>> = {
  cash: { low: 0 },
  runway: { low: 3 },
  burn: { high: 0.95 },
  churn: { high: 15 },
  grossMargin: { low: 30 },
  headcount: { low: 2 },
}

const WATCH_THRESHOLDS: Partial<Record<KpiKey, { low?: number; high?: number }>> = {
  cash: { low: 50_000 },
  runway: { low: 6 },
  burn: { high: 0.8 },
  churn: { high: 8 },
  grossMargin: { low: 50 },
  growth: { low: 5 },
  headcount: { low: 5 },
}

function checkThreshold(
  kpi: KpiKey,
  value: number,
  thresholds: Partial<Record<KpiKey, { low?: number; high?: number }>>,
): boolean {
  const t = thresholds[kpi]
  if (!t) return false
  if (t.low !== undefined && value <= t.low) return true
  if (t.high !== undefined && value >= t.high) return true
  return false
}

export interface SimulationForces {
  direct: Partial<Record<KpiKey, number>>
  monthlyGrowthRates?: Partial<Record<KpiKey, number>>
}

/**
 * Projects KPI state forward month by month, propagating forces through the dependency graph.
 * Detects tipping points where KPIs cross critical/watch thresholds.
 */
export function timeSimulation(
  initialKpis: KpiSnapshot,
  forces: SimulationForces,
  months = 24,
): TimelineState[] {
  const timeline: TimelineState[] = []
  let current: KpiSnapshot = { ...initialKpis }

  // Apply direct forces immediately
  for (const [kpi, delta] of Object.entries(forces.direct) as [KpiKey, number][]) {
    if (delta === undefined) continue
    const { affected } = propagateForce(KPI_GRAPH, kpi, delta)
    for (const [affectedKpi, propagatedDelta] of affected) {
      current[affectedKpi] = (current[affectedKpi] ?? 0) + propagatedDelta
    }
  }

  for (let m = 0; m <= months; m++) {
    const tippingPoints: TippingPoint[] = []

    for (const kpi of KPI_KEYS) {
      const value = current[kpi] ?? 0
      if (checkThreshold(kpi, value, CRITICAL_THRESHOLDS)) {
        tippingPoints.push({ month: m, kpi, threshold: "critical", value })
      } else if (checkThreshold(kpi, value, WATCH_THRESHOLDS)) {
        tippingPoints.push({ month: m, kpi, threshold: "watch", value })
      }
    }

    timeline.push({
      month: m,
      kpis: { ...current },
      tippingPoints,
    })

    // Apply monthly growth rates for next month
    if (forces.monthlyGrowthRates && m < months) {
      const nextKpis = { ...current }
      for (const [kpi, rate] of Object.entries(forces.monthlyGrowthRates) as [KpiKey, number][]) {
        if (rate === undefined) continue
        nextKpis[kpi] = (nextKpis[kpi] ?? 0) * (1 + rate)
      }

      // Propagate monthly changes through the graph
      for (const kpi of KPI_KEYS) {
        const delta = nextKpis[kpi] - current[kpi]
        if (Math.abs(delta) > 0.001) {
          const { affected } = propagateForce(KPI_GRAPH, kpi, delta * 0.1, 2, 0.3)
          for (const [affectedKpi, propagatedDelta] of affected) {
            if (affectedKpi !== kpi) {
              nextKpis[affectedKpi] = (nextKpis[affectedKpi] ?? 0) + propagatedDelta
            }
          }
        }
      }

      // Burn reduces cash
      if (nextKpis.burn > 0 && nextKpis.cash > 0) {
        nextKpis.cash = Math.max(0, nextKpis.cash - nextKpis.burn)
      }
      // Cash determines runway
      if (nextKpis.burn > 0) {
        nextKpis.runway = nextKpis.cash / nextKpis.burn
      }

      current = nextKpis
    }
  }

  return timeline
}

/**
 * Find the first month where a critical tipping point occurs.
 */
export function findFirstCliff(timeline: TimelineState[]): TippingPoint | null {
  for (const state of timeline) {
    const critical = state.tippingPoints.find((tp) => tp.threshold === "critical")
    if (critical) return critical
  }
  return null
}

/**
 * Derive a deterministic survival probability from a simulation timeline.
 * Based on the fraction of the horizon where no critical KPI thresholds are breached.
 * Returns an integer 0–100.
 */
export function deriveSurvivalProbability(timeline: TimelineState[]): number {
  if (timeline.length === 0) return 0
  const horizon = timeline.length
  let viableMonths = 0
  for (const state of timeline) {
    const hasCritical = state.tippingPoints.some((tp) => tp.threshold === "critical")
    if (!hasCritical && state.kpis.cash > 0) viableMonths++
  }
  return Math.round((viableMonths / horizon) * 100)
}

/**
 * Build a default KPI snapshot from baseline numbers.
 */
export function buildKpiSnapshot(kpis: {
  cashBalance?: number
  runwayMonths?: number
  growthRatePct?: number
  arr?: number
  revenueMonthly?: number
  burnMonthly?: number
  churnPct?: number
  grossMarginPct?: number
  headcount?: number
  nrrPct?: number
  efficiencyRatio?: number
  enterpriseValue?: number
}): KpiSnapshot {
  return {
    cash: kpis.cashBalance ?? 0,
    runway: kpis.runwayMonths ?? 0,
    growth: kpis.growthRatePct ?? 0,
    arr: kpis.arr ?? 0,
    revenue: kpis.revenueMonthly ?? 0,
    burn: kpis.burnMonthly ?? 0,
    churn: kpis.churnPct ?? 0,
    grossMargin: kpis.grossMarginPct ?? 0,
    headcount: kpis.headcount ?? 0,
    nrr: kpis.nrrPct ?? 100,
    efficiency: kpis.efficiencyRatio ?? 0,
    enterpriseValue: kpis.enterpriseValue ?? 0,
  }
}
