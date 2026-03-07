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

// Primary KPIs own one sixth each (0→1), evenly covering the full terrain width.
// Secondary KPIs are nested inside their parent's sixth so the heightfield
// generation and marker placement both align to the same grid.
export const KPI_ZONE_MAP: Record<KpiKey, ZoneDef> = {
  // ── Primary: sixth 1 ── cash / Liquidity (0.000 → 0.167)
  cash:             { xStart: 0.000, xEnd: 0.167, label: "Liquidity Zone",     stationName: "Liquidity Basin" },
  // ── Primary: sixth 2 ── runway (0.167 → 0.333)
  runway:           { xStart: 0.167, xEnd: 0.333, label: "Runway Horizon",     stationName: "Horizon Shelf" },
  // ── Primary: sixth 3 ── growth (0.333 → 0.500)
  growth:           { xStart: 0.333, xEnd: 0.500, label: "Growth Gradient",    stationName: "Ascent Ridge" },
  // ── Primary: sixth 4 ── revenue (0.500 → 0.667)
  revenue:          { xStart: 0.500, xEnd: 0.667, label: "Revenue Flow",       stationName: "Flow Saddle" },
  // ── Primary: sixth 5 ── burn (0.667 → 0.833)
  burn:             { xStart: 0.667, xEnd: 0.833, label: "Burn Zone",          stationName: "Furnace Couloir" },
  // ── Primary: sixth 6 ── enterpriseValue (0.833 → 1.000)
  enterpriseValue:  { xStart: 0.833, xEnd: 1.000, label: "Value Summit",       stationName: "Summit Pinnacle" },

  // ── Secondaries nested inside their parent's sixth ──
  arr:              { xStart: 0.333, xEnd: 0.417, label: "Revenue Engine",     stationName: "Revenue Spine" },
  churn:            { xStart: 0.667, xEnd: 0.722, label: "Retention Wall",     stationName: "Retention Buttress" },
  grossMargin:      { xStart: 0.500, xEnd: 0.583, label: "Margin Ridge",       stationName: "Margin Arête" },
  headcount:        { xStart: 0.722, xEnd: 0.778, label: "Talent Basin",       stationName: "Talent Terrace" },
  nrr:              { xStart: 0.583, xEnd: 0.625, label: "Expansion Ramp",     stationName: "Expansion Rampart" },
  efficiency:       { xStart: 0.778, xEnd: 0.833, label: "Efficiency Channel", stationName: "Efficiency Channel" },
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
  cash:            { hex: "#34D399", r: 0.204, g: 0.827, b: 0.600 },   // emerald — Liquidity
  runway:          { hex: "#F59E0B", r: 0.961, g: 0.620, b: 0.043 },   // amber — Runway (NOT blue)
  growth:          { hex: "#F0F0F0", r: 0.941, g: 0.941, b: 0.941 },   // white — Growth
  arr:             { hex: "#F59E0B", r: 0.961, g: 0.620, b: 0.043 },   // amber — ARR
  revenue:         { hex: "#FBBF24", r: 0.984, g: 0.749, b: 0.141 },   // gold — Revenue
  burn:            { hex: "#EF4444", r: 0.937, g: 0.267, b: 0.267 },   // red — Burn (NOT purple)
  churn:           { hex: "#F87171", r: 0.973, g: 0.443, b: 0.443 },   // light red — Churn/Retention
  grossMargin:     { hex: "#22D3EE", r: 0.133, g: 0.827, b: 0.933 },   // cyan — Gross Margin
  headcount:       { hex: "#7DD3FC", r: 0.490, g: 0.827, b: 0.988 },   // light blue — Headcount/Talent
  nrr:             { hex: "#2DD4BF", r: 0.176, g: 0.831, b: 0.749 },   // turquoise — NRR
  efficiency:      { hex: "#F59E0B", r: 0.961, g: 0.620, b: 0.043 },   // amber — Efficiency
  enterpriseValue: { hex: "#22D3EE", r: 0.133, g: 0.827, b: 0.933 },   // cyan — Value (NOT dark azure)
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
// cx = centre of each primary's sixth: 0.083, 0.250, 0.417, 0.583, 0.750, 0.917
export const PRIMARY_ANCHOR_POSITIONS = new Map<KpiKey, { cx: number; spread: number }>([
  ["cash",            { cx: 0.083, spread: 0.14 }],
  ["runway",          { cx: 0.250, spread: 0.14 }],
  ["growth",          { cx: 0.417, spread: 0.14 }],
  ["revenue",         { cx: 0.583, spread: 0.14 }],
  ["burn",            { cx: 0.750, spread: 0.14 }],
  ["enterpriseValue", { cx: 0.917, spread: 0.14 }],
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
