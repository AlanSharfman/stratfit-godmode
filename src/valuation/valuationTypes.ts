// src/valuation/valuationTypes.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Valuation Engine Types (Phase V-1 + V-4)
//
// Pure type definitions for the deterministic valuation computation layer.
// No UI. No store. Consumed by valuationEngine and valuationSelectors.
// ═══════════════════════════════════════════════════════════════════════════

export interface ValuationProbabilities {
  /** Fraction of methods producing EV > 0 (0–1) */
  valueCreate: number
  /** Fraction of methods producing EV ≤ 0 (0–1) */
  valueLoss: number
  /** Fraction of methods producing EV ≥ blendedValue (0–1) */
  target: number
}

export interface ValuationResults {
  dcf: {
    enterpriseValue: number
    equityValue: number
    terminalValue: number
  }

  revenueMultiple: {
    enterpriseValue: number
    multiple: number
  }

  ebitdaMultiple: {
    enterpriseValue: number
    multiple: number
  }

  blendedValue: number

  /** Probability metrics derived from cross-method agreement (V-3B) */
  probabilities: ValuationProbabilities
}

// ═══════════════════════════════════════════════════════════════════════════
// WATERFALL TYPES (Phase V-4)
// ═══════════════════════════════════════════════════════════════════════════

export interface WaterfallStep {
  id: string
  label: string
  /** Positive or negative contribution to EV (absolute $) */
  delta: number
  /** Direction derived in engine/selector — NOT in UI */
  direction: "up" | "down" | "flat"
  /** Optional probability weight for the driver (0–1) */
  probability?: number | null
}

export interface WaterfallPayload {
  baselineEV: number | null
  scenarioEV: number | null
  steps: WaterfallStep[]
  notes?: {
    method?: string
    horizonYears?: number | null
  }
}
