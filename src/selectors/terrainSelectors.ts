// src/selectors/terrainSelectors.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Canonical Terrain selectors
//
// Pure functions. No stores. No UI.
// ═══════════════════════════════════════════════════════════════════════════

import type { SimulationResults, TerrainData } from "@/state/phase1ScenarioStore"
import type { TerrainEvent } from "@/domain/events/terrainEventTypes"
import { detectTerrainEvents } from "@/engine/analysis/detectTerrainEvents"

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
 * Derive terrain events from engine results.
 * Returns [] if results are missing or incomplete.
 */
export function selectTerrainEvents(
  simulationResults: SimulationResults | null | undefined,
): TerrainEvent[] {
  if (!simulationResults?.kpis) return []
  return detectTerrainEvents(simulationResults.kpis, simulationResults.horizonMonths)
}
