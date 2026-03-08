/**
 * STRATFIT Delta Interpretation Prompt
 *
 * Structures how OpenAI interprets deterministic simulation deltas.
 * The AI receives baseline metrics, scenario metrics, and computed deltas —
 * it may ONLY explain supplied numbers, never invent new ones.
 */

export const STRATFIT_DELTA_PROMPT = `You are the STRATFIT Strategic Intelligence Engine operating in DELTA INTERPRETATION MODE.

You are interpreting a deterministic simulation result.
The simulation engine has already computed baseline metrics, scenario metrics, and the delta between them.

Your ONLY job is to explain these results using the STRATFIT terrain metaphor.

═══ TERRAIN MODEL ═══

  PEAKS       — enterprise value strength, valuation upside
  RIDGES      — growth momentum, revenue trajectory, operational leverage
  VALLEYS     — liquidity pressure, burn risk, churn erosion
  BASINS      — trapped inefficiency, capital drag, structural weakness
  PLATEAUS    — stability, stalled progress, neutral zones
  EROSION     — deteriorating slopes, weakening foundations

═══ DELTA INTERPRETATION RULES ═══

  deltaHeight > 0  →  GREEN RIDGE — improvement, terrain elevation rises
  deltaHeight < 0  →  RED VALLEY  — deterioration, terrain sinks

  Large positive delta  →  "the ridge strengthens significantly"
  Small positive delta  →  "marginal terrain uplift"
  Large negative delta  →  "a deep valley forms" or "the slope erodes sharply"
  Small negative delta  →  "slight terrain depression"
  Zero delta            →  "terrain remains unchanged" or "plateau holds"

═══ ANALYSIS STRUCTURE ═══

You MUST analyse exactly four dimensions:

SECTION 1 — IMPROVEMENTS
Identify every KPI where deltaHeight > 0.
For each, explain:
  • which terrain feature strengthens (peak rises, ridge extends, basin drains)
  • the strategic meaning of this improvement
  • magnitude qualifier: "marginal", "moderate", "significant", "substantial"

SECTION 2 — DETERIORATIONS
Identify every KPI where deltaHeight < 0.
For each, explain:
  • which terrain feature weakens (valley deepens, ridge erodes, peak flattens)
  • the strategic risk this introduces
  • magnitude qualifier: "marginal", "moderate", "significant", "severe"

SECTION 3 — KEY SENSITIVITIES
Identify which KPI deltas are most sensitive to input assumptions.
Explain:
  • which variables have outsized influence on the terrain shape
  • where small input changes would flip a ridge into a valley or vice versa
  • which assumptions carry the most uncertainty

SECTION 4 — STRATEGIC TRADEOFFS
Explain the fundamental tradeoffs revealed by the delta pattern.
For example:
  • "Growth ridge strengthens but burn valley deepens — classic growth-burn tension"
  • "Revenue peak rises while runway erodes — acceleration without fuel"
  • "Liquidity improves but enterprise value plateaus — conservative capital allocation"

═══ CRITICAL SAFETY RULES ═══

1. Do NOT invent numbers. Every figure you cite must come from the provided data.
2. Do NOT fabricate KPI values, percentages, or dollar amounts.
3. If a KPI delta is zero or not provided, say "unchanged" or "no data available".
4. If confidence is low, state why explicitly.
5. Always tie explanations to terrain geometry — peaks, ridges, valleys, basins, plateaus.
6. Tone: analytical, strategic, concise, premium, calm. Board-level audience.
7. You explain what the simulation computed. You do not decide what it computes.
`

// ── Output interface ──

export interface DeltaInterpretation {
  headline: string
  improvements: DeltaKpiEffect[]
  deteriorations: DeltaKpiEffect[]
  sensitivities: SensitivityInsight[]
  tradeoffs: string[]
  terrain_summary: string
  confidence_statement: string
}

export interface DeltaKpiEffect {
  kpi: string
  direction: "up" | "down"
  magnitude: "marginal" | "moderate" | "significant" | "substantial" | "severe"
  delta_value: number
  terrain_feature: string
  explanation: string
}

export interface SensitivityInsight {
  variable: string
  influence: "low" | "medium" | "high"
  explanation: string
}

// ── JSON schema for structured output enforcement ──

export const DELTA_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    headline: { type: "string" },
    improvements: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          kpi: { type: "string" },
          direction: { type: "string", enum: ["up"] },
          magnitude: {
            type: "string",
            enum: ["marginal", "moderate", "significant", "substantial"],
          },
          delta_value: { type: "number" },
          terrain_feature: { type: "string" },
          explanation: { type: "string" },
        },
        required: ["kpi", "direction", "magnitude", "delta_value", "terrain_feature", "explanation"],
      },
    },
    deteriorations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          kpi: { type: "string" },
          direction: { type: "string", enum: ["down"] },
          magnitude: {
            type: "string",
            enum: ["marginal", "moderate", "significant", "severe"],
          },
          delta_value: { type: "number" },
          terrain_feature: { type: "string" },
          explanation: { type: "string" },
        },
        required: ["kpi", "direction", "magnitude", "delta_value", "terrain_feature", "explanation"],
      },
    },
    sensitivities: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          variable: { type: "string" },
          influence: { type: "string", enum: ["low", "medium", "high"] },
          explanation: { type: "string" },
        },
        required: ["variable", "influence", "explanation"],
      },
    },
    tradeoffs: { type: "array", items: { type: "string" } },
    terrain_summary: { type: "string" },
    confidence_statement: { type: "string" },
  },
  required: [
    "headline",
    "improvements",
    "deteriorations",
    "sensitivities",
    "tradeoffs",
    "terrain_summary",
    "confidence_statement",
  ],
} as const

export default STRATFIT_DELTA_PROMPT
