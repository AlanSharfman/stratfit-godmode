// src/core/simulation/buildTimeline.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Timeline Generator
//
// Converts a TimelineConfig into a fully-resolved TimelineSeries.
// Pure function — no side effects, no stores.
// ═══════════════════════════════════════════════════════════════════════════

import type {
  TimelineConfig,
  TimelineResolution,
  TimelineSeries,
  TimelineStep,
} from "./timelineTypes";

// ────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// ────────────────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────────────────

function stepsForResolution(resolution: TimelineResolution, horizon: number): number {
  switch (resolution) {
    case "monthly":   return horizon * 12;
    case "quarterly": return horizon * 4;
    case "yearly":    return horizon;
  }
}

function labelForStep(resolution: TimelineResolution, index: number): string {
  switch (resolution) {
    case "monthly": {
      const month = index % 12;
      const year = Math.floor(index / 12) + 1;
      return `${MONTH_NAMES[month]} Y${year}`;
    }
    case "quarterly": {
      const quarter = (index % 4) + 1;
      const year = Math.floor(index / 4) + 1;
      return `Q${quarter} Y${year}`;
    }
    case "yearly": {
      return `Y${index + 1}`;
    }
  }
}

function timestampForStep(
  resolution: TimelineResolution,
  index: number,
  baseDate: Date,
): number {
  const d = new Date(baseDate);
  switch (resolution) {
    case "monthly":
      d.setMonth(d.getMonth() + index);
      break;
    case "quarterly":
      d.setMonth(d.getMonth() + index * 3);
      break;
    case "yearly":
      d.setFullYear(d.getFullYear() + index);
      break;
  }
  return d.getTime();
}

// ────────────────────────────────────────────────────────────────────────────
// MAIN
// ────────────────────────────────────────────────────────────────────────────

/**
 * Build a fully-resolved timeline series from a config.
 * Optionally accepts a base date (defaults to now).
 */
export function buildTimeline(
  config: TimelineConfig,
  baseDate: Date = new Date(),
): TimelineSeries {
  const totalSteps = stepsForResolution(config.resolution, config.horizon);
  const steps: TimelineStep[] = [];

  for (let i = 0; i < totalSteps; i++) {
    steps.push({
      index: i,
      label: labelForStep(config.resolution, i),
      timestamp: timestampForStep(config.resolution, i, baseDate),
    });
  }

  return { steps };
}

/**
 * Derive the correct step count for a given resolution + horizon.
 * Useful when building a TimelineConfig from user input.
 */
export function deriveStepCount(
  resolution: TimelineResolution,
  horizon: number,
): number {
  return stepsForResolution(resolution, horizon);
}
