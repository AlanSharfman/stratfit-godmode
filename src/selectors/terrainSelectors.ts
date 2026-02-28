// src/selectors/terrainSelectors.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Canonical Terrain selector
//
// Extracts terrain multipliers / data from Phase1 simulation results.
// Pure function. No stores.
// ═══════════════════════════════════════════════════════════════════════════

import type { SimulationResults, TerrainData } from "@/state/phase1ScenarioStore"

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
