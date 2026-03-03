// src/selectors/terrainSelectors.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Canonical Terrain selectors
//
// Pure functions. No stores. No UI.
// ═══════════════════════════════════════════════════════════════════════════

import type { SimulationResults, TerrainData } from "@/state/phase1ScenarioStore"
import type { TerrainEvent } from "@/domain/events/terrainEventTypes"

// Re-export timeline selectors for unified access
export {
  selectTimelineTerrainMetrics,
  lerpTerrainMetrics,
} from "@/selectors/timelineTerrainSelectors"

/**
 * Extract terrain data from Phase1 simulation results.
 * Returns null if results are missing or incomplete.
 */
export function selectTerrainMetrics(
  simulationResults: SimulationResults | null | undefined,
): TerrainData | null {
  if (!simulationResults?.terrain) return null
  return simulationResults.terrain
}

/**
 * Read engine-generated terrain events — pass-through only.
 * Events are produced by generateSimulationEvents() in the engine layer
 * and attached to SimulationResults.events during runSimulation().
 * This selector performs NO derivation.
 */
export function selectTerrainEvents(
  simulationResults: SimulationResults | null | undefined,
): TerrainEvent[] {
  return simulationResults?.events ?? []
}
