export type Baseline = {
  cash: number
  monthlyRevenue: number
  monthlyBurn: number
  arr: number
  growthRate: number
  grossMargin: number
  runwayMonths: number
  lastUpdated: number
}

export const BASELINE_STORAGE_KEY = "stratfit:baseline:v1"

/**
 * LEGACY COMPATIBILITY SHIM
 * Some older baseline UI modules still import MetricId.
 * Phase 1 does not migrate/delete those modules yet — we keep this to keep tsc green.
 *
 * NOTE: This is intentionally permissive; we will remove it in a later cleanup phase
 * after BaselinePage/StructuralMetricsPanel are either deleted or migrated.
 */
export type MetricId = string

