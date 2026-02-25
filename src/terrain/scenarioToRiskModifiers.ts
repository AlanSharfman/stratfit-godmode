// src/terrain/scenarioToRiskModifiers.ts
// STRATFIT — Map scenario levers to risk field visual modifiers
// Step 27: used by CompareRiskPair for dual-risk A/B rendering

import type { LeverSnapshot } from "@/state/scenarioStore"

export interface RiskModifiers {
  /** Overall risk intensity (0–1) — drives node size */
  intensity: number
  /** Concentration factor — how clustered the risk nodes are */
  concentration: number
  /** Funding pressure visibility (0–1) */
  fundingPressure: number
  /** Execution risk visibility (0–1) */
  executionRisk: number
}

/**
 * Derive risk field visual modifiers from a scenario's lever snapshot.
 * Returns neutral (low-risk) modifiers when scenario is null (baseline).
 */
export function scenarioToRiskModifiers(
  scenario: { levers?: LeverSnapshot } | null
): RiskModifiers {
  if (!scenario?.levers) {
    return {
      intensity: 0.25,
      concentration: 0.3,
      fundingPressure: 0.2,
      executionRisk: 0.25,
    }
  }

  const l = scenario.levers

  const intensity =
    ((l.marketVolatility ?? 30) + (l.executionRisk ?? 25) + (l.fundingPressure ?? 20)) / 300

  const concentration = (l.operatingDrag ?? 35) / 100

  const fundingPressure = (l.fundingPressure ?? 20) / 100
  const executionRisk = (l.executionRisk ?? 25) / 100

  return { intensity, concentration, fundingPressure, executionRisk }
}
