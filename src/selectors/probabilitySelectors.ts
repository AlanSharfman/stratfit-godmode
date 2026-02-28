// src/selectors/probabilitySelectors.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Probability selectors for terrain reaction layer
//
// Derives P50 path points (world-space) and stress probability
// from Phase1 simulation results. Pure functions.
// ═══════════════════════════════════════════════════════════════════════════

import type { SimulationKpis, SimulationResults } from "@/state/phase1ScenarioStore"
import { TERRAIN_CONSTANTS } from "@/terrain/terrainConstants"

/** Compact {x,y,z} tuple — avoid importing THREE at selector level */
export interface Vec3 {
  x: number
  y: number
  z: number
}

/**
 * Generate a deterministic P50 trajectory path in terrain world-space.
 * The Y coordinate is set to 0 here — callers should sample terrain height
 * and apply a hover offset when projecting onto the surface.
 *
 * Path shape is modulated by simulation terrain seed for scenario uniqueness.
 */
export function selectP50Path(
  simulationResults: SimulationResults | null | undefined,
  pointCount = 120,
): Vec3[] {
  if (!simulationResults?.terrain) return []

  const seed = simulationResults.terrain.seed
  const mCash = simulationResults.terrain.multipliers.cash
  const mGrowth = simulationResults.terrain.multipliers.growth

  const x0 = -TERRAIN_CONSTANTS.width * 0.36
  const x1 = TERRAIN_CONSTANTS.width * 0.36

  const points: Vec3[] = []
  const amp1 = 18 * mCash
  const amp2 = 8 * mGrowth
  // Deterministic phase from seed
  const phase1 = (seed % 1000) / 1000 * Math.PI * 2
  const phase2 = ((seed >> 10) % 1000) / 1000 * Math.PI * 2

  for (let i = 0; i < pointCount; i++) {
    const t = i / (pointCount - 1)
    const x = x0 + (x1 - x0) * t
    const z =
      Math.sin(t * Math.PI * 2 * 1.05 + phase1) * amp1 +
      Math.sin(t * Math.PI * 2 * 2.35 + phase2) * amp2
    points.push({ x, y: 0, z })
  }

  return points
}

/**
 * Derive a 0..1 stress probability from simulation KPIs.
 *
 * 0 = no stress (healthy)
 * 1 = maximum stress
 *
 * Inverts the risk score (which uses 100=healthy convention) into
 * a stress probability suitable for visual overlays.
 */
export function selectStressProbability(
  simulationKpis: SimulationKpis | null | undefined,
): number {
  if (!simulationKpis) return 0

  const runway = simulationKpis.runway
  const burn = simulationKpis.monthlyBurn
  const cash = simulationKpis.cash
  const rev = simulationKpis.revenue

  // Runway-based stress (inverted from risk score)
  let stress: number
  if (runway == null || !Number.isFinite(runway)) {
    stress = 0.35
  } else if (runway >= 24) {
    stress = 0.08
  } else if (runway >= 18) {
    stress = 0.18
  } else if (runway >= 12) {
    stress = 0.32
  } else if (runway >= 6) {
    stress = 0.55
  } else {
    stress = 0.82
  }

  // Burn-to-revenue modifier
  if (rev > 0 && burn > 0) {
    const ratio = burn / (rev / 12)
    if (ratio > 2.0) stress = Math.min(1, stress + 0.12)
    else if (ratio > 1.5) stress = Math.min(1, stress + 0.06)
  }

  return Math.max(0, Math.min(1, stress))
}

/**
 * Derive probability signals from simulation KPIs.
 * Returns an array of { label, value, tone } signals suitable for
 * the Intelligence panel cascade.
 *
 * Pure function — no stores, no side effects.
 */
export interface ProbabilitySignal {
  label: string
  value: string
  tone: "positive" | "neutral" | "negative"
}

export function selectProbabilitySignals(
  simulationKpis: SimulationKpis | null | undefined,
): ProbabilitySignal[] {
  if (!simulationKpis) return []

  const runway = simulationKpis.runway
  const burn = simulationKpis.monthlyBurn
  const cash = simulationKpis.cash
  const rev = simulationKpis.revenue
  const growth = simulationKpis.growthRate
  const churn = simulationKpis.churnRate

  const signals: ProbabilitySignal[] = []

  // Runway signal
  if (runway != null && Number.isFinite(runway)) {
    signals.push({
      label: "Runway probability",
      value: `${runway} months`,
      tone: runway >= 18 ? "positive" : runway >= 9 ? "neutral" : "negative",
    })
  }

  // Burn-to-revenue ratio
  if (rev > 0 && burn > 0) {
    const ratio = burn / (rev / 12)
    signals.push({
      label: "Burn intensity",
      value: `${ratio.toFixed(1)}x revenue`,
      tone: ratio <= 1.0 ? "positive" : ratio <= 1.5 ? "neutral" : "negative",
    })
  }

  // Growth signal
  if (growth > 0) {
    signals.push({
      label: "Growth trajectory",
      value: `${(growth * 100).toFixed(0)}%`,
      tone: growth >= 0.25 ? "positive" : growth >= 0.10 ? "neutral" : "negative",
    })
  }

  // Churn signal
  if (churn > 0) {
    signals.push({
      label: "Churn pressure",
      value: `${(churn * 100).toFixed(1)}%`,
      tone: churn <= 0.02 ? "positive" : churn <= 0.05 ? "neutral" : "negative",
    })
  }

  // Cash position
  if (cash > 0) {
    signals.push({
      label: "Capital position",
      value: cash >= 1_000_000 ? `$${(cash / 1_000_000).toFixed(1)}M` : `$${(cash / 1_000).toFixed(0)}K`,
      tone: cash >= 2_000_000 ? "positive" : cash >= 500_000 ? "neutral" : "negative",
    })
  }

  return signals
}
