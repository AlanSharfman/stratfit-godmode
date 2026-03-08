/**
 * STRATFIT — Fallback Response Layer
 *
 * Generates safe, structured fallback explanations when the AI
 * response fails, is invalid, or when the pre-AI gate blocks
 * the call. Preferable to showing bad AI text.
 */

import type { SimulationResult } from "./runScenarioSimulation"

export interface FallbackExplanation {
  headline: string
  summary: string
  terrainInterpretation: string
  assumptions: string[]
  confidence: string
  disclaimer: string
}

const TERRAIN_LANGUAGE: Record<string, string> = {
  cash: "liquidity valley",
  runway: "terrain stability",
  growth: "growth ridge",
  revenue: "revenue slope",
  burn: "erosion pressure",
  enterpriseValue: "value summit",
  arr: "revenue ridge",
  churn: "retention basin",
  grossMargin: "margin plateau",
  headcount: "operational capacity",
}

export function buildFallbackExplanation(
  result: SimulationResult,
  reasons?: string[],
): FallbackExplanation {
  if (result.blocked) {
    return {
      headline: "Scenario simulation paused",
      summary: result.blockReason ?? result.validation.reason,
      terrainInterpretation: "Terrain remains unchanged — no valid scenario parameters detected.",
      assumptions: [],
      confidence: "Low — scenario did not pass validation.",
      disclaimer: "Directional strategic guidance only. Not financial, legal, or investment advice.",
    }
  }

  const affectedKpis = Array.from(result.propagation.affected.entries())
  const terrainEffects = affectedKpis
    .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
    .slice(0, 4)
    .map(([kpi, delta]) => {
      const feature = TERRAIN_LANGUAGE[kpi] ?? kpi
      const direction = delta > 0 ? "strengthens" : "weakens"
      return `The ${feature} ${direction}.`
    })

  const headline = result.scenarioObject.action !== "General scenario"
    ? `${result.scenarioObject.action} — simulation complete`
    : "Scenario simulation complete"

  const summary = [
    `This ${result.scenarioObject.scenarioType} scenario affects ${affectedKpis.length} KPI dimensions.`,
    result.clampWarnings.length > 0
      ? `${result.clampWarnings.length} impact(s) were clamped to safety bounds.`
      : null,
    "Review the KPI effects and impact chain below for detailed analysis.",
  ].filter(Boolean).join(" ")

  return {
    headline,
    summary,
    terrainInterpretation: terrainEffects.length > 0
      ? terrainEffects.join(" ")
      : "Terrain changes are minimal for this scenario.",
    assumptions: result.assumptions,
    confidence: `${result.confidence.level} confidence (${Math.round(result.confidence.score * 100)}%) — ${result.confidence.reasons[0] ?? "standard analysis"}`,
    disclaimer: "Directional strategic guidance only. Not financial, legal, or investment advice.",
  }
}

/**
 * Build a safe fallback when OpenAI response is invalid or missing.
 */
export function buildAiFailureFallback(result: SimulationResult): FallbackExplanation {
  const base = buildFallbackExplanation(result)
  return {
    ...base,
    headline: base.headline + " (AI summary unavailable)",
    summary: "Simulation completed, but the AI intelligence summary could not be generated reliably. "
      + "The KPI effects and impact chain below reflect the deterministic simulation output.",
    disclaimer: "AI explanation unavailable. Showing deterministic simulation results only. "
      + "Directional strategic guidance only. Not financial, legal, or investment advice.",
  }
}
