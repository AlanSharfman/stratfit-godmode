/**
 * STRATFIT — KPI Safety Bounds
 *
 * Hard percentage caps on scenario KPI deltas. Any simulation output
 * that exceeds these bounds is clamped and flagged. This prevents
 * absurd terrain deformations from unrealistic scenario inputs.
 */

import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"

export interface KpiBound {
  min: number
  max: number
}

export const KPI_BOUNDS: Record<string, KpiBound> = {
  cash:            { min: -30, max: 30 },
  runway:          { min: -30, max: 30 },
  growth:          { min: -40, max: 40 },
  revenue:         { min: -35, max: 35 },
  burn:            { min: -50, max: 50 },
  enterpriseValue: { min: -35, max: 35 },
  arr:             { min: -35, max: 35 },
  churn:           { min: -25, max: 25 },
  grossMargin:     { min: -20, max: 20 },
  headcount:       { min: -40, max: 40 },
}

export interface ClampResult {
  clamped: Partial<Record<KpiKey, number>>
  warnings: string[]
}

/**
 * Clamp percentage deltas to safety bounds.
 * Returns the clamped values and a list of any breaches.
 */
export function clampKpiDeltas(
  deltas: Partial<Record<KpiKey, number>>,
): ClampResult {
  const clamped: Partial<Record<KpiKey, number>> = {}
  const warnings: string[] = []

  for (const [key, value] of Object.entries(deltas) as [KpiKey, number][]) {
    const bound = KPI_BOUNDS[key]
    if (!bound) {
      clamped[key] = value
      continue
    }

    if (value < bound.min) {
      warnings.push(`${key} delta ${value}% clamped to ${bound.min}% (exceeded lower bound)`)
      clamped[key] = bound.min
    } else if (value > bound.max) {
      warnings.push(`${key} delta ${value}% clamped to ${bound.max}% (exceeded upper bound)`)
      clamped[key] = bound.max
    } else {
      clamped[key] = value
    }
  }

  return { clamped, warnings }
}

/**
 * Clamp absolute force values against percentage bounds applied to baseline.
 */
export function clampForces(
  forces: Partial<Record<KpiKey, number>>,
  baselineValues: Partial<Record<KpiKey, number>>,
): ClampResult {
  const clamped: Partial<Record<KpiKey, number>> = {}
  const warnings: string[] = []

  for (const [key, force] of Object.entries(forces) as [KpiKey, number][]) {
    const baseline = baselineValues[key]
    const bound = KPI_BOUNDS[key]

    if (!bound || !baseline || baseline === 0) {
      clamped[key] = force
      continue
    }

    const pct = (force / baseline) * 100
    if (pct < bound.min) {
      const clampedForce = Math.round((baseline * bound.min) / 100)
      warnings.push(`${key} force ${force} (${pct.toFixed(0)}%) clamped to ${clampedForce} (${bound.min}%)`)
      clamped[key] = clampedForce
    } else if (pct > bound.max) {
      const clampedForce = Math.round((baseline * bound.max) / 100)
      warnings.push(`${key} force ${force} (${pct.toFixed(0)}%) clamped to ${clampedForce} (${bound.max}%)`)
      clamped[key] = clampedForce
    } else {
      clamped[key] = force
    }
  }

  return { clamped, warnings }
}
