/**
 * STRATFIT — Structured Scenario Object Builder
 *
 * Converts a validated prompt + detected intent into a structured
 * scenario object with explicit assumptions, time horizon, and
 * confidence scoring. This object is the single input to the
 * deterministic simulation engine — OpenAI never sees raw prompts.
 */

import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import type { ScenarioCategory } from "@/engine/scenarioTemplates"
import type { DetectedIntent } from "@/engine/scenarioIntentDetector"
import { getImpactDeltas } from "@/engine/scenarioImpactMatrix"
import { clampKpiDeltas } from "./kpiBounds"

export interface ScenarioObject {
  id: string
  scenarioType: ScenarioCategory
  action: string
  question: string
  parameters: Record<string, string | number>
  assumptions: string[]
  timeHorizonMonths: number
  deltas: Partial<Record<KpiKey, number>>
  confidence: ScenarioConfidence
  canRunSimulation: boolean
  clampWarnings: string[]
}

export interface ScenarioConfidence {
  level: "high" | "medium" | "low"
  score: number
  reasons: string[]
}

const CATEGORY_ASSUMPTIONS: Record<ScenarioCategory, string[]> = {
  hiring: [
    "Hiring cost at market rate assumed",
    "Ramp-up period of 3–6 months before full productivity",
    "No additional funding assumed for hiring spend",
  ],
  pricing: [
    "Price elasticity within normal range assumed",
    "No competitive pricing response assumed",
    "Customer base retention at current levels",
  ],
  capital: [
    "Capital deployed according to current burn structure",
    "No change in operational efficiency assumed",
    "Standard dilution terms assumed",
  ],
  growth: [
    "Market conditions remain stable",
    "Growth investment begins impacting revenue within 3–6 months",
    "No supply-side constraints assumed",
  ],
  efficiency: [
    "Efficiency gains realised within 1–3 months",
    "No material revenue impact from cost reduction",
    "Team productivity maintained during restructuring",
  ],
  market: [
    "Market dynamics affect all competitors equally",
    "No regulatory changes assumed",
    "Demand patterns follow historical trends",
  ],
  risk: [
    "Risk event occurs without mitigation",
    "No insurance or hedging in place",
    "Recovery timeline of 6–12 months assumed",
  ],
}

function buildConfidence(
  intent: DetectedIntent | null,
  matchSource: "template" | "nlp" | "matrix" | "ai" | "unknown",
  deltasCount: number,
): ScenarioConfidence {
  const reasons: string[] = []
  let score = 0.5

  if (intent) {
    score += 0.15
    reasons.push(`Intent detected: ${intent.action}`)
    if (intent.detectedKeywords.length >= 2) {
      score += 0.1
      reasons.push(`${intent.detectedKeywords.length} strategic keywords matched`)
    }
  } else {
    reasons.push("No clear intent detected from keywords")
  }

  if (matchSource === "template") {
    score += 0.25
    reasons.push("Matched curated scenario template")
  } else if (matchSource === "ai") {
    score += 0.15
    reasons.push("AI-assisted interpretation")
  } else if (matchSource === "nlp") {
    score += 0.1
    reasons.push("Natural language force parsing")
  } else if (matchSource === "matrix") {
    score += 0.05
    reasons.push("Fallback to category impact matrix")
  }

  if (deltasCount >= 3) {
    score += 0.05
    reasons.push(`${deltasCount} KPI dimensions affected`)
  }

  score = Math.min(1, Math.max(0, score))
  const level = score >= 0.75 ? "high" : score >= 0.5 ? "medium" : "low"

  return { level, score: Math.round(score * 100) / 100, reasons }
}

function extractParameters(question: string): Record<string, string | number> {
  const params: Record<string, string | number> = {}

  const pctMatch = question.match(/(\d+(?:\.\d+)?)\s*%/)
  if (pctMatch) params.percentage = parseFloat(pctMatch[1])

  const dollarMatch = question.match(/\$\s*(\d+(?:\.\d+)?)\s*(m|k|b)?/i)
  if (dollarMatch) {
    let val = parseFloat(dollarMatch[1])
    const unit = (dollarMatch[2] ?? "").toLowerCase()
    if (unit === "m") val *= 1_000_000
    else if (unit === "k") val *= 1_000
    else if (unit === "b") val *= 1_000_000_000
    params.amount = val
  }

  const countMatch = question.match(/(\d+)\s*(people|engineers|reps|staff|hires|employees)/i)
  if (countMatch) params.headcount = parseInt(countMatch[1], 10)

  const monthMatch = question.match(/(\d+)\s*months?/i)
  if (monthMatch) params.months = parseInt(monthMatch[1], 10)

  return params
}

export function buildScenarioObject(
  question: string,
  intent: DetectedIntent | null,
  matchSource: "template" | "nlp" | "matrix" | "ai" | "unknown",
  overrideDeltas?: Partial<Record<KpiKey, number>>,
  timeHorizon: number = 12,
): ScenarioObject {
  const category: ScenarioCategory = intent?.scenarioType ?? "market"
  const rawDeltas = overrideDeltas ?? getImpactDeltas(category)
  const { clamped, warnings } = clampKpiDeltas(rawDeltas)

  const confidence = buildConfidence(intent, matchSource, Object.keys(clamped).length)
  const assumptions = [...CATEGORY_ASSUMPTIONS[category]]
  const parameters = extractParameters(question)

  if (parameters.percentage) {
    assumptions.push(`User-specified magnitude: ${parameters.percentage}%`)
  }
  if (parameters.amount) {
    assumptions.push(`User-specified amount: $${(parameters.amount as number).toLocaleString()}`)
  }

  return {
    id: `scenario-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    scenarioType: category,
    action: intent?.action ?? "General scenario",
    question,
    parameters,
    assumptions,
    timeHorizonMonths: timeHorizon,
    deltas: clamped,
    confidence,
    canRunSimulation: confidence.score >= 0.3 && Object.keys(clamped).length > 0,
    clampWarnings: warnings,
  }
}
