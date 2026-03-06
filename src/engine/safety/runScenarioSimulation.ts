/**
 * STRATFIT — Deterministic Scenario Simulation Runner
 *
 * Single entry point for scenario execution. Enforces the pipeline:
 *   prompt → validation → intent → scenario object → impact forces
 *   → KPI recalculation → terrain update → OpenAI explanation
 *
 * OpenAI NEVER generates KPI deltas. It only explains deterministic outputs.
 */

import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import type { ScenarioTemplate, ScenarioCategory } from "@/engine/scenarioTemplates"
import type { DetectedIntent } from "@/engine/scenarioIntentDetector"
import type { PositionKpis } from "@/pages/position/overlays/positionState"
import { detectScenarioIntent } from "@/engine/scenarioIntentDetector"
import { getImpactForces, mergeWithMatrixForces, getImpactDeltas, SCENARIO_IMPACT_MATRIX } from "@/engine/scenarioImpactMatrix"
import { validateScenarioPrompt, type PromptValidation } from "./validateScenarioPrompt"
import { buildScenarioObject, type ScenarioObject } from "./buildScenarioObject"
import { clampForces, type ClampResult } from "./kpiBounds"
import { pushAuditEntry, type ScenarioAuditEntry } from "./scenarioAuditLog"
import { propagateForce } from "@/engine/kpiDependencyGraph"
import { KPI_GRAPH } from "@/engine/kpiDependencyGraph"

export interface SimulationResult {
  success: boolean
  template: ScenarioTemplate
  scenarioObject: ScenarioObject
  validation: PromptValidation
  intent: DetectedIntent | null
  forces: Partial<Record<KpiKey, number>>
  propagation: { affected: Map<KpiKey, number>; hops: Map<KpiKey, number> }
  clampWarnings: string[]
  assumptions: string[]
  confidence: { level: "high" | "medium" | "low"; score: number; reasons: string[] }
  blocked: boolean
  blockReason?: string
}

export interface SimulationInput {
  prompt: string
  baseKpis: PositionKpis | null
  timeHorizon?: number
}

/**
 * Run the full deterministic scenario pipeline.
 * Returns a SimulationResult that the UI uses for terrain updates
 * AND passes to OpenAI for explanation (never the reverse).
 */
export function runScenarioSimulation(input: SimulationInput): SimulationResult {
  const { prompt, baseKpis, timeHorizon = 12 } = input
  const t0 = performance.now()

  // Step 1: Validate prompt
  const validation = validateScenarioPrompt(prompt)
  if (validation.validationClass !== "valid") {
    const blocked = makeBlockedResult(prompt, validation)
    logAudit(blocked, t0)
    return blocked
  }

  // Step 2: Detect intent
  const intent = detectScenarioIntent(prompt)
  const category: ScenarioCategory = intent?.scenarioType ?? "market"

  // Step 3: Build structured scenario object (with clamped deltas)
  const scenarioObject = buildScenarioObject(prompt, intent, intent ? "matrix" : "unknown", undefined, timeHorizon)

  if (!scenarioObject.canRunSimulation) {
    const blocked = makeBlockedResult(prompt, validation, intent, scenarioObject, "Scenario confidence too low or no KPI effects detected.")
    logAudit(blocked, t0)
    return blocked
  }

  // Step 4: Compute absolute forces from percentage deltas against baseline
  const rawForces = getImpactForces(category, baseKpis)
  const baselineValues: Partial<Record<KpiKey, number>> = {}
  if (baseKpis) {
    baselineValues.cash = baseKpis.cashOnHand
    baselineValues.runway = baseKpis.runwayMonths
    baselineValues.growth = baseKpis.growthRatePct
    baselineValues.revenue = baseKpis.revenueMonthly
    baselineValues.burn = baseKpis.burnMonthly
    baselineValues.enterpriseValue = baseKpis.valuationEstimate
    baselineValues.arr = baseKpis.arr
    baselineValues.churn = baseKpis.churnPct
  }

  const clampResult: ClampResult = clampForces(rawForces, baselineValues)
  const forces = clampResult.clamped

  // Step 5: Propagate forces through KPI dependency graph
  const allAffected = new Map<KpiKey, number>()
  const allHops = new Map<KpiKey, number>()
  for (const [kpi, delta] of Object.entries(forces) as [KpiKey, number][]) {
    const { affected, hops } = propagateForce(KPI_GRAPH, kpi, delta)
    for (const [k, d] of affected) {
      allAffected.set(k, (allAffected.get(k) ?? 0) + d)
      const ex = allHops.get(k)
      const nh = hops.get(k) ?? 0
      if (ex === undefined || nh < ex) allHops.set(k, nh)
    }
  }

  // Step 6: Build template for terrain engine
  const template: ScenarioTemplate = {
    id: scenarioObject.id,
    question: prompt,
    category,
    forces,
    description: SCENARIO_IMPACT_MATRIX[category]?.description ?? scenarioObject.action,
  }

  const result: SimulationResult = {
    success: true,
    template,
    scenarioObject,
    validation,
    intent,
    forces,
    propagation: { affected: allAffected, hops: allHops },
    clampWarnings: [...scenarioObject.clampWarnings, ...clampResult.warnings],
    assumptions: scenarioObject.assumptions,
    confidence: scenarioObject.confidence,
    blocked: false,
  }

  logAudit(result, t0)
  return result
}

function makeBlockedResult(
  prompt: string,
  validation: PromptValidation,
  intent?: DetectedIntent | null,
  scenarioObject?: ScenarioObject,
  blockReason?: string,
): SimulationResult {
  return {
    success: false,
    template: {
      id: `blocked-${Date.now()}`,
      question: prompt,
      category: intent?.scenarioType ?? "market",
      forces: {},
      description: validation.reason,
    },
    scenarioObject: scenarioObject ?? {
      id: `blocked-${Date.now()}`,
      scenarioType: intent?.scenarioType ?? "market",
      action: "Blocked",
      question: prompt,
      parameters: {},
      assumptions: [],
      timeHorizonMonths: 12,
      deltas: {},
      confidence: { level: "low", score: 0, reasons: [validation.reason] },
      canRunSimulation: false,
      clampWarnings: [],
    },
    validation,
    intent: intent ?? null,
    forces: {},
    propagation: { affected: new Map(), hops: new Map() },
    clampWarnings: [],
    assumptions: [],
    confidence: { level: "low", score: 0, reasons: [validation.reason] },
    blocked: true,
    blockReason: blockReason ?? validation.reason,
  }
}

function logAudit(result: SimulationResult, t0: number) {
  const entry: ScenarioAuditEntry = {
    id: result.scenarioObject.id,
    timestamp: Date.now(),
    rawPrompt: result.template.question,
    validationClass: result.validation.validationClass,
    scenarioType: result.scenarioObject.scenarioType,
    assumptions: result.assumptions,
    kpiDeltas: Object.fromEntries(
      Object.entries(result.forces).map(([k, v]) => [k, v]),
    ) as Record<string, number>,
    confidence: result.confidence,
    clampWarnings: result.clampWarnings,
    blocked: result.blocked,
    blockReason: result.blockReason,
    latencyMs: Math.round(performance.now() - t0),
  }
  pushAuditEntry(entry)
}
