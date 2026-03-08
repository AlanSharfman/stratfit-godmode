import { create } from "zustand"
import type { PositionKpis } from "@/pages/position/overlays/positionState"

export const TIMELINE_HORIZONS = [0, 3, 6, 12, 24] as const
export type TimeHorizon = (typeof TIMELINE_HORIZONS)[number]

export const HORIZON_LABELS: Record<TimeHorizon, string> = {
  0: "Now",
  3: "3M",
  6: "6M",
  12: "12M",
  24: "24M",
}

export interface TimeSlice {
  t: TimeHorizon
  kpis: PositionKpis
}

export interface ScenarioTimeline {
  id: string
  label: string
  slices: TimeSlice[]
}

interface ScenarioTimelineState {
  timeline: ScenarioTimeline | null
  activeHorizon: TimeHorizon
  isPlaying: boolean
  playSpeed: number

  setTimeline: (timeline: ScenarioTimeline | null) => void
  setActiveHorizon: (horizon: TimeHorizon) => void
  startPlayback: () => void
  stopPlayback: () => void
  setPlaySpeed: (speed: number) => void
  clear: () => void
}

export const useScenarioTimelineStore = create<ScenarioTimelineState>((set) => ({
  timeline: null,
  activeHorizon: 0,
  isPlaying: false,
  playSpeed: 1,

  setTimeline: (timeline) => set({ timeline, activeHorizon: 0, isPlaying: false }),
  setActiveHorizon: (activeHorizon) => set({ activeHorizon }),
  startPlayback: () => set({ isPlaying: true }),
  stopPlayback: () => set({ isPlaying: false }),
  setPlaySpeed: (playSpeed) => set({ playSpeed }),
  clear: () => set({ timeline: null, activeHorizon: 0, isPlaying: false }),
}))

export function getSliceAtHorizon(timeline: ScenarioTimeline | null, t: TimeHorizon): TimeSlice | null {
  if (!timeline) return null
  return timeline.slices.find((s) => s.t === t) ?? null
}

export function interpolateKpis(a: PositionKpis, b: PositionKpis, factor: number): PositionKpis {
  const f = Math.max(0, Math.min(1, factor))
  const lerp = (va: number, vb: number) => va + (vb - va) * f
  return {
    arr: lerp(a.arr, b.arr),
    burnMonthly: lerp(a.burnMonthly, b.burnMonthly),
    runwayMonths: lerp(a.runwayMonths, b.runwayMonths),
    ebitdaMonthly: lerp(a.ebitdaMonthly, b.ebitdaMonthly),
    riskIndex: lerp(a.riskIndex, b.riskIndex),
    cashOnHand: lerp(a.cashOnHand, b.cashOnHand),
    revenueMonthly: lerp(a.revenueMonthly, b.revenueMonthly),
    survivalScore: lerp(a.survivalScore, b.survivalScore),
    grossMarginPct: lerp(a.grossMarginPct, b.grossMarginPct),
    valuationEstimate: lerp(a.valuationEstimate, b.valuationEstimate),
    growthRatePct: lerp(a.growthRatePct, b.growthRatePct),
    churnPct: lerp(a.churnPct, b.churnPct),
    headcount: Math.round(lerp(a.headcount, b.headcount)),
    nrrPct: lerp(a.nrrPct, b.nrrPct),
    efficiencyRatio: lerp(a.efficiencyRatio, b.efficiencyRatio),
  }
}

/**
 * Get interpolated KPIs at any fractional month position along the timeline.
 * For positions between horizons, linearly interpolates between the two bounding slices.
 */
export function getInterpolatedKpis(
  timeline: ScenarioTimeline | null,
  month: number,
): PositionKpis | null {
  if (!timeline || timeline.slices.length === 0) return null

  const sorted = [...timeline.slices].sort((a, b) => a.t - b.t)

  if (month <= sorted[0].t) return sorted[0].kpis
  if (month >= sorted[sorted.length - 1].t) return sorted[sorted.length - 1].kpis

  for (let i = 0; i < sorted.length - 1; i++) {
    if (month >= sorted[i].t && month <= sorted[i + 1].t) {
      const span = sorted[i + 1].t - sorted[i].t
      if (span === 0) return sorted[i].kpis
      const factor = (month - sorted[i].t) / span
      return interpolateKpis(sorted[i].kpis, sorted[i + 1].kpis, factor)
    }
  }

  return sorted[sorted.length - 1].kpis
}
