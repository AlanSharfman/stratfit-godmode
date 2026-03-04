// src/selectors/valuationSelectors.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Valuation Selectors (Phase V-1)
//
// Thin selector layer over the deterministic valuation engine.
// Reads from canonical EngineResults, returns ValuationResults.
// ═══════════════════════════════════════════════════════════════════════════

import type { EngineResults } from "@/core/engine/types"
import type { ValuationResults } from "@/valuation/valuationTypes"
import { computeValuation } from "@/valuation/valuationEngine"

/**
 * Select valuation results from engine output.
 *
 * Pure function — no store access, no side effects.
 * Intended to be called by UI components or hooks that already
 * hold a reference to engineResults.
 */
export function selectValuation(engineResults: EngineResults): ValuationResults {
  return computeValuation(engineResults)
}
