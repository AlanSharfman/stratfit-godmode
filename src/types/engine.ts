// src/types/engine.ts
// STRATFIT — Canonical engine types for KPI selectors + divergence
//
// Aligned with scenarioStore.ts:
//   KPIValue  = { value: number; display?: string }
//   EngineResult = { kpis: Record<string, KPIValue>; ... }
//   engineResults: Record<string, EngineResult>

/** Scenario-level KPIs extracted from engine results */
export interface ScenarioKpis {
  survivalProbability: number
  runwayMonths: number
  enterpriseValue: number
  netBurn: number
}

/** Divergence between baseline and scenario KPIs */
export interface DivergenceResult {
  survivalDelta: number
  runwayDelta: number
  enterpriseValueDelta: number
  burnDelta: number
}

/** Shape of a single engine result (mirrors scenarioStore.EngineResult) */
export interface EngineResults {
  kpis: ScenarioKpis
  ai?: { summary: string }
  timeline?: Array<{
    month: number
    valuation: number
    arr: number
    runway: number
    cash: number
    risk: number
    totalFunding: number
  }>
}
