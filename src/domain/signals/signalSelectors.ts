// src/domain/signals/signalSelectors.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Decision Signal Selectors
//
// Null-safe, memoized accessors for DecisionSignals.
// Pulls EngineResults via existing engine selector layer.
// ═══════════════════════════════════════════════════════════════════════════

import { selectEngineResults } from "@/domain/engine/engineSelectors"
import { extractDecisionSignals } from "./extractDecisionSignals"
import type { DecisionSignals } from "./DecisionSignals"

// ── Null-safe defaults ──────────────────────────────────────────

const DEFAULT_SIGNALS: DecisionSignals = Object.freeze({
  valueSignal: Object.freeze({ direction: "neutral" as const, magnitudePct: 0 }),
  riskSignal: Object.freeze({ level: "moderate" as const, changePct: 0 }),
  stabilitySignal: Object.freeze({ score: 50, trend: "stable" as const }),
  confidenceSignal: Object.freeze({ score: 50, bandWidth: 0 }),
})

// ── Memoization cache ───────────────────────────────────────────

let cachedRunId: string | null = null
let cachedSignals: DecisionSignals = DEFAULT_SIGNALS

// ── Selector ────────────────────────────────────────────────────

/**
 * Select decision signals for a given engine run.
 *
 * Returns memoized result when run_id hasn't changed.
 * Returns safe defaults when no engine results are available.
 */
export function selectDecisionSignals(run_id: string | undefined): DecisionSignals {
  if (!run_id) return DEFAULT_SIGNALS

  // Return cached result if run hasn't changed
  if (run_id === cachedRunId) return cachedSignals

  const engineResults = selectEngineResults(run_id)
  if (!engineResults) return DEFAULT_SIGNALS

  cachedSignals = extractDecisionSignals(engineResults)
  cachedRunId = run_id
  return cachedSignals
}
