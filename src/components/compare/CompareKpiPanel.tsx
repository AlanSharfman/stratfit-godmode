import React from "react"
import { useScenarioSelection } from "@/hooks/useScenarioSelection"
import { formatKpis } from "@/logic/kpis/kpiTaxonomy"
import type { EngineResults } from "@/types/engine"

type Props = {
  engineResults: Record<string, EngineResults>
  baselineId: string
  scenarioId: string
}

export default function CompareKpiPanel({
  engineResults,
  baselineId,
  scenarioId,
}: Props) {
  const { kpis, divergence } = useScenarioSelection(
    engineResults,
    baselineId,
    scenarioId
  )

  if (!kpis || !divergence) return null

  const formatted = formatKpis(kpis)

  return (
    <div>
      {formatted.map((k) => (
        <div key={k.id}>
          <strong>{k.label}</strong>: {k.value} {k.unit ?? ""}
        </div>
      ))}

      <hr />

      <div>Survival Δ: {divergence.survivalDelta}</div>
      <div>Runway Δ: {divergence.runwayDelta}</div>
      <div>EV Δ: {divergence.enterpriseValueDelta}</div>
      <div>Burn Δ: {divergence.burnDelta}</div>
    </div>
  )
}
