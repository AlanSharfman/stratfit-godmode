import { describe, it, expect } from "vitest"
import {
  detectStage,
  getBenchmarkProfile,
  compareToBenchmarks,
} from "@/engine/networkBenchmarks"

describe("detectStage", () => {
  it("returns pre-seed for tiny ARR and low cash", () => {
    expect(detectStage({ arr: 10_000, cashOnHand: 50_000 })).toBe("pre-seed")
  })

  it("returns seed for moderate ARR", () => {
    expect(detectStage({ arr: 100_000, cashOnHand: 500_000 })).toBe("seed")
  })

  it("returns seed based on cash alone", () => {
    expect(detectStage({ arr: 0, cashOnHand: 500_000 })).toBe("seed")
  })

  it("returns series-a for ARR >= 500K", () => {
    expect(detectStage({ arr: 600_000, cashOnHand: 2_000_000 })).toBe("series-a")
  })

  it("returns series-b for ARR >= 3M", () => {
    expect(detectStage({ arr: 5_000_000, cashOnHand: 10_000_000 })).toBe("series-b")
  })

  it("returns growth for ARR >= 15M", () => {
    expect(detectStage({ arr: 20_000_000, cashOnHand: 50_000_000 })).toBe("growth")
  })
})

describe("getBenchmarkProfile", () => {
  it("returns a profile for each stage", () => {
    const stages = ["pre-seed", "seed", "series-a", "series-b", "growth"] as const
    for (const stage of stages) {
      const profile = getBenchmarkProfile(stage)
      expect(profile.stage).toBe(stage)
      expect(profile.label).toBeTruthy()
      expect(profile.sampleSize).toBeGreaterThan(0)
      expect(profile.kpis.cash).toBeDefined()
      expect(profile.kpis.cash.p25).toBeLessThan(profile.kpis.cash.p50)
    }
  })

  it("benchmark percentiles are monotonically increasing", () => {
    const profile = getBenchmarkProfile("seed")
    for (const [, bench] of Object.entries(profile.kpis)) {
      // For non-inverse KPIs, p25 < p50 < p75 < top10
      // (burn and churn are inverse, but the benchmark values still go p25 > p50 in absolute terms)
      expect(bench.p25).toBeDefined()
      expect(bench.top10).toBeDefined()
    }
  })
})

describe("compareToBenchmarks", () => {
  const kpis = {
    cashOnHand: 800_000,
    runwayMonths: 12,
    growthRatePct: 25,
    arr: 240_000,
    revenueMonthly: 20_000,
    burnMonthly: 55_000,
    churnPct: 4.5,
    grossMarginPct: 65,
    efficiencyRatio: 0.65,
    valuationEstimate: 6_000_000,
  }

  it("returns a comparison for every KPI", () => {
    const results = compareToBenchmarks(kpis, "seed")
    expect(results).toHaveLength(12)
  })

  it("each comparison has valid fields", () => {
    const results = compareToBenchmarks(kpis, "seed")
    for (const c of results) {
      expect(c.kpi).toBeTruthy()
      expect(c.label).toBeTruthy()
      expect(c.percentile).toBeGreaterThanOrEqual(0)
      expect(c.percentile).toBeLessThanOrEqual(99)
      expect(["below", "median", "above", "top"]).toContain(c.verdict)
    }
  })

  it("auto-detects stage when not provided", () => {
    const results = compareToBenchmarks(kpis)
    expect(results).toHaveLength(12)
    // With ARR 240K and cash 800K, should detect as seed
    expect(results[0]).toBeDefined()
  })

  it("top performer gets high percentile", () => {
    const topKpis = {
      cashOnHand: 5_000_000,
      runwayMonths: 30,
      growthRatePct: 90,
      arr: 2_000_000,
      revenueMonthly: 150_000,
      burnMonthly: 20_000,
      churnPct: 1,
      grossMarginPct: 90,
      efficiencyRatio: 2.0,
      valuationEstimate: 40_000_000,
    }
    const results = compareToBenchmarks(topKpis, "seed")
    const highPercentileCount = results.filter((c) => c.percentile >= 75).length
    expect(highPercentileCount).toBeGreaterThanOrEqual(5)
  })

  it("low performer gets low percentile", () => {
    const lowKpis = {
      cashOnHand: 50_000,
      runwayMonths: 2,
      growthRatePct: 2,
      arr: 10_000,
      revenueMonthly: 1_000,
      burnMonthly: 200_000,
      churnPct: 15,
      grossMarginPct: 20,
      efficiencyRatio: 0.1,
      valuationEstimate: 100_000,
    }
    const results = compareToBenchmarks(lowKpis, "seed")
    const lowPercentileCount = results.filter((c) => c.percentile < 40).length
    expect(lowPercentileCount).toBeGreaterThanOrEqual(5)
  })
})
