// src/domain/intelligence/kpiZoneMapping.ts
// Maps KPI keys to Terrain Stations — named geographic positions on the
// mountain that correspond 1-to-1 with KPI boxes.  Each station's
// elevation reflects the health of its associated KPI.
// 12 KPIs — evenly distributed across the terrain X-axis.

import type { PositionKpis } from "@/pages/position/overlays/positionState"

export type KpiKey =
  | "cash"
  | "runway"
  | "growth"
  | "arr"
  | "revenue"
  | "burn"
  | "churn"
  | "grossMargin"
  | "headcount"
  | "nrr"
  | "efficiency"
  | "enterpriseValue"

/** Ordered array of all 12 KPI keys — defines terrain zone order left → right */
export const KPI_KEYS: readonly KpiKey[] = [
  "cash", "runway", "growth", "arr", "revenue", "burn",
  "churn", "grossMargin", "headcount", "nrr", "efficiency", "enterpriseValue",
] as const

export type HealthLevel = "critical" | "watch" | "healthy" | "strong"

export interface ZoneDef {
  xStart: number
  xEnd: number
  /** Display label for the zone (used in legends / overlays) */
  label: string
  /**
   * Geographic station name — the named feature on the mountain
   * that links back to the corresponding KPI box.
   */
  stationName: string
}

export const KPI_ZONE_MAP: Record<KpiKey, ZoneDef> = {
  cash:             { xStart: 0.000, xEnd: 0.083, label: "Liquidity Zone",    stationName: "Liquidity Basin" },
  runway:           { xStart: 0.083, xEnd: 0.167, label: "Runway Horizon",    stationName: "Horizon Shelf" },
  growth:           { xStart: 0.167, xEnd: 0.250, label: "Growth Gradient",   stationName: "Ascent Ridge" },
  arr:              { xStart: 0.250, xEnd: 0.333, label: "Revenue Engine",    stationName: "Revenue Spine" },
  revenue:          { xStart: 0.333, xEnd: 0.417, label: "Revenue Flow",      stationName: "Flow Saddle" },
  burn:             { xStart: 0.417, xEnd: 0.500, label: "Burn Zone",         stationName: "Furnace Couloir" },
  churn:            { xStart: 0.500, xEnd: 0.583, label: "Retention Wall",    stationName: "Retention Buttress" },
  grossMargin:      { xStart: 0.583, xEnd: 0.667, label: "Margin Ridge",      stationName: "Margin Arête" },
  headcount:        { xStart: 0.667, xEnd: 0.750, label: "Talent Basin",      stationName: "Talent Terrace" },
  nrr:              { xStart: 0.750, xEnd: 0.833, label: "Expansion Ridge",   stationName: "Expansion Spur" },
  efficiency:       { xStart: 0.833, xEnd: 0.917, label: "Leverage Plateau",  stationName: "Efficiency Col" },
  enterpriseValue:  { xStart: 0.917, xEnd: 1.000, label: "Value Summit",      stationName: "Summit Pinnacle" },
}

/** Height multiplier per health level — drives progressive terrain elevation.
    Negative values create valleys/troughs for weak KPIs. */
export const HEALTH_ELEVATION: Record<HealthLevel, number> = {
  strong:   1.0,
  healthy:  0.55,
  watch:   -0.15,
  critical:-0.55,
}

