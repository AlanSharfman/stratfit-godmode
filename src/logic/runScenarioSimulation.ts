import type { LeverConfig } from "@/strategicStudio/types";

export type ScenarioSimulationResultV1 = {
  // Minimal shape aligned with Compare summary extractor (PASS 4D)
  survivalRate: number; // 0..1
  medianSurvivalMonths: number;
  arrPercentiles: { p10: number; p50: number; p90: number };
  cashPercentiles: { p10: number; p50: number; p90: number };
  runwayPercentiles: { p10: number; p50: number; p90: number };
  medianCase: { finalARR: number; finalCash: number; finalRunway: number };
  meta: { kind: "strategicStudioStub"; horizonMonths: number; createdAtISO: string };
};

function clamp(v: number, lo: number, hi: number): number {
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}

function pow1p(r: number, n: number): number {
  // stable-ish for small rates; good enough for our deterministic stub
  return Math.pow(1 + r, n);
}

export async function runScenarioSimulation(args: {
  baseline: LeverConfig;
  scenario: LeverConfig;
  horizonMonths?: number;
}): Promise<ScenarioSimulationResultV1> {
  const horizonMonths = typeof args.horizonMonths === "number" && Number.isFinite(args.horizonMonths) ? args.horizonMonths : 36;

  // Deterministic, explainable heuristics (stub). This is intentionally NOT Monte Carlo.
  const cash = Math.max(0, args.scenario.cashOnHand);
  const burn = Math.max(0, args.scenario.monthlyNetBurn);
  const runway = burn > 0 ? cash / burn : 60;

  const growth = clamp(args.scenario.monthlyGrowthRate, 0, 1);
  const churn = clamp(args.scenario.monthlyChurnRate, 0, 1);
  const retentionFactor = clamp(pow1p(-churn, horizonMonths), 0, 1);
  const growthFactor = pow1p(growth, horizonMonths);

  const finalARR = Math.max(0, args.scenario.currentARR * growthFactor * (0.7 + 0.3 * retentionFactor));
  const finalCash = Math.max(0, cash - burn * horizonMonths);

  const baseRunway = Math.max(0, runway);

  // Survival proxy: runway vs horizon, softened by churn.
  const survivalRate = clamp((baseRunway / horizonMonths) * (1 - clamp(churn * 1.8, 0, 0.7)) + 0.05, 0, 1);
  const medianSurvivalMonths = Math.max(0, Math.min(horizonMonths, baseRunway * (0.85 + 0.1 * survivalRate)));

  // Very simple percentile spreads (not stochastic; just a "band" for UI).
  const spread = 0.18 + clamp(churn, 0, 0.2) * 0.6;
  const arrP50 = finalARR;
  const arrP10 = Math.max(0, arrP50 * (1 - spread));
  const arrP90 = arrP50 * (1 + spread);

  const cashP50 = finalCash;
  const cashP10 = Math.max(0, cashP50 * 0.6);
  const cashP90 = cashP50 * 1.25;

  const runwayP50 = baseRunway;
  const runwayP10 = Math.max(0, runwayP50 * 0.75);
  const runwayP90 = runwayP50 * 1.18;

  return {
    survivalRate,
    medianSurvivalMonths,
    arrPercentiles: { p10: arrP10, p50: arrP50, p90: arrP90 },
    cashPercentiles: { p10: cashP10, p50: cashP50, p90: cashP90 },
    runwayPercentiles: { p10: runwayP10, p50: runwayP50, p90: runwayP90 },
    medianCase: { finalARR, finalCash, finalRunway: baseRunway },
    meta: { kind: "strategicStudioStub", horizonMonths, createdAtISO: new Date().toISOString() },
  };
}


