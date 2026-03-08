// src/components/compare/compareKpi.ts
/**
 * STEP 30 — Compare KPI Deduplication Lock
 *
 * SINGLE Compare entrypoint for KPI reads/formatting.
 * Canonical truth source:
 *   engineResults[scenarioId].kpis (KPIMap)
 *
 * Everything routes through:
 *   src/simulation/engineKpiSelectors.ts
 *
 * No stores. No side effects. Deterministic.
 */

import type { EngineResults, KPIMap } from "@/simulation/engineKpiSelectors"
import {
  BASELINE_ID,
  selectKpis,
  kpiNumber,
  kpiDisplay,
  deltaAbs,
  deltaPct,
  fmtDeltaAbs,
  fmtDeltaPct,
} from "@/simulation/engineKpiSelectors"

export { BASELINE_ID } // re-export for Compare modules

/**
 * Preserve the signature already used in ComparePage.tsx (per your grep).
 */
export function extractKpis(
  engineResults: EngineResults | null | undefined,
  scenarioId: string
): KPIMap | null {
  return selectKpis(engineResults, scenarioId) ?? null
}

/**
 * Canonical numeric KPI value.
 */
export function kpiVal(kpis: KPIMap | null | undefined, key: string): number | null {
  return kpiNumber(kpis, key)
}

/**
 * Canonical formatted display KPI string.
 * Uses kpiTaxonomy formatting via kpiSelectors -> kpiDisplay().
 */
export function kpiText(kpis: KPIMap | null | undefined, key: string): string {
  return kpiDisplay(kpis, key)
}

/**
 * Canonical delta helpers.
 */
export function kpiDeltaAbs(baseKpis: KPIMap | null, scenKpis: KPIMap | null, key: string): number | null {
  return deltaAbs(kpiVal(baseKpis, key), kpiVal(scenKpis, key))
}

export function kpiDeltaPct(baseKpis: KPIMap | null, scenKpis: KPIMap | null, key: string): number | null {
  return deltaPct(kpiVal(baseKpis, key), kpiVal(scenKpis, key))
}

export function kpiDeltaAbsText(baseKpis: KPIMap | null, scenKpis: KPIMap | null, key: string): string {
  return fmtDeltaAbs(kpiDeltaAbs(baseKpis, scenKpis, key))
}

export function kpiDeltaPctText(baseKpis: KPIMap | null, scenKpis: KPIMap | null, key: string): string {
  return fmtDeltaPct(kpiDeltaPct(baseKpis, scenKpis, key))
}
