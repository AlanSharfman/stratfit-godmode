/**
 * engineSelectors — Null-safe read accessors for EngineResults.
 *
 * These selectors sit between raw store state and UI consumers.
 * They are intentionally decoupled from any specific store implementation
 * so the store can be wired in a later phase without touching consumers.
 */

import type { EngineResults } from "./EngineResults";

// ── In-memory results map (will be replaced by store binding) ───
const resultsById = new Map<string, EngineResults>();

// ── Null-safe defaults ──────────────────────────────────────────
const EMPTY_SERIES: readonly number[] = Object.freeze([]);

const EMPTY_SIGNALS: EngineResults["signals"] = Object.freeze({
  valueDeltaPct: 0,
  riskDeltaPct: 0,
  runwayDeltaMonths: 0,
  stabilityScore: 0,
});

// ── Selectors ───────────────────────────────────────────────────

/** Retrieve full results for a given run, or a safe empty shell. */
export function selectEngineResults(
  run_id: string
): EngineResults | null {
  return resultsById.get(run_id) ?? null;
}

/** Risk-index series for the latest run (falls back to []). */
export function selectRiskIndexSeries(
  run_id: string
): readonly number[] {
  return resultsById.get(run_id)?.riskIndexSeries ?? EMPTY_SERIES;
}

/** Variance series for the latest run (falls back to []). */
export function selectVarianceSeries(
  run_id: string
): readonly number[] {
  return resultsById.get(run_id)?.varianceSeries ?? EMPTY_SERIES;
}

/** Confidence series for the latest run (falls back to []). */
export function selectConfidenceSeries(
  run_id: string
): readonly number[] {
  return resultsById.get(run_id)?.confidenceSeries ?? EMPTY_SERIES;
}

/** P50 (median) percentile series, if available (falls back to []). */
export function selectP50Series(
  run_id: string
): readonly number[] {
  return resultsById.get(run_id)?.p50Series ?? EMPTY_SERIES;
}

/**
 * Scalar risk score (0–100) derived from the engine's riskIndexSeries.
 * Uses the terminal (latest) value, scaled from 0–1 to 0–100.
 * Returns null when no engine results are available.
 */
export function selectEngineRiskScore(run_id: string): number | null {
  const series = resultsById.get(run_id)?.riskIndexSeries;
  if (!series || series.length === 0) return null;
  // Terminal value from computeRiskIndex output series, scaled to 0–100
  const raw = series[series.length - 1];
  return Math.round(raw * 100);
}
