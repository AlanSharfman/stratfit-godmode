// src/core/simulation/timelineTypes.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Canonical Timeline Types
//
// TIME IS A FIRST-CLASS DIMENSION.
// Every terrain state corresponds to a specific simulation timestep.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Resolution granularity for the simulation timeline.
 *   monthly   → each step = 1 calendar month
 *   quarterly → each step = 1 fiscal quarter
 *   yearly    → each step = 1 fiscal year
 */
export type TimelineResolution = "monthly" | "quarterly" | "yearly";

/**
 * Configuration supplied to the timeline generator.
 *
 * @field resolution  — temporal granularity
 * @field horizon     — number of years to simulate
 * @field steps       — derived: total discrete steps
 */
export interface TimelineConfig {
  resolution: TimelineResolution;
  horizon: number;
  steps: number;
}

/**
 * A single discrete point on the simulation timeline.
 *
 * @field index     — 0-based ordinal
 * @field label     — human-readable label ("Q1 Y1", "Mar Y2", "Y3")
 * @field timestamp — epoch-ms of the step's start date
 */
export interface TimelineStep {
  index: number;
  label: string;
  timestamp: number;
}

/**
 * The complete generated timeline — an ordered array of steps.
 */
export interface TimelineSeries {
  steps: TimelineStep[];
}
