// src/engine/analysis/detectTerrainEvents.ts
// ═══════════════════════════════════════════════════════════════════════════
// DEPRECATED — Phase A7 replaced this with generateSimulationEvents.ts
//
// This file re-exports the new generator for backward compatibility.
// All callers should migrate to:
//   import { generateSimulationEvents } from "@/engine/analysis/generateSimulationEvents"
// ═══════════════════════════════════════════════════════════════════════════

import type { TerrainEvent } from "@/domain/events/terrainEventTypes"
import type { SimulationKpis } from "@/state/phase1ScenarioStore"
import { generateSimulationEvents } from "@/engine/analysis/generateSimulationEvents"

/** @deprecated Use generateSimulationEvents() instead */
export type DetectionKpis = SimulationKpis

/** @deprecated Use generateSimulationEvents() instead */
export function detectTerrainEvents(
  kpis: DetectionKpis | SimulationKpis | null,
  horizonMonths: number,
): TerrainEvent[] {
  if (!kpis) return []
  return generateSimulationEvents(kpis as SimulationKpis, horizonMonths)
}
