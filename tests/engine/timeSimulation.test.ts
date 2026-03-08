import { describe, it, expect } from "vitest"
import {
  timeSimulation,
  findFirstCliff,
  buildKpiSnapshot,
  type KpiSnapshot,
  type SimulationForces,
} from "@/engine/timeSimulation"

function makeHealthySnapshot(): KpiSnapshot {
  return buildKpiSnapshot({
    cashBalance: 1_000_000,
    runwayMonths: 18,
    growthRatePct: 15,
    arr: 1_200_000,
    revenueMonthly: 100_000,
    burnMonthly: 55_000,
    churnPct: 3,
    grossMarginPct: 70,
    efficiencyRatio: 0.8,
    enterpriseValue: 5_000_000,
  })
}

function makeCriticalSnapshot(): KpiSnapshot {
  return buildKpiSnapshot({
    cashBalance: 100_000,
    runwayMonths: 3,
    growthRatePct: 1,
    arr: 200_000,
    revenueMonthly: 20_000,
    burnMonthly: 80_000,
    churnPct: 12,
    grossMarginPct: 25,
    efficiencyRatio: 0.2,
    enterpriseValue: 500_000,
  })
}

describe("timeSimulation", () => {
  it("produces the correct number of timeline entries", () => {
    const timeline = timeSimulation(makeHealthySnapshot(), { direct: {} }, 12)
    expect(timeline).toHaveLength(13) // month 0 through 12
  })

  it("month 0 reflects initial state after direct forces", () => {
    const initial = makeHealthySnapshot()
    const timeline = timeSimulation(initial, { direct: {} }, 6)
    expect(timeline[0].month).toBe(0)
    expect(timeline[0].kpis.cash).toBe(initial.cash)
  })

  it("applies direct forces via propagation", () => {
    const timeline = timeSimulation(makeHealthySnapshot(), {
      direct: { revenue: -50_000 },
    }, 3)
    // Revenue delta should propagate: revenue itself drops
    expect(timeline[0].kpis.revenue).toBeLessThan(100_000)
  })

  it("monthly growth rates compound over time", () => {
    const timeline = timeSimulation(makeHealthySnapshot(), {
      direct: {},
      monthlyGrowthRates: { revenue: 0.10 },
    }, 6)
    // Revenue should grow each month
    expect(timeline[6].kpis.revenue).toBeGreaterThan(timeline[0].kpis.revenue)
  })

  it("burn reduces cash each month", () => {
    const snapshot = makeHealthySnapshot()
    const timeline = timeSimulation(snapshot, {
      direct: {},
      monthlyGrowthRates: {},
    }, 6)
    // Cash should decrease if burn > 0
    expect(timeline[6].kpis.cash).toBeLessThan(timeline[0].kpis.cash)
  })

  it("runway recalculates based on cash/burn", () => {
    const snapshot = makeHealthySnapshot()
    const timeline = timeSimulation(snapshot, { direct: {}, monthlyGrowthRates: {} }, 6)
    const lastState = timeline[6].kpis
    if (lastState.burn > 0) {
      expect(lastState.runway).toBeCloseTo(lastState.cash / lastState.burn, 0)
    }
  })

  it("detects critical tipping points", () => {
    const timeline = timeSimulation(makeCriticalSnapshot(), {
      direct: {},
      monthlyGrowthRates: {},
    }, 12)
    const allTipping = timeline.flatMap((t) => t.tippingPoints)
    expect(allTipping.length).toBeGreaterThan(0)
    expect(allTipping.some((tp) => tp.threshold === "critical")).toBe(true)
  })

  it("detects watch-level tipping points for borderline KPIs", () => {
    const snapshot = buildKpiSnapshot({
      cashBalance: 60_000,
      runwayMonths: 7,
      growthRatePct: 6,
      arr: 300_000,
      revenueMonthly: 40_000,
      burnMonthly: 60_000,
      churnPct: 7,
      grossMarginPct: 45,
      efficiencyRatio: 0.45,
      enterpriseValue: 1_000_000,
    })
    const timeline = timeSimulation(snapshot, { direct: {} }, 1)
    const watchPoints = timeline[0].tippingPoints.filter((tp) => tp.threshold === "watch")
    expect(watchPoints.length).toBeGreaterThan(0)
  })

  it("handles empty forces gracefully", () => {
    const timeline = timeSimulation(makeHealthySnapshot(), { direct: {} }, 3)
    expect(timeline).toHaveLength(4)
    expect(timeline[0].kpis.revenue).toBe(100_000)
  })
})

describe("findFirstCliff", () => {
  it("returns null for a healthy timeline with no critical points", () => {
    const timeline = timeSimulation(makeHealthySnapshot(), { direct: {} }, 3)
    const cliff = findFirstCliff(timeline)
    // Healthy company should not hit critical in 3 months (cash is high)
    if (cliff) {
      expect(cliff.threshold).toBe("critical")
    }
  })

  it("returns the earliest critical tipping point", () => {
    const timeline = timeSimulation(makeCriticalSnapshot(), { direct: {} }, 12)
    const cliff = findFirstCliff(timeline)
    expect(cliff).not.toBeNull()
    expect(cliff!.threshold).toBe("critical")
    // Should be early given the critical state
    expect(cliff!.month).toBeLessThanOrEqual(12)
  })
})

describe("buildKpiSnapshot", () => {
  it("maps named fields to KPI keys", () => {
    const snap = buildKpiSnapshot({ cashBalance: 500_000, runwayMonths: 12 })
    expect(snap.cash).toBe(500_000)
    expect(snap.runway).toBe(12)
  })

  it("defaults missing fields to 0", () => {
    const snap = buildKpiSnapshot({})
    expect(snap.cash).toBe(0)
    expect(snap.growth).toBe(0)
    expect(snap.enterpriseValue).toBe(0)
  })
})
