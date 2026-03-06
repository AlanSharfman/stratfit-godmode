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
  cash:             { xStart: 0.00,              xEnd: 0.08333333333333333, label: "Liquidity Zone",     stationName: "Liquidity Basin" },
  runway:           { xStart: 0.08333333333333333, xEnd: 0.16666666666666666, label: "Runway Horizon",     stationName: "Horizon Shelf" },
  growth:           { xStart: 0.16666666666666666, xEnd: 0.25,              label: "Growth Gradient",    stationName: "Ascent Ridge" },
  arr:              { xStart: 0.25,              xEnd: 0.3333333333333333,  label: "Revenue Engine",     stationName: "Revenue Spine" },
  revenue:          { xStart: 0.3333333333333333, xEnd: 0.41666666666666663, label: "Revenue Flow",       stationName: "Flow Saddle" },
  burn:             { xStart: 0.41666666666666663, xEnd: 0.5,               label: "Burn Zone",          stationName: "Furnace Couloir" },
  churn:            { xStart: 0.5,               xEnd: 0.5833333333333334,  label: "Retention Wall",     stationName: "Retention Buttress" },
  grossMargin:      { xStart: 0.5833333333333334, xEnd: 0.6666666666666667, label: "Margin Ridge",       stationName: "Margin Arête" },
  headcount:        { xStart: 0.6666666666666667, xEnd: 0.75,               label: "Talent Basin",       stationName: "Talent Terrace" },
  nrr:              { xStart: 0.75,              xEnd: 0.8333333333333334,  label: "Expansion Ramp",     stationName: "Expansion Rampart" },
  efficiency:       { xStart: 0.8333333333333334, xEnd: 0.9166666666666667, label: "Efficiency Channel", stationName: "Efficiency Channel" },
  enterpriseValue:  { xStart: 0.9166666666666667, xEnd: 1.0,                label: "Value Summit",       stationName: "Summit Pinnacle" },
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
      const nrr = kpis.nrrPct ?? 0
      if (nrr < 80) return "critical"
      if (nrr < 95) return "watch"
      if (nrr < 110) return "healthy"
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
  nrr:             { hex: "#2dd4bf", r: 0.176, g: 0.831, b: 0.749 },   // reuse turquoise (retention/expansion)
  efficiency:      { hex: "#f59e0b", r: 0.961, g: 0.620, b: 0.043 },   // reuse amber (efficiency)
  enterpriseValue: { hex: "#1e7eaa", r: 0.118, g: 0.494, b: 0.667 },   // dark azure
}

/* ─────────────────────────────────────────────────────────────────
   PRIMARY / SECONDARY KPI HIERARCHY
   Single source of truth for Position UI display grouping.
   • Primary KPIs appear in the top bar and left rail as first-class cards.
   • Secondary KPIs are accessible via drilldown from their parent primary.
   To promote/demote a KPI, move its key between these two structures.
   ───────────────────────────────────────────────────────────────── */

export interface PrimaryKpiDef {
  key: KpiKey
  label: string
  secondaries: { key: KpiKey; label: string }[]
}

export const PRIMARY_KPI_HIERARCHY: PrimaryKpiDef[] = [
  { key: "cash",            label: "Liquidity",  secondaries: [] },
  { key: "runway",          label: "Runway",     secondaries: [] },
  { key: "growth",          label: "Growth",     secondaries: [{ key: "arr", label: "ARR" }] },
  { key: "revenue",         label: "Revenue",    secondaries: [{ key: "grossMargin", label: "Gross Margin" }] },
  { key: "burn",            label: "Burn",       secondaries: [{ key: "churn", label: "Retention" }, { key: "headcount", label: "Talent" }] },
  { key: "enterpriseValue", label: "Value",      secondaries: [] },
]

export const PRIMARY_KPI_KEYS: readonly KpiKey[] =
  PRIMARY_KPI_HIERARCHY.map(p => p.key)

export const SECONDARY_KPI_KEYS: readonly KpiKey[] =
  PRIMARY_KPI_HIERARCHY.flatMap(p => p.secondaries.map(s => s.key))

/**
 * Terrain anchor positions for the 6 primary KPIs.
 * cx = normalised X centre (0–1), spread = Gaussian sigma.
 * Used by terrain heightfield generation and KPI marker placement.
 */
export const PRIMARY_ANCHOR_POSITIONS = new Map<KpiKey, { cx: number; spread: number }>([
  ["cash",            { cx: 0.08, spread: 0.11 }],
  ["runway",          { cx: 0.25, spread: 0.11 }],
  ["growth",          { cx: 0.42, spread: 0.11 }],
  ["revenue",         { cx: 0.58, spread: 0.11 }],
  ["burn",            { cx: 0.75, spread: 0.11 }],
  ["enterpriseValue", { cx: 0.92, spread: 0.11 }],
])

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
  nrr:              "What if we improve net revenue retention (NRR) to 110%?",
  efficiency:       "What if we improve CAC efficiency and operating leverage by 20%?",
  enterpriseValue:  "How does a capital raise impact our enterprise value?",
}
