// src/engine/whatif/types.ts
// STRATFIT — What-If Structured Answer Contract
// Terrain-aware JSON schema enforced on every OpenAI response.

export type WhatIfIntent =
  | "explain"
  | "simulate_change"
  | "compare"
  | "forecast"
  | "data_missing"

export type WhatIfKpiLabel =
  | "Liquidity"
  | "Runway"
  | "Growth"
  | "Revenue"
  | "Burn"
  | "Value"

export type WhatIfDirection = "up" | "down" | "flat"
export type WhatIfMagnitude = "small" | "medium" | "large"
export type WhatIfConfidence = "low" | "medium" | "high"
export type WhatIfTerrainFeature = "peak" | "valley" | "ridge" | "basin" | "plateau"
export type WhatIfPositionRule = "exact_peak" | "exact_valley" | "inflection_point"
export type WhatIfGlow = 0.2 | 0.4 | 0.6 | 0.8

export interface WhatIfKpiImpact {
  kpi: WhatIfKpiLabel
  direction: WhatIfDirection
  magnitude?: WhatIfMagnitude
  confidence: WhatIfConfidence
  terrain_feature: WhatIfTerrainFeature
}

export interface WhatIfTerrainOverlay {
  kpi: WhatIfKpiLabel
  anchorId: string
  color: string
  glowIntensity: WhatIfGlow
  label: string
  position_rule: WhatIfPositionRule
}

export interface WhatIfParameterChange {
  field: string
  op: "set" | "add" | "mul"
  value: number
  unit?: string
}

export interface WhatIfMissingInput {
  field: string
  reason: string
  example?: string
}

export interface WhatIfRecommendedSimulation {
  should_run: boolean
  parameter_changes?: WhatIfParameterChange[]
  reason: string
}

export interface WhatIfCitation {
  source: "baseline" | "engineResults"
  key: string
}

export interface WhatIfAnswer {
  intent: WhatIfIntent
  headline?: string
  summary: string
  terrain_interpretation?: string
  short_term_effect?: string
  long_term_effect?: string
  impact_chain?: string[]
  assumptions?: string[]
  missing_inputs?: WhatIfMissingInput[]
  kpi_impacts: WhatIfKpiImpact[]
  terrain_overlays: WhatIfTerrainOverlay[]
  recommended_simulation?: WhatIfRecommendedSimulation
  next_questions?: string[]
  citations?: WhatIfCitation[]
}

// ── OpenAI JSON Schema (for Responses API strict mode) ──

export const WHATIF_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    intent: { type: "string", enum: ["explain", "simulate_change", "compare", "forecast", "data_missing"] },
    headline: { type: "string", description: "One-line strategic summary, 10–15 words, investor-grade" },
    summary: { type: "string", description: "2–3 sentences, investor-grade strategic explanation" },
    terrain_interpretation: { type: "string", description: "How the mountain reshapes, using terrain vocabulary" },
    short_term_effect: { type: "string", description: "What happens in 0–3 months" },
    long_term_effect: { type: "string", description: "What structural shift occurs at 6–12 months" },
    impact_chain: { type: "array", items: { type: "string" }, description: "3–5 causal steps from decision to terrain change" },
    assumptions: { type: "array", items: { type: "string" } },
    missing_inputs: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          field: { type: "string" },
          reason: { type: "string" },
          example: { type: "string" },
        },
        required: ["field", "reason"],
      },
    },
    kpi_impacts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          kpi: { type: "string", enum: ["Liquidity", "Runway", "Growth", "Revenue", "Burn", "Value"] },
          direction: { type: "string", enum: ["up", "down", "flat"] },
          magnitude: { type: "string", enum: ["small", "medium", "large"] },
          confidence: { type: "string", enum: ["low", "medium", "high"] },
          terrain_feature: { type: "string", enum: ["peak", "valley", "ridge", "basin", "plateau"] },
        },
        required: ["kpi", "direction", "confidence", "terrain_feature"],
      },
    },
    terrain_overlays: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          kpi: { type: "string", enum: ["Liquidity", "Runway", "Growth", "Revenue", "Burn", "Value"] },
          anchorId: { type: "string" },
          color: { type: "string" },
          glowIntensity: { type: "number", enum: [0.2, 0.4, 0.6, 0.8] },
          label: { type: "string" },
          position_rule: { type: "string", enum: ["exact_peak", "exact_valley", "inflection_point"] },
        },
        required: ["kpi", "anchorId", "color", "glowIntensity", "label", "position_rule"],
      },
    },
    recommended_simulation: {
      type: "object",
      additionalProperties: false,
      properties: {
        should_run: { type: "boolean" },
        parameter_changes: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              field: { type: "string" },
              op: { type: "string", enum: ["set", "add", "mul"] },
              value: { type: "number" },
              unit: { type: "string" },
            },
            required: ["field", "op", "value"],
          },
        },
        reason: { type: "string" },
      },
      required: ["should_run", "reason"],
    },
    next_questions: { type: "array", items: { type: "string" } },
    citations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          source: { type: "string", enum: ["baseline", "engineResults"] },
          key: { type: "string" },
        },
        required: ["source", "key"],
      },
    },
  },
  required: ["intent", "headline", "summary", "terrain_interpretation", "short_term_effect", "long_term_effect", "impact_chain", "kpi_impacts", "terrain_overlays"],
} as const

