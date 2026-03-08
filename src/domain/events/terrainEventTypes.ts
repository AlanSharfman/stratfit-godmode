// src/domain/events/terrainEventTypes.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Terrain Event Taxonomy (Pure Domain)
//
// Zero UI dependencies. Pure type definitions, severity helpers, type guards.
// Consumed by engine/analysis, selectors, and terrain render layers.
// ═══════════════════════════════════════════════════════════════════════════

// ── Event type enumeration ──────────────────────────────────────

export const TERRAIN_EVENT_TYPES = [
  "risk_spike",
  "liquidity_stress",
  "volatility_zone",
  "growth_inflection",
  "probability_shift",
  "downside_regime",
] as const

export type TerrainEventType = (typeof TERRAIN_EVENT_TYPES)[number]

// ── Core interface ──────────────────────────────────────────────

export interface TerrainEvent {
  /** Unique identifier for this event instance */
  id: string
  /** Event classification */
  type: TerrainEventType
  /** Normalised severity 0–1 (controls signal intensity) */
  severity: number
  /** Month-index on the simulation horizon (0-based) */
  timestamp: number
  /** KPI metric(s) that sourced this event */
  metricSource: string
  /** Human-readable description */
  description: string
  /** Impact on outcome probability (signed, −1…+1) */
  probabilityImpact: number
  /** Pre-computed world-space coordinates (Y=0 placeholder, resolved by terrain surface) */
  coordinates: { x: number; y: number; z: number }
}

// ── Severity helpers ────────────────────────────────────────────

/** Clamp a value to [0, 1] */
export function clampSeverity(v: number): number {
  return Math.max(0, Math.min(1, v))
}

/** Classify severity into discrete bands */
export type SeverityBand = "low" | "moderate" | "high" | "critical"

export function severityBand(severity: number): SeverityBand {
  if (severity < 0.25) return "low"
  if (severity < 0.5) return "moderate"
  if (severity < 0.75) return "high"
  return "critical"
}

/** Returns true if the event represents a positive signal */
export function isPositiveEvent(event: TerrainEvent): boolean {
  return event.type === "growth_inflection" || event.type === "probability_shift"
}

/** Returns true if the event represents a risk signal */
export function isRiskEvent(event: TerrainEvent): boolean {
  return (
    event.type === "risk_spike" ||
    event.type === "liquidity_stress" ||
    event.type === "downside_regime"
  )
}

// ── Type guards ─────────────────────────────────────────────────

export function isTerrainEventType(value: unknown): value is TerrainEventType {
  return typeof value === "string" && TERRAIN_EVENT_TYPES.includes(value as TerrainEventType)
}

export function isTerrainEvent(value: unknown): value is TerrainEvent {
  if (typeof value !== "object" || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.id === "string" &&
    isTerrainEventType(v.type) &&
    typeof v.severity === "number" &&
    typeof v.timestamp === "number" &&
    typeof v.metricSource === "string" &&
    typeof v.description === "string" &&
    typeof v.probabilityImpact === "number" &&
    typeof v.coordinates === "object" &&
    v.coordinates !== null &&
    typeof (v.coordinates as Record<string, unknown>).x === "number" &&
    typeof (v.coordinates as Record<string, unknown>).y === "number" &&
    typeof (v.coordinates as Record<string, unknown>).z === "number"
  )
}
