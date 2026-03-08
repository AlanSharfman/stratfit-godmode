// src/domain/intelligence/eventFocus.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Event → Focus Position Mapping (Phase A10.1)
//
// Deterministic mapping from a TerrainEvent to a world-space focus position.
// Uses the SAME coordinate function as signal primitives — never guesses.
//
// The caller supplies the month→world mapper (the same one used by
// generateSimulationEvents + TerrainSignalsLayer), keeping this module
// decoupled from engine internals.
// ═══════════════════════════════════════════════════════════════════════════

import type { TerrainEvent } from "@/domain/events/terrainEventTypes"

/**
 * Converts a terrain event to a world-space focus position.
 *
 * Uses the event's pre-computed coordinates (already placed by the engine
 * via monthToTerrainXZ). The `mapMonthToWorld` callback is available as
 * a future override point; by default, the event already carries its
 * coordinates from the engine pipeline.
 *
 * @param event           — Terrain event with coordinates.x, .y, .z
 * @param mapMonthToWorld — Optional override: (monthIndex) → {x, y, z}
 */
export function eventToFocusPosition(
  event: TerrainEvent,
  mapMonthToWorld?: (monthIndex: number) => { x: number; y: number; z: number },
): { x: number; y: number; z: number } {
  if (mapMonthToWorld) {
    return mapMonthToWorld(event.timestamp)
  }
  // Use the pre-computed coordinates from the engine (same mapping as signals)
  return {
    x: event.coordinates.x,
    y: event.coordinates.y,
    z: event.coordinates.z,
  }
}
