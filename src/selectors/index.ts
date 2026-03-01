// src/selectors/index.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Canonical selector barrel
//
// Single import surface for all selector functions + types.
//
// ┌─────────────────────────────────────────────────────────────────────┐
// │  CI GUARD: UI must NOT read engineResults / simulationResults      │
// │  directly. All simulation data flows through these selectors.      │
// │  simulationResults → selectors → UI                               │
// │  Violation = architecture break. Enforce in PR review.             │
// └─────────────────────────────────────────────────────────────────────┘
// ═══════════════════════════════════════════════════════════════════════════

export { selectKpis, selectKpiDeltas, selectPositionKpis } from "./kpiSelectors"
export type { SelectedKpis, KpiDeltas } from "./kpiSelectors"

export { selectRiskScore } from "./riskSelectors"

export { selectTerrainMetrics } from "./terrainSelectors"

export { selectP50Path, selectStressProbability, selectProbabilitySignals } from "./probabilitySelectors"
export type { Vec3, ProbabilitySignal } from "./probabilitySelectors"

export { selectDrivers } from "./driverSelectors"
export type { DriverSignal } from "./driverSelectors"

// ── Pipeline selectors (God Mode Wiring v1) ──
export {
  selectValuationSummary,
  selectRiskSummary,
  selectNarrativeBlocks,
  probabilityBandFromPct,
  probabilityBandLabel,
  stableHash,
} from "@/contracts/simulationPipeline"
export type {
  ValuationSummary,
  RiskSummary,
  NarrativeBlock,
  ProbabilityBand,
} from "@/contracts/simulationPipeline"
