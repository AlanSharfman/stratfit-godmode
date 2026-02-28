// src/selectors/kpiSelectors.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Canonical KPI selector layer
//
// Single read interface between Phase1 simulation results and all UI.
// Pure functions. No stores. No side effects.
// ═══════════════════════════════════════════════════════════════════════════

import type { SimulationKpis } from "@/state/phase1ScenarioStore"

/** Flat KPI shape consumed by KPIHealthRail and other UI surfaces */
export interface SelectedKpis {
  arr: number
  revenue: number
  runwayMonths: number | null
  burnMonthly: number
  grossMargin: number
  valuation: number | null
  cashOnHand: number
  growthRate: number
  churnRate: number
  headcount: number
  arpa: number
}

/**
 * Extract canonical KPIs from Phase1 simulation results.
 * Returns null if simulationKpis is undefined/null.
 */
export function selectKpis(simulationKpis: SimulationKpis | null | undefined): SelectedKpis | null {
  if (!simulationKpis) return null
  return {
    arr: simulationKpis.revenue * 12,
    revenue: simulationKpis.revenue,
    runwayMonths: simulationKpis.runway,
    burnMonthly: simulationKpis.monthlyBurn,
    grossMargin: simulationKpis.grossMargin,
    valuation: null, // not yet computed by Phase1 engine
    cashOnHand: simulationKpis.cash,
    growthRate: simulationKpis.growthRate,
    churnRate: simulationKpis.churnRate,
    headcount: simulationKpis.headcount,
    arpa: simulationKpis.arpa,
  }
}

/** Delta between two KPI snapshots (scenario − baseline) */
export interface KpiDeltas {
  arrDelta: number
  revenueDelta: number
  runwayDelta: number | null
  burnDelta: number
  grossMarginDelta: number
  cashDelta: number
  growthRateDelta: number
}

/**
 * Compute absolute deltas between scenario and baseline KPIs.
 * Returns null if either input is null.
 */
export function selectKpiDeltas(
  baselineKpis: SelectedKpis | null,
  scenarioKpis: SelectedKpis | null,
): KpiDeltas | null {
  if (!baselineKpis || !scenarioKpis) return null
  return {
    arrDelta: scenarioKpis.arr - baselineKpis.arr,
    revenueDelta: scenarioKpis.revenue - baselineKpis.revenue,
    runwayDelta:
      scenarioKpis.runwayMonths != null && baselineKpis.runwayMonths != null
        ? scenarioKpis.runwayMonths - baselineKpis.runwayMonths
        : null,
    burnDelta: scenarioKpis.burnMonthly - baselineKpis.burnMonthly,
    grossMarginDelta: scenarioKpis.grossMargin - baselineKpis.grossMargin,
    cashDelta: scenarioKpis.cashOnHand - baselineKpis.cashOnHand,
    growthRateDelta: scenarioKpis.growthRate - baselineKpis.growthRate,
  }
}
