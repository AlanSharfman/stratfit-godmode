// src/engine/simulationService.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Centralised simulation trigger
//
// runSimulation(scenarioId) is the ONE entry point for all trigger sources:
//   - InitializeBaselinePage (baseline lock)
//   - WhatIfPage (scenario stack push)
//   - StudioPage (lever change)
//   - AI scenario interpreter (parsed lever write)
//
// RULES:
//   - Must NOT be imported by UI components directly for computation
//   - UI components call runSimulation(id) only — no local metric derivation
//   - Position, Compare, Boardroom READ simulationResults.projections
//   - No React hooks in this file
// ═══════════════════════════════════════════════════════════════════════════

import { usePhase1ScenarioStore } from "@/state/phase1ScenarioStore"
import { computeSimulationProjections } from "./computeSimulationProjections"

export { computeSimulationProjections }
export type { SimulationProjections, ProjectionSeries, ProjectionBand } from "./computeSimulationProjections"

/**
 * Central simulation trigger.
 *
 * Reads the current KPIs from the named scenario in phase1ScenarioStore,
 * computes forward projections (p10/p50/p90 over 24 months), and patches
 * the scenario's simulationResults.projections field in-place via upsertScenario.
 *
 * Safe to call synchronously from any event handler, useEffect, or callback.
 * Does nothing if the scenario or its KPIs are not yet available.
 *
 * @param scenarioId  ID of the scenario to run projections for
 * @param horizonMonths  Optional projection horizon (default: 24)
 */
export function runSimulation(scenarioId: string, horizonMonths = 24): void {
  const store    = usePhase1ScenarioStore.getState()
  const scenario = store.scenarios.find((s) => s.id === scenarioId)

  if (!scenario?.simulationResults?.kpis) {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[simulationService] runSimulation(${scenarioId}): no KPIs available — skipped`)
    }
    return
  }

  const projections = computeSimulationProjections(
    scenario.simulationResults.kpis,
    horizonMonths,
  )

  // Patch projections into the scenario without touching any other field
  store.upsertScenario({
    ...scenario,
    simulationResults: {
      ...scenario.simulationResults,
      projections,
    },
  })

  if (process.env.NODE_ENV === "development") {
    console.debug(`[simulationService] runSimulation(${scenarioId}) ✓`, {
      riskIndex:   projections.riskIndex,
      ev:          projections.enterpriseValueEstimate,
      runway:      projections.runwayMonths,
      p50Revenue12: projections.probabilityBands.p50.revenue[12] ?? null,
    })
  }
}
