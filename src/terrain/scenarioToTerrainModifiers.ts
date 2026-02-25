// src/terrain/scenarioToTerrainModifiers.ts
// STRATFIT — Map scenario levers to terrain visual modifiers
// Steps 22+: used by CompareTerrainPair for dual-terrain A/B rendering

import type { LeverSnapshot } from "@/state/scenarioStore"

export interface TerrainModifiers {
  amplitudeMultiplier: number
  volatility: number
  ridgeBias: number
  drift: number
  seedOffset: number
}

/**
 * Derive terrain visual modifiers from a scenario's lever snapshot.
 * Returns neutral modifiers when scenario is null (baseline).
 */
export function scenarioToTerrainModifiers(
  scenario: { levers?: LeverSnapshot } | null
): TerrainModifiers {
  if (!scenario?.levers) {
    return {
      amplitudeMultiplier: 1.0,
      volatility: 0.3,
      ridgeBias: 0.0,
      drift: 0.0,
      seedOffset: 0,
    }
  }

  const l = scenario.levers

  // Growth levers raise amplitude
  const growthSignal =
    ((l.demandStrength ?? 50) + (l.expansionVelocity ?? 45) + (l.pricingPower ?? 50)) / 3
  const amplitudeMultiplier = 0.6 + (growthSignal / 100) * 0.8

  // Risk levers increase volatility
  const riskSignal =
    ((l.marketVolatility ?? 30) + (l.executionRisk ?? 25) + (l.fundingPressure ?? 20)) / 3
  const volatility = 0.15 + (riskSignal / 100) * 0.5

  // Cost discipline creates ridges (structure)
  const ridgeBias = ((l.costDiscipline ?? 55) - 50) / 100

  // Operating drag creates drift (erosion)
  const drift = ((l.operatingDrag ?? 35) - 30) / 100

  // Deterministic seed offset from hiring intensity
  const seedOffset = Math.round((l.hiringIntensity ?? 40) * 0.1)

  return { amplitudeMultiplier, volatility, ridgeBias, drift, seedOffset }
}
