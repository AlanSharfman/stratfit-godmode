// src/terrain/scenarioToPathModifiers.ts
// STRATFIT — Map scenario levers to trajectory path modifiers
// Steps 26+: used by ComparePathPair for dual-path A/B rendering

import type { LeverSnapshot } from "@/state/scenarioStore"

export interface PathModifiers {
  /** Vertical offset multiplier for the trajectory curve (1 = neutral) */
  elevationScale: number
  /** Lateral sway factor (higher = more wander) */
  lateralSway: number
  /** Color hue shift in degrees (0 = neutral cyan) */
  hueShift: number
  /** Opacity of the path ribbon */
  opacity: number
}

/**
 * Derive path visual modifiers from a scenario's lever snapshot.
 * Returns neutral modifiers when scenario is null (baseline).
 */
export function scenarioToPathModifiers(
  scenario: { levers?: LeverSnapshot } | null
): PathModifiers {
  if (!scenario?.levers) {
    return {
      elevationScale: 1.0,
      lateralSway: 0.0,
      hueShift: 0,
      opacity: 0.85,
    }
  }

  const l = scenario.levers

  // Growth levers raise the path
  const growthSignal =
    ((l.demandStrength ?? 50) + (l.expansionVelocity ?? 45) + (l.pricingPower ?? 50)) / 3
  const elevationScale = 0.7 + (growthSignal / 100) * 0.6

  // Risk levers add lateral sway
  const riskSignal =
    ((l.marketVolatility ?? 30) + (l.executionRisk ?? 25)) / 2
  const lateralSway = riskSignal / 100

  // Scenario type shifts hue (demand-heavy = green, risk-heavy = amber)
  const balance = growthSignal - riskSignal
  const hueShift = balance > 0 ? balance * 0.8 : balance * 1.2

  const opacity = 0.85

  return { elevationScale, lateralSway, hueShift, opacity }
}
