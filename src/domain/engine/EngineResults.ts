/**
 * EngineResults — Canonical engine output contract.
 *
 * Single source-of-truth for every simulation run's numeric payload.
 * All downstream selectors, panels, and visualisations read from this shape.
 */
/** Supported simulation execution modes */
export type SimulationMode =
  | "deterministic"
  | "montecarlo"
  | "sensitivity"
  | "stress";

export interface EngineResults {
  /** Unique identifier for this simulation run */
  run_id: string;
  /** Scenario that produced this run */
  scenario_id: string;
  /** PRNG seed used for reproducibility */
  seed: number;
  /** Forward-looking horizon length */
  horizon_months: number;

  /** Execution mode — defaults to "montecarlo" for current runs */
  simulationMode: SimulationMode;

  // ── Core series (always present) ──────────────────────────────
  valueSeries: number[];
  riskIndexSeries: number[];
  varianceSeries: number[];
  confidenceSeries: number[];

  // ── Percentile bands (optional — Monte-Carlo runs) ────────────
  p10Series?: number[];
  p50Series?: number[];
  p90Series?: number[];

  // ── Cash / runway (optional) ──────────────────────────────────
  cashSeries?: number[];
  runwayMonth?: number;

  // ── Derived signals ───────────────────────────────────────────
  signals: {
    valueDeltaPct: number;
    riskDeltaPct: number;
    runwayDeltaMonths: number;
    stabilityScore: number;
  };

  // ── Sensitivity / stress placeholders (future modes) ──────────
  /** Per-driver sensitivity coefficients (sensitivity mode) */
  driverSensitivities?: Record<string, number>;
  /** Stress-test scenario outcomes (stress mode) */
  stressResults?: Array<{
    scenario: string;
    outcomeDelta: number;
  }>;
}
