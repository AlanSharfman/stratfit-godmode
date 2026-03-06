/**
 * STRATFIT Scenario Intent Parser
 * Extracts structured intelligence from the extended WhatIfAnswer response.
 * Provides typed access to headline, terrain interpretation, time-horizon effects,
 * and impact chain for rendering across pages.
 */

import type { WhatIfAnswer, WhatIfKpiLabel } from "../types"

export interface ScenarioIntelligence {
  headline: string
  summary: string
  terrainInterpretation: string
  shortTermEffect: string
  longTermEffect: string
  impactChain: string[]
  affectedZones: AffectedZone[]
  riskFlags: string[]
  confidence: "low" | "medium" | "high"
  hasSimulationData: boolean
}

export interface AffectedZone {
  kpi: WhatIfKpiLabel
  direction: "up" | "down" | "flat"
  magnitude: "small" | "medium" | "large"
  terrainFeature: string
  description: string
}

export function parseScenarioIntent(answer: WhatIfAnswer): ScenarioIntelligence {
  const headline = answer.headline ?? answer.summary.split(".")[0] + "."
  const terrainInterpretation = answer.terrain_interpretation ?? deriveTerrainInterpretation(answer)
  const shortTermEffect = answer.short_term_effect ?? ""
  const longTermEffect = answer.long_term_effect ?? ""
  const impactChain = answer.impact_chain ?? []

  const affectedZones: AffectedZone[] = answer.kpi_impacts.map((imp) => ({
    kpi: imp.kpi,
    direction: imp.direction,
    magnitude: imp.magnitude ?? "medium",
    terrainFeature: imp.terrain_feature,
    description: buildZoneDescription(imp.kpi, imp.direction, imp.terrain_feature),
  }))

  const riskFlags: string[] = []
  for (const imp of answer.kpi_impacts) {
    if (imp.direction === "down" && imp.confidence === "high") {
      riskFlags.push(`${imp.kpi} faces downward pressure with high confidence`)
    }
    if (imp.terrain_feature === "valley" && imp.direction === "down") {
      riskFlags.push(`${imp.kpi} is deepening into critical valley territory`)
    }
  }

  const confidenceCounts = { high: 0, medium: 0, low: 0 }
  for (const imp of answer.kpi_impacts) {
    confidenceCounts[imp.confidence]++
  }
  const total = answer.kpi_impacts.length || 1
  const confidence: "low" | "medium" | "high" =
    confidenceCounts.high / total >= 0.6 ? "high"
    : confidenceCounts.low / total >= 0.5 ? "low"
    : "medium"

  const hasSimulationData = false

  return {
    headline,
    summary: answer.summary,
    terrainInterpretation,
    shortTermEffect,
    longTermEffect,
    impactChain,
    affectedZones,
    riskFlags,
    confidence,
    hasSimulationData,
  }
}

function deriveTerrainInterpretation(answer: WhatIfAnswer): string {
  const ups = answer.kpi_impacts.filter((i) => i.direction === "up")
  const downs = answer.kpi_impacts.filter((i) => i.direction === "down")

  const parts: string[] = []
  if (ups.length > 0) {
    const labels = ups.map((i) => i.kpi).join(", ")
    parts.push(`${labels} ${ups.length === 1 ? "rises" : "rise"} on the terrain`)
  }
  if (downs.length > 0) {
    const labels = downs.map((i) => i.kpi).join(", ")
    parts.push(`${labels} ${downs.length === 1 ? "deepens" : "deepen"} into lower elevation`)
  }

  return parts.length > 0
    ? `The mountain reshapes: ${parts.join(", while ")}.`
    : "The terrain remains structurally unchanged."
}

const TERRAIN_VERBS: Record<string, Record<string, string>> = {
  up: {
    peak: "strengthens toward a higher peak",
    ridge: "builds momentum along the ridge",
    plateau: "lifts from the plateau",
    basin: "begins draining the basin",
    valley: "starts recovering from the valley",
  },
  down: {
    peak: "retreats from the peak",
    ridge: "erodes the ridge",
    plateau: "sinks below the plateau",
    basin: "deepens the basin",
    valley: "deepens the valley further",
  },
  flat: {
    peak: "holds at the peak",
    ridge: "maintains the ridge",
    plateau: "remains on the plateau",
    basin: "stays trapped in the basin",
    valley: "stabilises in the valley",
  },
}

function buildZoneDescription(
  kpi: WhatIfKpiLabel,
  direction: "up" | "down" | "flat",
  feature: string,
): string {
  const verb = TERRAIN_VERBS[direction]?.[feature] ?? `moves ${direction}`
  return `${kpi} ${verb}`
}

export default parseScenarioIntent
