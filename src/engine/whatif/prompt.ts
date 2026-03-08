// src/engine/whatif/prompt.ts
// STRATFIT — What-If Prompt Builder (v2, terrain-aware)
// Delegates to modular prompt and context modules.

import type { BaselineV1 } from "@/onboard/baseline"
import type { PositionKpis } from "@/pages/position/overlays/positionState"
import type { ScenarioRunEngineResult } from "@/store/scenarioRunStore"
import { STRATFIT_SYSTEM_PROMPT } from "./prompts/stratfitSystemPrompt"
import { buildDeveloperPrompt } from "./prompts/stratfitDeveloperPrompt"
import { STRATFIT_DELTA_PROMPT, DELTA_JSON_SCHEMA } from "./prompts/stratfitDeltaPrompt"
import type { DeltaInterpretation } from "./prompts/stratfitDeltaPrompt"
import {
  buildStratfitContext,
  formatContextAsMessage,
  type ScenarioContext,
} from "./utils/buildStratfitContext"
import {
  buildDeltaContext,
  formatDeltaAsMessage,
  buildDeltaMetrics,
} from "./utils/buildDeltaContext"
import type { DeltaMetric, DeltaContext } from "./utils/buildDeltaContext"

export const PROMPT_VERSION = "whatif_v2"

// ── KPI anchor mapping (UI uses these anchor IDs for terrain overlays) ──

export const KPI_ANCHOR_MAP = {
  Liquidity: { anchorId: "cash", zone: "Liquidity Zone", color: "#22D3EE" },
  Runway:    { anchorId: "runway", zone: "Runway Horizon", color: "#38BDF8" },
  Growth:    { anchorId: "growth", zone: "Growth Gradient", color: "#34D399" },
  Revenue:   { anchorId: "revenue", zone: "Revenue Flow", color: "#A78BFA" },
  Burn:      { anchorId: "burn", zone: "Burn Zone", color: "#F59E0B" },
  Value:     { anchorId: "enterpriseValue", zone: "Value Summit", color: "#EC4899" },
} as const

export const ALLOWED_COLORS = [
  "#22D3EE", "#38BDF8", "#34D399", "#A78BFA", "#F59E0B", "#EC4899",
  "#F87171", "#10B981", "#8B5CF6", "#06B6D4",
]

// ── Context interface (backward compatible) ──

export interface WhatIfContext {
  baseline: BaselineV1 | null
  kpis: PositionKpis | null
  selectedKpi?: string
  scenarioCategory?: string
}

// ── System prompt (persona + developer instructions) ──

export function buildSystemPrompt(): string {
  return STRATFIT_SYSTEM_PROMPT + "\n\n" + buildDeveloperPrompt()
}

// ── Delta system prompt (persona + delta interpretation instructions) ──

export function buildDeltaSystemPrompt(): string {
  return STRATFIT_SYSTEM_PROMPT + "\n\n" + STRATFIT_DELTA_PROMPT
}

// ── User message builder ──

export function buildUserMessage(question: string, ctx: WhatIfContext): string {
  const scenario: ScenarioContext = {
    question,
    category: ctx.scenarioCategory,
    focusedKpi: ctx.selectedKpi,
  }

  const structured = buildStratfitContext(ctx.baseline, ctx.kpis, scenario)
  return formatContextAsMessage(structured)
}

// ── Delta user message builder ──

export interface DeltaMessageInputs {
  prompt: string
  scenarioType: string
  baselineKpis: PositionKpis
  scenarioKpis: PositionKpis
  engineResult: ScenarioRunEngineResult
}

export function buildDeltaUserMessage(inputs: DeltaMessageInputs): string {
  const ctx = buildDeltaContext(
    inputs.prompt,
    inputs.scenarioType,
    inputs.baselineKpis,
    inputs.scenarioKpis,
    inputs.engineResult,
  )
  return formatDeltaAsMessage(ctx)
}

export {
  DELTA_JSON_SCHEMA,
  buildDeltaMetrics,
  buildDeltaContext,
  formatDeltaAsMessage,
}
export type { DeltaInterpretation, DeltaMetric, DeltaContext }
