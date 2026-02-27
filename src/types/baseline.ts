export type Baseline = {
  cash: number
  monthlyBurn: number
  revenue: number
  grossMargin: number
  growthRate: number
  churnRate: number
  headcount: number
  arpa: number
}

export const BASELINE_STORAGE_KEY = "stratfit:baseline:v1"

/**
 * Temporary compatibility shim.
 * Some legacy components still import MetricId.
 * This will be removed in Phase 2.
 */
export type MetricId = string
