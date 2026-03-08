// src/domain/signals/DecisionSignals.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Decision Signal Types
//
// High-level decision signals derived deterministically from EngineResults.
// Consumed by narrative layers and UI panels — never computed in components.
// ═══════════════════════════════════════════════════════════════════════════

export interface ValueSignal {
  direction: "increase" | "decrease" | "neutral"
  magnitudePct: number
}

export interface RiskSignal {
  level: "low" | "moderate" | "high"
  changePct: number
}

export interface StabilitySignal {
  /** 0–100 stability score (inverse of variance) */
  score: number
  trend: "improving" | "declining" | "stable"
}

export interface ConfidenceSignal {
  /** 0–100 confidence score (inverse of band width) */
  score: number
  /** p90 − p10 normalized by p50 */
  bandWidth: number
}

export interface DecisionSignals {
  valueSignal: ValueSignal
  riskSignal: RiskSignal
  stabilitySignal: StabilitySignal
  confidenceSignal: ConfidenceSignal
}
