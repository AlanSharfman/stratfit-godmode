// src/selectors/riskSelectors.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Canonical Risk selector
//
// Derives risk score from simulation KPIs (runway + burn intensity).
// Pure function. No stores.
// ═══════════════════════════════════════════════════════════════════════════

import type { SimulationKpis } from "@/state/phase1ScenarioStore"

/**
 * Derive a 0–100 risk score from simulation KPIs.
 * Higher = healthier (institutional convention: 85 = stable, < 50 = stressed).
 */
export function selectRiskScore(simulationKpis: SimulationKpis | null | undefined): number {
  if (!simulationKpis) return 0

  const runway = simulationKpis.runway
  const burn = simulationKpis.monthlyBurn
  const cash = simulationKpis.cash
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

  // Burn-to-revenue modifier: penalise when burn significantly outpaces revenue
  if (rev > 0 && burn > 0) {
    const ratio = burn / (rev / 12)
    if (ratio > 2.0) score -= 10
    else if (ratio > 1.5) score -= 5
  }

  return Math.max(0, Math.min(100, score))
}
