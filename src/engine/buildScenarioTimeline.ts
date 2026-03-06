import type { PositionKpis } from "@/pages/position/overlays/positionState"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { timeSimulation, buildKpiSnapshot, type SimulationForces } from "./timeSimulation"
import {
  TIMELINE_HORIZONS,
  type TimeSlice,
  type ScenarioTimeline,
  type TimeHorizon,
} from "@/state/scenarioTimelineStore"

/**
 * Builds a ScenarioTimeline with slices at the canonical horizons (0, 3, 6, 12, 24).
 * Uses the existing timeSimulation engine to project KPIs forward.
 */
export function buildScenarioTimeline(
  baseKpis: PositionKpis,
  forces: Partial<Record<KpiKey, number>>,
  label: string,
): ScenarioTimeline {
  const snapshot = buildKpiSnapshot({
    cashBalance: baseKpis.cashOnHand,
    runwayMonths: baseKpis.runwayMonths,
    growthRatePct: baseKpis.growthRatePct,
    arr: baseKpis.arr,
    revenueMonthly: baseKpis.revenueMonthly,
    burnMonthly: baseKpis.burnMonthly,
    churnPct: baseKpis.churnPct,
    grossMarginPct: baseKpis.grossMarginPct,
    headcount: baseKpis.headcount,
    enterpriseValue: baseKpis.valuationEstimate,
  })

  const simForces: SimulationForces = { direct: forces }
  const fullTimeline = timeSimulation(snapshot, simForces, 24)

  const slices: TimeSlice[] = TIMELINE_HORIZONS.map((t) => {
    const state = fullTimeline[Math.min(t, fullTimeline.length - 1)]
    if (!state) {
      return { t, kpis: baseKpis }
    }
    const s = state.kpis
    const gp = s.revenue * Math.min(s.grossMargin / 100, 1)
    const projectedKpis: PositionKpis = {
      arr: s.arr,
      burnMonthly: s.burn,
      runwayMonths: s.runway,
      ebitdaMonthly: gp - Math.max(s.burn - gp, 0),
      riskIndex: baseKpis.riskIndex,
      cashOnHand: s.cash,
      revenueMonthly: s.revenue,
      survivalScore: baseKpis.survivalScore,
      grossMarginPct: s.grossMargin,
      valuationEstimate: s.enterpriseValue,
      growthRatePct: s.growth,
      churnPct: s.churn,
      headcount: s.headcount,
      nrrPct: baseKpis.nrrPct,
      efficiencyRatio: baseKpis.efficiencyRatio,
    }
    return { t, kpis: projectedKpis }
  })

  return {
    id: `timeline-${Date.now()}`,
    label,
    slices,
  }
}

/**
 * Generates a TTS narration script describing how KPIs evolve across the timeline.
 */
export function buildTimelineNarration(timeline: ScenarioTimeline): string {
  if (timeline.slices.length < 2) return ""

  const now = timeline.slices[0]
  const end = timeline.slices[timeline.slices.length - 1]
  const sentences: string[] = []

  sentences.push(`Here is the ${timeline.label} scenario evolution over 24 months.`)

  const runwayDelta = end.kpis.runwayMonths - now.kpis.runwayMonths
  if (Math.abs(runwayDelta) > 1) {
    sentences.push(`Runway ${runwayDelta > 0 ? "extends" : "contracts"} by ${Math.abs(runwayDelta).toFixed(1)} months.`)
  }

  const arrDelta = end.kpis.arr - now.kpis.arr
  if (Math.abs(arrDelta) > 10_000) {
    const fmt = Math.abs(arrDelta) >= 1e6
      ? `$${(Math.abs(arrDelta) / 1e6).toFixed(1)}M`
      : `$${(Math.abs(arrDelta) / 1e3).toFixed(0)}K`
    sentences.push(`ARR ${arrDelta > 0 ? "grows" : "declines"} by ${fmt}.`)
  }

  const cashDelta = end.kpis.cashOnHand - now.kpis.cashOnHand
  if (Math.abs(cashDelta) > 10_000) {
    const fmt = Math.abs(cashDelta) >= 1e6
      ? `$${(Math.abs(cashDelta) / 1e6).toFixed(1)}M`
      : `$${(Math.abs(cashDelta) / 1e3).toFixed(0)}K`
    sentences.push(`Cash position ${cashDelta > 0 ? "improves" : "deteriorates"} by ${fmt}.`)
  }

  const mid = timeline.slices.find((s) => s.t === 12)
  if (mid && mid.kpis.runwayMonths < 6) {
    sentences.push(`Warning: by month 12, runway falls below 6 months.`)
  }

  sentences.push(`The terrain is now showing the projected ${end.t}-month state.`)

  return sentences.join(" ")
}
