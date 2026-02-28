// src/selectors/driverSelectors.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Canonical Driver selector
//
// Identifies top 3 variables with highest impact between baseline
// and scenario KPIs.
// Pure function. No stores.
// ═══════════════════════════════════════════════════════════════════════════

import type { SelectedKpis, KpiDeltas } from "@/selectors/kpiSelectors"

export interface DriverSignal {
  key: string
  label: string
  baselineValue: number
  scenarioValue: number
  absoluteDelta: number
  /** Percentage change: (scenario − baseline) / |baseline| × 100 */
  pctDelta: number | null
  direction: "up" | "down" | "flat"
}

/**
 * Derive ranked list of top drivers (variables with largest percentage impact).
 * Returns empty array if inputs are null.
 */
export function selectDrivers(
  baselineKpis: SelectedKpis | null,
  scenarioKpis: SelectedKpis | null,
  deltas: KpiDeltas | null,
): DriverSignal[] {
  if (!baselineKpis || !scenarioKpis || !deltas) return []

  const entries: DriverSignal[] = [
    {
      key: "revenue",
      label: "Revenue growth",
      baselineValue: baselineKpis.revenue,
      scenarioValue: scenarioKpis.revenue,
      absoluteDelta: deltas.revenueDelta,
      pctDelta: pctChange(baselineKpis.revenue, scenarioKpis.revenue),
      direction: dir(deltas.revenueDelta),
    },
    {
      key: "burn",
      label: "Cost discipline",
      baselineValue: baselineKpis.burnMonthly,
      scenarioValue: scenarioKpis.burnMonthly,
      absoluteDelta: deltas.burnDelta,
      pctDelta: pctChange(baselineKpis.burnMonthly, scenarioKpis.burnMonthly),
      direction: dir(-deltas.burnDelta), // lower burn = positive
    },
    {
      key: "cash",
      label: "Capital position",
      baselineValue: baselineKpis.cashOnHand,
      scenarioValue: scenarioKpis.cashOnHand,
      absoluteDelta: deltas.cashDelta,
      pctDelta: pctChange(baselineKpis.cashOnHand, scenarioKpis.cashOnHand),
      direction: dir(deltas.cashDelta),
    },
    {
      key: "runway",
      label: "Funding runway",
      baselineValue: baselineKpis.runwayMonths ?? 0,
      scenarioValue: scenarioKpis.runwayMonths ?? 0,
      absoluteDelta: deltas.runwayDelta ?? 0,
      pctDelta: pctChange(baselineKpis.runwayMonths ?? 0, scenarioKpis.runwayMonths ?? 0),
      direction: dir(deltas.runwayDelta ?? 0),
    },
    {
      key: "growthRate",
      label: "Growth acceleration",
      baselineValue: baselineKpis.growthRate,
      scenarioValue: scenarioKpis.growthRate,
      absoluteDelta: deltas.growthRateDelta,
      pctDelta: pctChange(baselineKpis.growthRate, scenarioKpis.growthRate),
      direction: dir(deltas.growthRateDelta),
    },
  ]

  // Rank by absolute percentage change, descending
  return entries
    .filter((e) => e.pctDelta !== null && Math.abs(e.pctDelta) > 0.1)
    .sort((a, b) => Math.abs(b.pctDelta ?? 0) - Math.abs(a.pctDelta ?? 0))
    .slice(0, 3)
}

function pctChange(base: number, scenario: number): number | null {
  if (base === 0) return null
  return ((scenario - base) / Math.abs(base)) * 100
}

function dir(delta: number): "up" | "down" | "flat" {
  if (delta > 0.01) return "up"
  if (delta < -0.01) return "down"
  return "flat"
}
