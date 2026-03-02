// src/engine/analysis/detectTerrainEvents.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Terrain Event Detector (Pure Engine Logic)
//
// Accepts engine KPIs + horizon → outputs deterministic TerrainEvent[].
// No UI logic, no React, no stores. Pure analysis function.
//
// Coordinate mapping follows the P50Path meander formula so events
// are anchored to the correct terrain timeline position.
// ═══════════════════════════════════════════════════════════════════════════

import type { TerrainEvent } from "@/domain/events/terrainEventTypes"
import { clampSeverity } from "@/domain/events/terrainEventTypes"

// ── KPI input contract ──────────────────────────────────────────

export interface DetectionKpis {
  cash: number
  monthlyBurn: number
  revenue: number
  grossMargin: number
  growthRate: number
  churnRate: number
  runway: number | null
}

// ── Terrain coordinate constants (matches P50Path + TimelineTicks) ──

const TERRAIN_WIDTH = 560
const PATH_X0 = -TERRAIN_WIDTH * 0.36 // ≈ -201.6
const PATH_X1 = TERRAIN_WIDTH * 0.36  // ≈ +201.6

const MEANDER_AMP1 = 22
const MEANDER_AMP2 = 9
const MEANDER_W1 = Math.PI * 2 * 1.05
const MEANDER_W2 = Math.PI * 2 * 2.35
const MEANDER_P1 = 0.75
const MEANDER_P2 = 1.9

/** Map a month timestamp to terrain XZ along the P50 meander. Y=0 placeholder. */
function monthToTerrainXZ(month: number, horizonMonths: number): { x: number; z: number } {
  const t = Math.max(0, Math.min(1, month / Math.max(1, horizonMonths)))
  const x = PATH_X0 + t * (PATH_X1 - PATH_X0)
  const z =
    Math.sin(t * MEANDER_W1 + MEANDER_P1) * MEANDER_AMP1 +
    Math.sin(t * MEANDER_W2 + MEANDER_P2) * MEANDER_AMP2
  return { x, z }
}

// ── Detection ───────────────────────────────────────────────────

/**
 * Deterministic terrain event detection.
 *
 * Rules are threshold-based — no randomness, no UI logic.
 * Each event carries pre-computed coordinates along the terrain timeline.
 */
