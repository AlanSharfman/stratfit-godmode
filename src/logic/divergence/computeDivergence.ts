// STRATFIT — Divergence Math (Module 3)
// Baseline vs Scenario deltas from SimulationSnapshot.
// Pure + deterministic. No store access.

export type OverallRating = "CRITICAL" | "CAUTION" | "STABLE" | "STRONG";

export interface SimulationSnapshot {
  survivalRate: number; // 0–1
  medianARR: number;
  medianRunway: number;
  medianCash: number;

  arrP10: number; arrP50: number; arrP90: number;
  runwayP10: number; runwayP50: number; runwayP90: number;
  cashP10: number; cashP50: number; cashP90: number;

  overallScore: number;
  overallRating: OverallRating;

  leverSensitivity: { lever: string; label: string; impact: number; direction: "positive" | "negative" }[];

  simulatedAt: Date;
  iterations: number;
  executionTimeMs: number;
}

export type Divergence = {
  // headline signals
  survivalDeltaPp: number;      // percentage points
  runwayDeltaMonths: number;
  arrDeltaP50: number;
  cashDeltaP50: number;

  // distribution widening/narrowing (relative vs baseline median)
  arrSpreadDeltaPct: number;    // (+) wider uncertainty, (-) tighter
  runwaySpreadDeltaPct: number;

  // rating change
  ratingFrom: OverallRating;
  ratingTo: OverallRating;
  scoreDelta: number;

  // top drivers (scenario sensitivity only; baseline sensitivity is not comparable safely)
  topPositive: string[];
  topNegative: string[];
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function spreadPct(p10: number, p90: number, p50: number) {
  const denom = Math.max(1, Math.abs(p50));
  return Math.round((Math.abs(p90 - p10) / denom) * 100);
}

function topDrivers(
  leverSensitivity: SimulationSnapshot["leverSensitivity"],
  count: number
) {
  const list = (leverSensitivity ?? [])
    .slice()
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, count);

  return {
    pos: list.filter((d) => d.direction === "positive").map((d) => d.label),
    neg: list.filter((d) => d.direction === "negative").map((d) => d.label),
  };
}

export function computeDivergence(
  baseline: SimulationSnapshot,
  scenario: SimulationSnapshot
): Divergence {
  const survivalDeltaPp = Math.round((scenario.survivalRate - baseline.survivalRate) * 100);

  const runwayDeltaMonths = Math.round((scenario.runwayP50 - baseline.runwayP50) * 10) / 10;
  const arrDeltaP50 = scenario.arrP50 - baseline.arrP50;
  const cashDeltaP50 = scenario.cashP50 - baseline.cashP50;

  const baseArrSpread = spreadPct(baseline.arrP10, baseline.arrP90, baseline.arrP50);
  const scenArrSpread = spreadPct(scenario.arrP10, scenario.arrP90, scenario.arrP50);
  const arrSpreadDeltaPct = clamp(scenArrSpread - baseArrSpread, -999, 999);

  const baseRunwaySpread = spreadPct(baseline.runwayP10, baseline.runwayP90, baseline.runwayP50);
  const scenRunwaySpread = spreadPct(scenario.runwayP10, scenario.runwayP90, scenario.runwayP50);
  const runwaySpreadDeltaPct = clamp(scenRunwaySpread - baseRunwaySpread, -999, 999);

  const scoreDelta = Math.round((scenario.overallScore - baseline.overallScore) * 10) / 10;

  const drivers = topDrivers(scenario.leverSensitivity, 3);

  return {
    survivalDeltaPp,
    runwayDeltaMonths,
    arrDeltaP50,
    cashDeltaP50,
    arrSpreadDeltaPct,
    runwaySpreadDeltaPct,
    ratingFrom: baseline.overallRating,
    ratingTo: scenario.overallRating,
    scoreDelta,
    topPositive: drivers.pos,
    topNegative: drivers.neg,
  };
}
