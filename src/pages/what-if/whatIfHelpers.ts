import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_ZONE_MAP } from "@/domain/intelligence/kpiZoneMapping"
import type { ScenarioTemplate } from "@/engine/scenarioTemplates"

export interface StackedScenario {
  id: string
  question: string
  template: ScenarioTemplate
  forces: Partial<Record<KpiKey, number>>
}

export const KPI_LABELS: Record<KpiKey, string> = {
  cash: "Cash", runway: "Runway", growth: "Growth", arr: "ARR",
  revenue: "Revenue", burn: "Burn", churn: "Churn",
  grossMargin: "Margin", headcount: "Team", nrr: "NRR", efficiency: "Efficiency", enterpriseValue: "EV",
}

export function formatDelta(kpi: KpiKey, v: number): string {
  const abs = Math.abs(v)
  if (["cash", "revenue", "burn", "arr", "enterpriseValue"].includes(kpi)) {
    if (abs >= 1e6) return `${v > 0 ? "+" : "-"}$${(abs / 1e6).toFixed(1)}M`
    if (abs >= 1e3) return `${v > 0 ? "+" : "-"}$${(abs / 1e3).toFixed(0)}K`
    return `${v > 0 ? "+" : "-"}$${abs.toFixed(0)}`
  }
  if (["churn", "growth", "grossMargin"].includes(kpi)) return `${v > 0 ? "+" : ""}${v.toFixed(1)}%`
  if (kpi === "headcount") return `${v > 0 ? "+" : ""}${Math.round(v)}`
  if (kpi === "runway") return `${v > 0 ? "+" : ""}${v.toFixed(1)} mo`
  return `${v > 0 ? "+" : ""}${v}`
}

export function buildNarrative(template: ScenarioTemplate, propagated: Map<KpiKey, number>): string {
  const top = Array.from(propagated.entries())
    .filter(([k]) => !Object.keys(template.forces).includes(k))
    .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
    .slice(0, 4)
  if (top.length === 0) return `"${template.question}" — direct impact only, no downstream cascade detected.`
  const parts = top.map(([k, d]) => `${KPI_ZONE_MAP[k].label} ${d > 0 ? "rises" : "falls"}`)
  return `"${template.question}" ripples through the mountain: ${parts.join(", ")}. The terrain is reshaping to show the cascading reality.`
}
