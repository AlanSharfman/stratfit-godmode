// src/core/engine/types.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Canonical Engine Output Types
//
// All terrain, KPI, and simulation values MUST originate from
// engineResults.timeline[]. No UI-side derivation.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * A single point in the engine's timeline output.
 * Every terrain height, color, and metric derives from this.
 */
export interface EngineTimelinePoint {
  /** 0-based index into the timeline */
  timeIndex: number;
  /** Projected revenue at this step ($M) */
  revenue: number;
  /** Projected EBITDA at this step ($M) */
  ebitda: number;
  /** Risk index at this step (0..1, higher = more risk) */
  riskIndex: number;
  /** Projected enterprise value at this step ($M) */
  enterpriseValue: number;
}

/**
 * Aggregate summary over the full simulation horizon.
 */
export interface EngineSummary {
  peakRevenue: number;
  peakEV: number;
  avgRiskIndex: number;
  terminalEbitda: number;
  cagr: number;
}

/**
 * Canonical engine output.
 * `timeline` is the time-series array — one entry per simulation step.
 * `summary` is the aggregate roll-up.
 */
export interface EngineResults {
  timeline: EngineTimelinePoint[];
  summary: EngineSummary;
}
