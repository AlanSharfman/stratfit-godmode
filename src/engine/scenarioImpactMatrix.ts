/**
 * STRATFIT — Scenario KPI Impact Matrix
 *
 * Deterministic percentage-based KPI adjustments per scenario category.
 * These base forces ensure terrain changes remain consistent regardless
 * of whether the prompt is parsed by NLP, OpenAI, or template matching.
 *
 * Values are percentage deltas (e.g. +15 = +15% change to that KPI).
 * The simulation engine reads this matrix before terrain recalculation,
 * applying the percentages against the current baseline KPI values to
 * produce absolute force vectors.
 */

import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import type { ScenarioCategory } from "./scenarioTemplates"
import type { PositionKpis } from "@/pages/position/overlays/positionState"

export interface CategoryImpact {
  /** Percentage deltas per KPI (e.g. +15 means +15% of baseline value) */
  deltas: Partial<Record<KpiKey, number>>
  description: string
}

export const SCENARIO_IMPACT_MATRIX: Record<ScenarioCategory, CategoryImpact> = {
  hiring: {
    deltas: {
      burn: 15,
      cash: -8,
      runway: -5,
      growth: 12,
      revenue: 5,
      enterpriseValue: 10,
    },
    description: "Team expansion increases burn and pressures liquidity short-term, but drives growth momentum and revenue capacity",
  },

  pricing: {
    deltas: {
      revenue: 12,
      growth: 6,
      enterpriseValue: 9,
      churn: 4,
    },
    description: "Pricing adjustments lift revenue and enterprise value, but introduce churn risk from price-sensitive customers",
  },

  capital: {
    deltas: {
      cash: 20,
      runway: 25,
    },
    description: "Capital injection strengthens liquidity and extends runway, stabilising the terrain foundation",
  },

  growth: {
    deltas: {
      burn: 10,
      growth: 14,
      revenue: 12,
      enterpriseValue: 15,
    },
    description: "Growth initiatives increase burn but drive strong growth, revenue, and enterprise value momentum",
  },

  efficiency: {
    deltas: {
      burn: -20,
      cash: 12,
      runway: 15,
      growth: -4,
    },
    description: "Efficiency optimisation reduces burn and strengthens liquidity, with modest growth deceleration",
  },

  market: {
    deltas: {
      burn: 5,
      growth: 8,
      revenue: 6,
      enterpriseValue: 7,
    },
    description: "Market-level scenario with balanced impact across burn, growth, and revenue",
  },

  risk: {
    deltas: {
      revenue: -15,
      growth: -12,
      cash: -10,
      enterpriseValue: -18,
    },
    description: "Risk scenarios pressure revenue and growth, erode liquidity, and weaken enterprise value",
  },
}

const KPI_TO_BASELINE: Record<string, keyof PositionKpis> = {
  cash: "cashOnHand",
  runway: "runwayMonths",
  growth: "growthRatePct",
  arr: "arr",
  revenue: "revenueMonthly",
  burn: "burnMonthly",
  churn: "churnPct",
  grossMargin: "grossMarginPct",
  headcount: "headcount",
  enterpriseValue: "valuationEstimate",
}

/**
 * Returns the raw percentage deltas for a scenario category.
 */
export function getImpactDeltas(
  category: ScenarioCategory,
): Partial<Record<KpiKey, number>> {
  return { ...SCENARIO_IMPACT_MATRIX[category].deltas }
}

/**
 * Converts percentage deltas into absolute force values using baseline KPIs.
 * E.g. burn +15 with baseline burn of $100K → force of +$15K.
 */
export function getImpactForces(
  category: ScenarioCategory,
  kpis: PositionKpis | null,
  scale: number = 1,
): Partial<Record<KpiKey, number>> {
  const impact = SCENARIO_IMPACT_MATRIX[category]
  if (!impact) return {}

  const forces: Partial<Record<KpiKey, number>> = {}

  for (const [k, pct] of Object.entries(impact.deltas) as [KpiKey, number][]) {
    const baselineKey = KPI_TO_BASELINE[k]
    const baseVal = baselineKey && kpis ? (kpis[baselineKey] as number) : 0

    if (baseVal !== 0) {
      forces[k] = Math.round((baseVal * pct * scale) / 100)
    } else {
      forces[k] = Math.round(pct * scale)
    }
  }

  return forces
}

/**
 * Merges category base forces (resolved against baseline) with
 * scenario-specific overrides. Specific forces take priority.
 */
export function mergeWithMatrixForces(
  category: ScenarioCategory,
  specificForces: Partial<Record<KpiKey, number>>,
  kpis?: PositionKpis | null,
): Partial<Record<KpiKey, number>> {
  const base = getImpactForces(category, kpis ?? null)
  return { ...base, ...specificForces }
}
