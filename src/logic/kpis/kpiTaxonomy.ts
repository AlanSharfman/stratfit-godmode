import { ScenarioKpis } from "@/types/engine"

export type FormattedKpi = {
  id: string
  label: string
  value: number | string
  unit?: string
}

export function formatKpis(kpis: ScenarioKpis): FormattedKpi[] {
  if (!kpis) return []

  return [
    { id: "survival", label: "Survival Probability", value: kpis.survivalProbability, unit: "%" },
    { id: "runway", label: "Runway", value: kpis.runwayMonths, unit: "months" },
    { id: "ev", label: "Enterprise Value", value: kpis.enterpriseValue },
    { id: "burn", label: "Net Burn", value: kpis.netBurn },
  ]
}
