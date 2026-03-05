import { describe, it, expect } from "vitest"
import { computeActionRecommendations, getKpiLabel } from "@/engine/sensitivityAnalysis"
import type { PositionKpis } from "@/pages/position/overlays/positionState"

function makeKpis(): PositionKpis {
  return {
    cashOnHand: 1_000_000,
    runwayMonths: 18,
    growthRatePct: 15,
    arr: 1_200_000,
    revenueMonthly: 100_000,
    burnMonthly: 55_000,
    churnPct: 3,
    grossMarginPct: 70,
    efficiencyRatio: 0.8,
    valuationEstimate: 5_000_000,
    ebitdaMonthly: 30_000,
    riskIndex: 0.25,
    survivalScore: 80,
  }
}

describe("computeActionRecommendations", () => {
  it("returns the requested number of recommendations", () => {
    const recs = computeActionRecommendations(makeKpis(), 5)
    expect(recs).toHaveLength(5)
  })

  it("recommendations are ranked 1 through N", () => {
    const recs = computeActionRecommendations(makeKpis(), 5)
    for (let i = 0; i < recs.length; i++) {
      expect(recs[i].rank).toBe(i + 1)
    }
  })

  it("each recommendation has required fields", () => {
    const recs = computeActionRecommendations(makeKpis(), 3)
    for (const rec of recs) {
      expect(rec.kpi).toBeTruthy()
      expect(rec.headline).toBeTruthy()
      expect(rec.impactDescription).toBeTruthy()
      expect(["low", "medium", "high"]).toContain(rec.difficulty)
      expect(["now", "30d", "90d"]).toContain(rec.horizon)
      expect(rec.effortScore).toBeGreaterThan(0)
      expect(rec.totalElevationGain).toBeGreaterThanOrEqual(0)
    }
  })

  it("affected zones reference valid KPIs", () => {
    const recs = computeActionRecommendations(makeKpis(), 5)
    for (const rec of recs) {
      for (const zone of rec.affectedZones) {
        expect(zone.kpi).toBeTruthy()
        expect(zone.label).toBeTruthy()
        expect(zone.elevationDelta).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it("returns fewer if topN exceeds node count", () => {
    const recs = computeActionRecommendations(makeKpis(), 20)
    expect(recs.length).toBeLessThanOrEqual(12)
  })
})

describe("getKpiLabel", () => {
  it("returns a human-readable label for each KPI", () => {
    expect(getKpiLabel("cash")).toBe("Cash Balance")
    expect(getKpiLabel("runway")).toBe("Runway")
    expect(getKpiLabel("enterpriseValue")).toBe("Enterprise Value")
  })
})
