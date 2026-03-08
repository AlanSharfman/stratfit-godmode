// src/selectors/riskSelectors.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Canonical Risk selector
//
// Prefers engine-computed risk index (computeRiskIndex output).
// Falls back to runway-based heuristic when engine results are unavailable.
// Pure function. No stores.
// ═══════════════════════════════════════════════════════════════════════════

import type { SimulationKpis } from "@/state/phase1ScenarioStore"
import { selectEngineRiskScore } from "@/domain/engine/engineSelectors"

/**
 * Derive a 0–100 risk score.
 *
 * Priority:
 *   1. Engine-computed risk (from computeRiskIndex via riskIndexSeries)
 *   2. Runway + burn heuristic (legacy fallback)
 *
 * @param simulationKpis — KPIs from the simulation pipeline (used for heuristic fallback)
 * @param engineRunId    — Engine run id; when provided, attempts to read computeRiskIndex output
 */
export function selectRiskScore(
  simulationKpis: SimulationKpis | null | undefined,
  engineRunId?: string,
): number {
  // ── Prefer engine risk when available ─────────────────────────
  if (engineRunId) {
    const engineRisk = selectEngineRiskScore(engineRunId)
    if (engineRisk !== null) return engineRisk
  }

  // ── Fallback: runway-based heuristic ──────────────────────────
  return riskScoreFromKpis(simulationKpis)
}

/**
 * Internal heuristic fallback — runway + burn intensity.
 * Kept as a named function for traceability; will be removed
 * once engine store is fully wired.
 */
function riskScoreFromKpis(simulationKpis: SimulationKpis | null | undefined): number {
  if (!simulationKpis) return 0

  const runway = simulationKpis.runway
  const burn = simulationKpis.monthlyBurn
  const rev = simulationKpis.revenue

  // Runway-based base score
  let score: number
  if (runway == null || !Number.isFinite(runway)) {
    score = 60
  } else if (runway >= 24) {
    score = 88
  } else if (runway >= 18) {
    score = 78
  } else if (runway >= 12) {
    score = 68
  } else if (runway >= 6) {
    score = 52
  } else {
    score = 30
  }

  // Burn-to-revenue modifier
  if (rev > 0 && burn > 0) {
    const ratio = burn / (rev / 12)
    if (ratio > 2.0) score -= 10
    else if (ratio > 1.5) score -= 5
  }

  return Math.max(0, Math.min(100, score))
}