export function getHealthLevel(key: KpiKey, kpis: PositionKpis): HealthLevel {
  switch (key) {
    case "cash":
      if (kpis.cashOnHand < 200_000) return "critical"
      if (kpis.cashOnHand < 500_000) return "watch"
      if (kpis.cashOnHand < 1_500_000) return "healthy"
      return "strong"
    case "runway":
      if (kpis.runwayMonths < 6) return "critical"
      if (kpis.runwayMonths < 12) return "watch"
      if (kpis.runwayMonths < 18) return "healthy"
      return "strong"
    case "growth": {
      const gr = kpis.growthRatePct ?? 0
      if (gr < 2) return "critical"
      if (gr < 8) return "watch"
      if (gr < 20) return "healthy"
      return "strong"
    }
    case "arr":
      if (kpis.arr < 500_000) return "watch"
      if (kpis.arr < 2_000_000) return "healthy"
      return "strong"
    case "revenue":
      if (kpis.revenueMonthly < 30_000) return "critical"
      if (kpis.revenueMonthly < 80_000) return "watch"
      return "healthy"
    case "burn":
      if (kpis.burnMonthly > 200_000) return "critical"
      if (kpis.burnMonthly > 100_000) return "watch"
      if (kpis.burnMonthly > 50_000) return "healthy"
      return "strong"
    case "churn": {
      const ch = kpis.churnPct ?? 0
      if (ch > 10) return "critical"
      if (ch > 5) return "watch"
      if (ch > 2) return "healthy"
      return "strong"
    }
    case "grossMargin":
      if (kpis.grossMarginPct < 30) return "critical"
      if (kpis.grossMarginPct < 50) return "watch"
      if (kpis.grossMarginPct < 70) return "healthy"
      return "strong"
    case "headcount": {
      const hc = kpis.headcount ?? 0
      if (hc < 3) return "critical"
      if (hc < 10) return "watch"
      if (hc < 50) return "healthy"
      return "strong"
    }
    case "nrr": {
      const n = kpis.nrrPct ?? 100
      if (n < 80) return "critical"
      if (n < 100) return "watch"
      if (n < 120) return "healthy"
      return "strong"
    }
    case "efficiency": {
      const eff = kpis.efficiencyRatio ?? 0
      if (eff < 0.3) return "critical"
      if (eff < 0.6) return "watch"
      if (eff < 1.0) return "healthy"
      return "strong"
    }
    case "enterpriseValue":
      if (kpis.valuationEstimate < 1_000_000) return "watch"
      if (kpis.valuationEstimate < 5_000_000) return "healthy"
      return "strong"
    default:
      return "healthy"
  }
}

export interface HealthColor {
  r: number
  g: number
  b: number
}

const HEALTH_COLORS: Record<HealthLevel, HealthColor> = {
  critical: { r: 0.90, g: 0.12, b: 0.10 },
  watch:    { r: 0.92, g: 0.65, b: 0.10 },
  healthy:  { r: 0.13, g: 0.83, b: 0.93 },
  strong:   { r: 0.20, g: 0.83, b: 0.60 },
}

export function getHealthColor(level: HealthLevel): HealthColor {
  return HEALTH_COLORS[level]
}

/**
 * Per-KPI colour identity — drives terrain marker inner glow, zone label pills,
 * KPI card active accent, and any reporting highlights.
 * Each KPI has a unique colour for instant visual recognition.
 */
export const KPI_CATEGORY_COLORS: Record<KpiKey, { hex: string; r: number; g: number; b: number }> = {
  cash:            { hex: "#34d399", r: 0.204, g: 0.827, b: 0.600 },   // emerald (liquidity as-is)
  runway:          { hex: "#3b82f6", r: 0.231, g: 0.510, b: 0.965 },   // blue
  growth:          { hex: "#f0f0f0", r: 0.941, g: 0.941, b: 0.941 },   // white
  arr:             { hex: "#f59e0b", r: 0.961, g: 0.620, b: 0.043 },   // amber
  revenue:         { hex: "#eab308", r: 0.918, g: 0.702, b: 0.031 },   // yellow
  burn:            { hex: "#a855f7", r: 0.659, g: 0.333, b: 0.969 },   // purple
  churn:           { hex: "#2dd4bf", r: 0.176, g: 0.831, b: 0.749 },   // turquoise
  grossMargin:     { hex: "#22d3ee", r: 0.133, g: 0.827, b: 0.933 },   // cyan
  headcount:       { hex: "#7dd3fc", r: 0.490, g: 0.827, b: 0.988 },   // light blue
  nrr:             { hex: "#c0c0c0", r: 0.753, g: 0.753, b: 0.753 },   // silver
  efficiency:      { hex: "#c4a882", r: 0.769, g: 0.659, b: 0.510 },   // light brown
  enterpriseValue: { hex: "#1e7eaa", r: 0.118, g: 0.494, b: 0.667 },   // dark azure
}

export const KPI_STRESS_PROMPTS: Record<KpiKey, string> = {
  cash:             "What happens if we raise additional capital?",
  runway:           "Can we extend runway to 18+ months without dilution?",
  growth:           "What if we accelerate growth rate to 15% month-over-month?",
  arr:              "What if we accelerate revenue growth to 12% monthly?",
  revenue:          "What happens if we increase pricing by 15%?",
  burn:             "Can we reduce burn by 20% without impacting growth?",
  churn:            "What if we reduce churn rate to below 2% monthly?",
  grossMargin:      "What if we improve gross margin to 75%?",
  headcount:        "What if we hire 5 more people this quarter?",
  nrr:              "What if net revenue retention reaches 120%?",
  efficiency:       "What if we improve revenue-per-employee by 40%?",
  enterpriseValue:  "How does a capital raise impact our enterprise value?",
}
