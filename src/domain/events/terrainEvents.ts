// src/domain/events/terrainEvents.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Terrain Event Domain Contract (Phase A7)
//
// Pure domain types, helpers, and constants for deterministic event pipeline.
// Zero UI dependencies. Consumed by engine/analysis, selectors, and terrain
// render layers.
//
// Re-exports from terrainEventTypes.ts for backward compat, plus Phase A7
// deterministic primitives: clamp01, smooth3, eps.
// ═══════════════════════════════════════════════════════════════════════════

// ── Re-exports (canonical types) ────────────────────────────────

export type {
  TerrainEventType,
  TerrainEvent,
  SeverityBand,
} from "./terrainEventTypes"

export {
  TERRAIN_EVENT_TYPES,
  clampSeverity,
  severityBand,
  isPositiveEvent,
  isRiskEvent,
  isTerrainEventType,
  isTerrainEvent,
} from "./terrainEventTypes"

// ── Phase A7 — Deterministic primitives ─────────────────────────

/** Machine epsilon for safe division */
export const eps = 1e-6

/** Clamp a value to [0, 1] */
export function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x))
}

/**
 * 3-point median smoother with edge clamping.
 * Returns a new array of the same length.
 */
export function smooth3(a: number[]): number[] {
  if (a.length === 0) return []
  if (a.length === 1) return [a[0]]

  const out: number[] = new Array(a.length)
  out[0] = median3(a[0], a[0], a[1])
  for (let i = 1; i < a.length - 1; i++) {
    out[i] = median3(a[i - 1], a[i], a[i + 1])
  }
  out[a.length - 1] = median3(a[a.length - 2], a[a.length - 1], a[a.length - 1])
  return out
}

/** Median of 3 values */
function median3(a: number, b: number, c: number): number {
  if (a <= b) {
    if (b <= c) return b  // a <= b <= c
    if (a <= c) return c  // a <= c < b
    return a              // c < a <= b
  }
  // b < a
  if (a <= c) return a    // b < a <= c
  if (b <= c) return c    // b <= c < a
  return b                // c < b < a
}
