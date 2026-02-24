// src/pages/compass/compassTypes.ts
// ─────────────────────────────────────────────────────────────────────────────
// STRATFIT Compass — intent + simulation state types

/**
 * Structured representation of what the user is asking for,
 * derived from rawPrompt via parsing / NLP.
 */
export interface IntentModel {
  /** Primary intent category */
  category:
    | "LIQUIDITY"
    | "GROWTH"
    | "CAPITAL"
    | "RISK"
    | "DOWNSIDE"
    | "UPSIDE"
    | "COMPARE"
    | "UNKNOWN"

  /** Key entities extracted from the prompt */
  entities: {
    timeHorizonMonths?: number
    growthRatePct?: number
    capitalAmount?: number
    scenarioLabel?: string
  }

  /** Raw confidence [0–1] that the parse is correct */
  confidence: number
}

/**
 * Full state for a single Compass session.
 */
export interface CompassIntent {
  /** Verbatim text entered by the user */
  rawPrompt: string

  /** Parsed semantic intent (present after parse step) */
  parsedIntent?: IntentModel

  /** ID of the simulation run triggered by this intent */
  simulationId?: string

  /** Narrative output produced after simulation completes */
  narrative?: string
}

/** Factory — creates a blank CompassIntent */
export function createCompassIntent(rawPrompt = ""): CompassIntent {
  return { rawPrompt }
}