export function detectTerrainEvents(
  kpis: DetectionKpis | null,
  horizonMonths: number,
): TerrainEvent[] {
  if (!kpis) return []

  const events: TerrainEvent[] = []
  const runway = kpis.runway ?? horizonMonths

  const coords = (month: number) => {
    const { x, z } = monthToTerrainXZ(month, horizonMonths)
    return { x, y: 0, z }
  }

  // ── risk_spike — burn ratio dangerously high ──
  if (kpis.monthlyBurn > 0 && kpis.revenue > 0) {
    const burnRatio = kpis.monthlyBurn / kpis.revenue
    if (burnRatio > 1.3) {
      const month = Math.round(horizonMonths * 0.3)
      events.push({
        id: "risk-spike",
        type: "risk_spike",
        severity: clampSeverity((burnRatio - 1.3) / 1.7),
        timestamp: month,
        metricSource: "monthlyBurn/revenue",
        description: `Burn ratio ${burnRatio.toFixed(1)}× revenue — elevated operational risk`,
        probabilityImpact: -clampSeverity((burnRatio - 1.3) / 2),
        coordinates: coords(month),
      })
    }
  }

  // ── liquidity_stress — runway shorter than horizon ──
  if (runway > 0 && runway < horizonMonths) {
    const month = Math.round(runway)
    const severityRaw = 1 - runway / horizonMonths
    events.push({
      id: "liquidity-stress",
      type: "liquidity_stress",
      severity: clampSeverity(severityRaw),
      timestamp: month,
      metricSource: "runway",
      description: `Cash runway exhausted at month ${month} of ${horizonMonths}`,
      probabilityImpact: -clampSeverity(severityRaw * 0.8),
      coordinates: coords(month),
    })
  }

  // ── volatility_zone — high churn + low margin ──
  if (kpis.churnRate > 0.04 || kpis.grossMargin < 0.4) {
    const churnSev = clampSeverity((kpis.churnRate - 0.04) / 0.08)
    const marginSev = clampSeverity((0.5 - kpis.grossMargin) / 0.3)
    const severity = clampSeverity(Math.max(churnSev, marginSev))
    if (severity > 0.1) {
      const month = Math.round(horizonMonths * 0.45)
      events.push({
        id: "volatility-zone",
        type: "volatility_zone",
        severity,
        timestamp: month,
        metricSource: "churnRate,grossMargin",
        description: `Volatile unit economics — churn ${(kpis.churnRate * 100).toFixed(1)}%, margin ${(kpis.grossMargin * 100).toFixed(0)}%`,
        probabilityImpact: -severity * 0.3,
        coordinates: coords(month),
      })
    }
  }

  // ── growth_inflection — revenue can outpace burn ──
  if (kpis.revenue > 0 && kpis.monthlyBurn > 0 && kpis.growthRate > 0) {
    const gap = kpis.monthlyBurn - kpis.revenue
    if (gap > 0) {
      const monthsToBreakeven = Math.ceil(
        Math.log(kpis.monthlyBurn / kpis.revenue) / Math.log(1 + kpis.growthRate),
      )
      if (monthsToBreakeven > 0 && monthsToBreakeven <= horizonMonths) {
        events.push({
          id: "growth-inflection",
          type: "growth_inflection",
          severity: clampSeverity(1 - monthsToBreakeven / horizonMonths),
          timestamp: monthsToBreakeven,
          metricSource: "revenue,growthRate",
          description: `Revenue crosses burn at month ${monthsToBreakeven} (${(kpis.growthRate * 100).toFixed(1)}% MoM growth)`,
          probabilityImpact: clampSeverity(0.3 + (1 - monthsToBreakeven / horizonMonths) * 0.5),
          coordinates: coords(monthsToBreakeven),
        })
      }
    }
  }

  // ── probability_shift — compound positive signals ──
  const positiveSignals =
    (kpis.growthRate > 0.08 ? 1 : 0) +
    (kpis.grossMargin > 0.6 ? 1 : 0) +
    (kpis.churnRate < 0.03 ? 1 : 0) +
    (runway >= horizonMonths ? 1 : 0)
  if (positiveSignals >= 2) {
    const month = Math.round(horizonMonths * 0.65)
    const severity = clampSeverity(positiveSignals / 4)
    events.push({
      id: "probability-shift",
      type: "probability_shift",
      severity,
      timestamp: month,
      metricSource: "growthRate,grossMargin,churnRate,runway",
      description: `${positiveSignals}/4 positive signals — outcome probability elevated`,
      probabilityImpact: clampSeverity(severity * 0.6),
      coordinates: coords(month),
    })
  }

  // ── downside_regime — multiple risk factors compound ──
  const riskFactors =
    (kpis.monthlyBurn > kpis.revenue * 2 ? 1 : 0) +
    (runway < horizonMonths * 0.5 ? 1 : 0) +
    (kpis.churnRate > 0.06 ? 1 : 0) +
    (kpis.grossMargin < 0.3 ? 1 : 0)
  if (riskFactors >= 2) {
    const month = Math.round(horizonMonths * 0.5)
    const severity = clampSeverity(riskFactors / 4)
    events.push({
      id: "downside-regime",
      type: "downside_regime",
      severity,
      timestamp: month,
      metricSource: "monthlyBurn,runway,churnRate,grossMargin",
      description: `${riskFactors}/4 risk factors active — downside regime`,
      probabilityImpact: -clampSeverity(severity * 0.7),
      coordinates: coords(month),
    })
  }

  return events
}
