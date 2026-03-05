import { describe, it, expect } from "vitest"
import {
  KPI_KEYS,
  KPI_ZONE_MAP,
  HEALTH_ELEVATION,
  getHealthLevel,
  getHealthColor,
} from "@/domain/intelligence/kpiZoneMapping"
import type { PositionKpis } from "@/pages/position/overlays/positionState"

function makeKpis(overrides: Partial<PositionKpis> = {}): PositionKpis {
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
    ...overrides,
  }
}

describe("KPI_KEYS", () => {
  it("has exactly 12 KPIs", () => {
    expect(KPI_KEYS).toHaveLength(12)
  })

  it("contains all expected keys", () => {
    const expected = [
      "cash", "runway", "growth", "arr", "revenue", "burn",
      "churn", "grossMargin", "headcount", "nrr", "efficiency", "enterpriseValue",
    ]
    for (const k of expected) {
      expect(KPI_KEYS).toContain(k)
    }
  })
})

describe("KPI_ZONE_MAP", () => {
  it("maps every KPI key to a zone with label and stationName", () => {
    for (const key of KPI_KEYS) {
      expect(KPI_ZONE_MAP[key]).toBeDefined()
      expect(KPI_ZONE_MAP[key].label).toBeTruthy()
      expect(KPI_ZONE_MAP[key].stationName).toBeTruthy()
    }
  })

  it("zones cover the full 0-1 range without gaps", () => {
    const zones = KPI_KEYS.map((k) => KPI_ZONE_MAP[k])
    const sorted = [...zones].sort((a, b) => a.xStart - b.xStart)
    expect(sorted[0].xStart).toBe(0)
    expect(sorted[sorted.length - 1].xEnd).toBe(1)
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].xStart).toBeCloseTo(sorted[i - 1].xEnd, 5)
    }
  })

  it("no zones overlap", () => {
    const zones = KPI_KEYS.map((k) => KPI_ZONE_MAP[k])
    for (let i = 0; i < zones.length; i++) {
      for (let j = i + 1; j < zones.length; j++) {
        const overlap = zones[i].xStart < zones[j].xEnd && zones[j].xStart < zones[i].xEnd
        if (zones[i].xStart !== zones[j].xStart) {
          expect(overlap).toBe(false)
        }
      }
    }
  })
})

describe("HEALTH_ELEVATION", () => {
  it("has all four health levels", () => {
    expect(HEALTH_ELEVATION.strong).toBeDefined()
    expect(HEALTH_ELEVATION.healthy).toBeDefined()
    expect(HEALTH_ELEVATION.watch).toBeDefined()
    expect(HEALTH_ELEVATION.critical).toBeDefined()
  })

  it("strong > healthy > watch > critical", () => {
    expect(HEALTH_ELEVATION.strong).toBeGreaterThan(HEALTH_ELEVATION.healthy)
    expect(HEALTH_ELEVATION.healthy).toBeGreaterThan(HEALTH_ELEVATION.watch)
    expect(HEALTH_ELEVATION.watch).toBeGreaterThan(HEALTH_ELEVATION.critical)
  })
})

describe("getHealthLevel", () => {
  it("returns 'strong' for excellent cash", () => {
    expect(getHealthLevel("cash", makeKpis({ cashOnHand: 2_000_000 }))).toBe("strong")
  })

  it("returns 'critical' for very low cash", () => {
    expect(getHealthLevel("cash", makeKpis({ cashOnHand: 50_000 }))).toBe("critical")
  })

  it("returns 'critical' for low runway", () => {
    expect(getHealthLevel("runway", makeKpis({ runwayMonths: 3 }))).toBe("critical")
  })

  it("returns 'strong' for high runway", () => {
    expect(getHealthLevel("runway", makeKpis({ runwayMonths: 24 }))).toBe("strong")
  })

  it("returns 'critical' for high churn", () => {
    expect(getHealthLevel("churn", makeKpis({ churnPct: 15 }))).toBe("critical")
  })

  it("returns 'strong' for low churn", () => {
    expect(getHealthLevel("churn", makeKpis({ churnPct: 1 }))).toBe("strong")
  })

  it("returns 'critical' for high burn", () => {
    expect(getHealthLevel("burn", makeKpis({ burnMonthly: 250_000 }))).toBe("critical")
  })

  it("returns 'strong' for low burn", () => {
    expect(getHealthLevel("burn", makeKpis({ burnMonthly: 30_000 }))).toBe("strong")
  })

  it("returns 'critical' for low gross margin", () => {
    expect(getHealthLevel("grossMargin", makeKpis({ grossMarginPct: 20 }))).toBe("critical")
  })

  it("returns 'strong' for high gross margin", () => {
    expect(getHealthLevel("grossMargin", makeKpis({ grossMarginPct: 80 }))).toBe("strong")
  })

  it("returns 'critical' for low growth", () => {
    expect(getHealthLevel("growth", makeKpis({ growthRatePct: 1 }))).toBe("critical")
  })

  it("returns 'strong' for high growth", () => {
    expect(getHealthLevel("growth", makeKpis({ growthRatePct: 25 }))).toBe("strong")
  })
})

describe("getHealthColor", () => {
  it("returns RGB values between 0 and 1", () => {
    for (const level of ["critical", "watch", "healthy", "strong"] as const) {
      const color = getHealthColor(level)
      expect(color.r).toBeGreaterThanOrEqual(0)
      expect(color.r).toBeLessThanOrEqual(1)
      expect(color.g).toBeGreaterThanOrEqual(0)
      expect(color.g).toBeLessThanOrEqual(1)
      expect(color.b).toBeGreaterThanOrEqual(0)
      expect(color.b).toBeLessThanOrEqual(1)
    }
  })

  it("critical is red-ish", () => {
    const c = getHealthColor("critical")
    expect(c.r).toBeGreaterThan(c.g)
    expect(c.r).toBeGreaterThan(c.b)
  })

  it("strong is green-ish", () => {
    const c = getHealthColor("strong")
    expect(c.g).toBeGreaterThan(c.r)
  })
})
