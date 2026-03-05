import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_KEYS, KPI_ZONE_MAP, HEALTH_ELEVATION, getHealthLevel } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_GRAPH, propagateForce, computeSensitivity } from "./kpiDependencyGraph"
import type { PositionKpis } from "@/pages/position/overlays/positionState"

export interface ActionRecommendation {
  rank: number
  kpi: KpiKey
  headline: string
  impactDescription: string
  affectedZones: { kpi: KpiKey; label: string; elevationDelta: number }[]
  totalElevationGain: number
  difficulty: "low" | "medium" | "high"
  horizon: "now" | "30d" | "90d"
  effortScore: number
}

const KPI_LABELS: Record<KpiKey, string> = {
  cash: "Cash Balance",
  runway: "Runway",
  growth: "Growth Rate",
  arr: "ARR",
  revenue: "Revenue",
  burn: "Burn Rate",
  churn: "Churn Rate",
  grossMargin: "Gross Margin",
  efficiency: "Operational Efficiency",
  enterpriseValue: "Enterprise Value",
}

const IMPROVEMENT_HEADLINES: Record<KpiKey, string> = {
  cash: "Increase cash reserves",
  runway: "Extend runway",
  growth: "Accelerate growth rate",
  arr: "Grow annual recurring revenue",
  revenue: "Boost monthly revenue",
  burn: "Reduce monthly burn",
  churn: "Reduce customer churn",
  grossMargin: "Improve gross margin",
  efficiency: "Increase operational efficiency",
  enterpriseValue: "Grow enterprise value",
}

const DIFFICULTY_MAP: Record<KpiKey, "low" | "medium" | "high"> = {
  churn: "medium",
  growth: "high",
  burn: "low",
  grossMargin: "medium",
  revenue: "high",
  cash: "medium",
  runway: "low",
  arr: "high",
  efficiency: "medium",
  enterpriseValue: "high",
}

const HORIZON_MAP: Record<KpiKey, "now" | "30d" | "90d"> = {
  burn: "now",
  runway: "now",
  cash: "now",
  efficiency: "30d",
  churn: "30d",
  grossMargin: "30d",
  revenue: "90d",
  growth: "90d",
  arr: "90d",
  enterpriseValue: "90d",
}

const EFFORT_MAP: Record<KpiKey, number> = {
  burn: 2,
  runway: 2,
  efficiency: 4,
  cash: 5,
  churn: 6,
  grossMargin: 5,
  revenue: 7,
  growth: 8,
  arr: 8,
  enterpriseValue: 9,
}

/**
 * Compute ranked action recommendations based on sensitivity analysis.
 * Returns top N actions sorted by terrain impact.
 */
export function computeActionRecommendations(
  kpis: PositionKpis,
  topN = 5,
): ActionRecommendation[] {
  const sensitivity = computeSensitivity(KPI_GRAPH)
  const results: ActionRecommendation[] = []

  for (const entry of sensitivity.slice(0, topN)) {
    const { affected } = propagateForce(KPI_GRAPH, entry.kpi, 0.10)
    const affectedZones: ActionRecommendation["affectedZones"] = []

    for (const [key, delta] of affected) {
      if (key === entry.kpi) continue
      const zone = KPI_ZONE_MAP[key]
      affectedZones.push({
        kpi: key,
        label: zone.label,
        elevationDelta: Math.round(Math.abs(delta) * 100),
      })
    }
    affectedZones.sort((a, b) => b.elevationDelta - a.elevationDelta)

    const avgElevation = affectedZones.length > 0
      ? Math.round(affectedZones.reduce((sum, z) => sum + z.elevationDelta, 0) / affectedZones.length)
      : 0

    results.push({
      rank: results.length + 1,
      kpi: entry.kpi,
      headline: IMPROVEMENT_HEADLINES[entry.kpi],
      impactDescription: `Impacts ${entry.affectedCount} connected zone${entry.affectedCount !== 1 ? "s" : ""}, +${avgElevation}% average elevation`,
      affectedZones,
      totalElevationGain: Math.round(entry.totalImpact * 100),
      difficulty: DIFFICULTY_MAP[entry.kpi],
      horizon: HORIZON_MAP[entry.kpi],
      effortScore: EFFORT_MAP[entry.kpi],
    })
  }

  return results
}

/**
 * Get the KPI label.
 */
export function getKpiLabel(kpi: KpiKey): string {
  return KPI_LABELS[kpi]
}
