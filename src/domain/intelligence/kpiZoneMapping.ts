// src/domain/intelligence/kpiZoneMapping.ts
// Maps KPI keys to terrain zones (normalized X ranges) and health color logic.
// 10 KPIs — evenly distributed across the terrain X-axis.

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
  | "efficiency"
  | "enterpriseValue"

/** Ordered array of all 10 KPI keys — defines terrain zone order left → right */
export const KPI_KEYS: readonly KpiKey[] = [
  "cash", "runway", "growth", "arr", "revenue",
  "burn", "churn", "grossMargin", "efficiency", "enterpriseValue",
] as const

export type HealthLevel = "critical" | "watch" | "healthy" | "strong"

export interface ZoneDef {
  xStart: number
  xEnd: number
  label: string
}

export const KPI_ZONE_MAP: Record<KpiKey, ZoneDef> = {
  cash:             { xStart: 0.00, xEnd: 0.10, label: "Liquidity Zone" },
  runway:           { xStart: 0.10, xEnd: 0.20, label: "Runway Horizon" },
  growth:           { xStart: 0.20, xEnd: 0.30, label: "Growth Gradient" },
  arr:              { xStart: 0.30, xEnd: 0.40, label: "Revenue Engine" },
  revenue:          { xStart: 0.40, xEnd: 0.50, label: "Revenue Flow" },
  burn:             { xStart: 0.50, xEnd: 0.60, label: "Burn Zone" },
  churn:            { xStart: 0.60, xEnd: 0.70, label: "Retention Wall" },
  grossMargin:      { xStart: 0.70, xEnd: 0.80, label: "Margin Ridge" },
  efficiency:       { xStart: 0.80, xEnd: 0.90, label: "Leverage Plateau" },
  enterpriseValue:  { xStart: 0.90, xEnd: 1.00, label: "Value Summit" },
}

/** Height multiplier per health level — drives progressive terrain elevation */
export const HEALTH_ELEVATION: Record<HealthLevel, number> = {
  strong:   1.0,
  healthy:  0.72,
  watch:    0.42,
  critical: 0.15,
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

export const KPI_STRESS_PROMPTS: Record<KpiKey, string> = {
  cash:             "What happens if we raise additional capital?",
  runway:           "Can we extend runway to 18+ months without dilution?",
  growth:           "What if we accelerate growth rate to 15% month-over-month?",
  arr:              "What if we accelerate revenue growth to 12% monthly?",
  revenue:          "What happens if we increase pricing by 15%?",
  burn:             "Can we reduce burn by 20% without impacting growth?",
  churn:            "What if we reduce churn rate to below 2% monthly?",
  grossMargin:      "What if we improve gross margin to 75%?",
  efficiency:       "What if we improve revenue-per-employee by 40%?",
  enterpriseValue:  "How does a capital raise impact our enterprise value?",
}
