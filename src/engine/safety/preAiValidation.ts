/**
 * STRATFIT — Pre-AI Reality Check
 *
 * Final gate before calling OpenAI. Validates that the deterministic
 * simulation has produced meaningful outputs. If validation fails,
 * OpenAI is NOT called and a fallback explanation is returned instead.
 */

import type { SimulationResult } from "./runScenarioSimulation"
import { buildFallbackExplanation, type FallbackExplanation } from "./fallbackResponse"

export interface PreAiCheckResult {
  canCallAi: boolean
  failReasons: string[]
  fallback?: FallbackExplanation
}

export function preAiValidationCheck(result: SimulationResult): PreAiCheckResult {
  const failReasons: string[] = []

  if (result.blocked) {
    failReasons.push(`Simulation blocked: ${result.blockReason ?? "unknown reason"}`)
  }

  if (!result.scenarioObject.scenarioType) {
    failReasons.push("No scenario type resolved")
  }

  if (Object.keys(result.forces).length === 0) {
    failReasons.push("No KPI forces computed")
  }

  if (result.propagation.affected.size === 0 && !result.blocked) {
    failReasons.push("No KPI propagation occurred")
  }

  if (result.confidence.score < 0.2) {
    failReasons.push(`Confidence too low for AI interpretation (${result.confidence.score})`)
  }

  if (result.assumptions.length === 0 && !result.blocked) {
    failReasons.push("No assumptions generated — scenario may be under-specified")
  }

  if (failReasons.length > 0) {
    return {
      canCallAi: false,
      failReasons,
      fallback: buildFallbackExplanation(result, failReasons),
    }
  }

  return { canCallAi: true, failReasons: [] }
}
