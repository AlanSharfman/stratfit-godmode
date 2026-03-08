// src/domain/intelligence/selectPrimarySignal.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Primary Signal Selector (Phase A10.1)
//
// Deterministic selection of the single most important terrain event.
// Priority by type → intensity desc → monthIndex desc.
// Pure function. No UI. No stores.
// ═══════════════════════════════════════════════════════════════════════════

import type { TerrainEvent, TerrainEventType } from "@/domain/events/terrainEventTypes"

// ── Priority map (higher = more important) ──────────────────────

const TYPE_PRIORITY: Record<TerrainEventType, number> = {
  liquidity_stress: 100,
  risk_spike: 90,
  downside_regime: 80,
  volatility_zone: 70,
  probability_shift: 60,
  growth_inflection: 50,
}

// ── Intensity computation (matches signalStyle.computeSignalIntensity) ──

function computeIntensity(severity: number, probabilityImpact: number): number {
  const raw = 0.65 * severity + 0.35 * Math.abs(probabilityImpact)
  return Math.max(0, Math.min(1, raw))
}

// ── Public API ──────────────────────────────────────────────────

/**
 * Select the single most important terrain event from a list.
 *
 * Sort order:
 *   1. Type priority (descending)
 *   2. Computed intensity (descending)
 *   3. monthIndex / timestamp (descending — later events win ties)
 *
 * Returns null when the list is empty.
 */
export function selectPrimarySignal(events: TerrainEvent[]): TerrainEvent | null {
  if (events.length === 0) return null

  const scored = events.map((e) => ({
    event: e,
    priority: TYPE_PRIORITY[e.type],
    intensity: computeIntensity(e.severity, e.probabilityImpact),
  }))

  scored.sort((a, b) => {
    if (a.priority !== b.priority) return b.priority - a.priority
    if (a.intensity !== b.intensity) return b.intensity - a.intensity
    return b.event.timestamp - a.event.timestamp
  })

  return scored[0].event
}