// ── Validator (manual type-guard — no Zod dep needed) ──

const VALID_INTENTS = new Set(["explain", "simulate_change", "compare", "forecast", "data_missing"])
const VALID_KPI_LABELS = new Set(["Liquidity", "Runway", "Growth", "Revenue", "Burn", "Value"])
const VALID_DIRECTIONS = new Set(["up", "down", "flat"])
const VALID_MAGNITUDES = new Set(["small", "medium", "large"])
const VALID_CONFIDENCES = new Set(["low", "medium", "high"])
const VALID_FEATURES = new Set(["peak", "valley", "ridge", "basin", "plateau"])
const VALID_POSITION_RULES = new Set(["exact_peak", "exact_valley", "inflection_point"])
const VALID_GLOWS = new Set([0.2, 0.4, 0.6, 0.8])
const VALID_OPS = new Set(["set", "add", "mul"])
const VALID_SOURCES = new Set(["baseline", "engineResults"])

export interface ValidateResult {
  valid: boolean
  errors: string[]
  /** Cleaned answer (soft-normalised), or null if invalid */
  answer: WhatIfAnswer | null
}

export function validateWhatIfAnswer(raw: unknown): ValidateResult {
  const errors: string[] = []
  if (!raw || typeof raw !== "object") return { valid: false, errors: ["Not an object"], answer: null }

  const r = raw as Record<string, unknown>

  if (typeof r.intent !== "string" || !VALID_INTENTS.has(r.intent))
    errors.push(`Invalid intent: ${r.intent}`)
  if (typeof r.headline !== "string" || r.headline.length === 0)
    errors.push("Missing or empty headline")
  if (typeof r.summary !== "string" || r.summary.length === 0)
    errors.push("Missing or empty summary")
  if (typeof r.terrain_interpretation !== "string")
    errors.push("Missing terrain_interpretation")
  if (typeof r.short_term_effect !== "string")
    errors.push("Missing short_term_effect")
  if (typeof r.long_term_effect !== "string")
    errors.push("Missing long_term_effect")
  if (!Array.isArray(r.impact_chain))
    errors.push("impact_chain must be an array")

  if (!Array.isArray(r.kpi_impacts))
    errors.push("kpi_impacts must be an array")
  else {
    for (let i = 0; i < r.kpi_impacts.length; i++) {
      const imp = r.kpi_impacts[i] as Record<string, unknown>
      if (!imp || typeof imp !== "object") { errors.push(`kpi_impacts[${i}] not an object`); continue }
      if (!VALID_KPI_LABELS.has(imp.kpi as string)) errors.push(`kpi_impacts[${i}].kpi invalid: ${imp.kpi}`)
      if (!VALID_DIRECTIONS.has(imp.direction as string)) errors.push(`kpi_impacts[${i}].direction invalid`)
      if (!VALID_CONFIDENCES.has(imp.confidence as string)) errors.push(`kpi_impacts[${i}].confidence invalid`)
      if (!VALID_FEATURES.has(imp.terrain_feature as string)) errors.push(`kpi_impacts[${i}].terrain_feature invalid`)
      if (imp.magnitude !== undefined && !VALID_MAGNITUDES.has(imp.magnitude as string)) errors.push(`kpi_impacts[${i}].magnitude invalid`)
    }
  }

  if (!Array.isArray(r.terrain_overlays))
    errors.push("terrain_overlays must be an array")
  else {
    for (let i = 0; i < r.terrain_overlays.length; i++) {
      const ov = r.terrain_overlays[i] as Record<string, unknown>
      if (!ov || typeof ov !== "object") { errors.push(`terrain_overlays[${i}] not an object`); continue }
      if (!VALID_KPI_LABELS.has(ov.kpi as string)) errors.push(`terrain_overlays[${i}].kpi invalid`)
      if (typeof ov.anchorId !== "string") errors.push(`terrain_overlays[${i}].anchorId missing`)
      if (typeof ov.color !== "string") errors.push(`terrain_overlays[${i}].color missing`)
      if (!VALID_GLOWS.has(ov.glowIntensity as number)) errors.push(`terrain_overlays[${i}].glowIntensity invalid`)
      if (typeof ov.label !== "string") errors.push(`terrain_overlays[${i}].label missing`)
      if (!VALID_POSITION_RULES.has(ov.position_rule as string)) errors.push(`terrain_overlays[${i}].position_rule invalid`)
    }
  }

  if (r.recommended_simulation !== undefined && r.recommended_simulation !== null) {
    const sim = r.recommended_simulation as Record<string, unknown>
    if (typeof sim.should_run !== "boolean") errors.push("recommended_simulation.should_run must be boolean")
    if (typeof sim.reason !== "string") errors.push("recommended_simulation.reason must be string")
    if (sim.parameter_changes !== undefined && Array.isArray(sim.parameter_changes)) {
      for (let i = 0; i < sim.parameter_changes.length; i++) {
        const pc = sim.parameter_changes[i] as Record<string, unknown>
        if (typeof pc.field !== "string") errors.push(`parameter_changes[${i}].field must be string`)
        if (!VALID_OPS.has(pc.op as string)) errors.push(`parameter_changes[${i}].op invalid`)
        if (typeof pc.value !== "number") errors.push(`parameter_changes[${i}].value must be number`)
      }
    }
  }

  if (r.citations !== undefined && Array.isArray(r.citations)) {
    for (let i = 0; i < r.citations.length; i++) {
      const c = r.citations[i] as Record<string, unknown>
      if (!VALID_SOURCES.has(c.source as string)) errors.push(`citations[${i}].source invalid`)
    }
  }

  if (errors.length > 0) return { valid: false, errors, answer: null }

  return { valid: true, errors: [], answer: r as unknown as WhatIfAnswer }
}

// ── Safe error response ──

export function safeErrorAnswer(message?: string): WhatIfAnswer {
  return {
    intent: "data_missing",
    headline: "Insufficient data to analyse scenario",
    summary: message ?? "I couldn't produce a valid structured answer. Please re-ask or simplify your question.",
    terrain_interpretation: "The terrain cannot be assessed without sufficient context.",
    short_term_effect: "",
    long_term_effect: "",
    impact_chain: [],
    kpi_impacts: [],
    terrain_overlays: [],
    next_questions: [
      "What is our current runway?",
      "How would cutting burn by 20% affect runway?",
      "What happens if we lose our biggest client?",
    ],
  }
}
