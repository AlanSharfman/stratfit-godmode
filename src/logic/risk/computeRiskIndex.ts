// src/logic/risk/computeRiskIndex.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Risk 2.0 Structural Shock Engine & Risk Index Calculator
//
// ISOLATION RULES:
//   • Pure computation — no store reads, no side effects
//   • Inputs are explicit: levers, config, sigma
//   • Outputs are typed: ShockedBatchResult, TransmissionNode[], RiskIndexResult
//
// SHOCK MODEL:
//   σ = 0 → no perturbation (baseline identical)
//   σ = 1 → moderate stress (+20 vol, -16 demand, +13 funding, +8 exec)
//   σ = 2 → severe stress (doubled)
//   σ = 3 → extreme stress (tripled)
//
// ═══════════════════════════════════════════════════════════════════════════

import {
  runSingleSimulation,
  type LeverState,
  type SimulationConfig,
  type SingleSimulationResult,
} from "@/logic/monteCarloEngine";

// ============================================================================
// TYPES
// ============================================================================

export interface TransmissionNode {
  id: string;
  label: string;
  baseline: number;
  shocked: number;
  delta: number;       // absolute delta
  deltaPct: number;    // percentage change
  unit: string;
  direction: "up" | "down" | "neutral";
  severity: "low" | "medium" | "high";
}

export interface ShockedBatchResult {
  survivalRate: number;
  medianARR: number;
  medianRunway: number;
  medianBurn: number;
  churnRate: number;          // implied monthly decline %
  survivalByMonth: number[];
  classification: "Robust" | "Stable" | "Fragile" | "Critical";
}

export interface RiskIndexResult {
  score: number;               // 0–1 composite
  band: "Low" | "Moderate" | "Elevated" | "Critical";
  reasons: string[];
  components: {
    survivalElasticity: number;
    runwayElasticity: number;
    varianceDispersion: number;
    debtSensitivity: number;
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// ============================================================================
// SHOCKED BATCH COMPUTATION
// ============================================================================

const DEFAULT_SHOCK_RUNS = 200;

/**
 * Apply sigma-scaled shock to levers.
 * σ directly scales the perturbation magnitude.
 */
function applyShockToLevers(baseLevers: LeverState, sigma: number): LeverState {
  return {
    ...baseLevers,
    marketVolatility: clamp(baseLevers.marketVolatility + sigma * 20, 0, 100),
    demandStrength: clamp(baseLevers.demandStrength - sigma * 16, 0, 100),
    fundingPressure: clamp(baseLevers.fundingPressure + sigma * 13, 0, 100),
    executionRisk: clamp(baseLevers.executionRisk + sigma * 8, 0, 100),
  };
}

/**
 * Run a mini Monte Carlo batch with the given levers and return extended metrics.
 * This is used for the shocked scenario only. Baseline metrics come from the
 * full 10K MC result for maximum precision.
 */
export function computeShockedBatch(
  baseLevers: LeverState,
  config: SimulationConfig,
  sigma: number,
  runs: number = DEFAULT_SHOCK_RUNS,
): ShockedBatchResult {
  const shockedLevers = applyShockToLevers(baseLevers, sigma);

  const results: SingleSimulationResult[] = [];
  for (let i = 0; i < runs; i++) {
    results.push(runSingleSimulation(i, shockedLevers, config));
  }

  // ── Survival ──
  const survivors = results.filter((r) => r.didSurvive).length;
  const survivalRate = survivors / runs;

  // ── Median ARR ──
  const arrs = results.map((r) => r.finalARR).sort((a, b) => a - b);
  const mid = Math.floor(runs / 2);
  const medianARR = arrs[mid];

  // ── Median Runway ──
  const runways = results.map((r) => r.finalRunway).sort((a, b) => a - b);
  const medianRunway = runways[mid];

  // ── Median Burn ──
  const burns = results
    .map((r) => {
      const last = r.monthlySnapshots[r.monthlySnapshots.length - 1];
      return last?.burn ?? 0;
    })
    .sort((a, b) => a - b);
  const medianBurn = burns[mid];

  // ── Churn Rate (implied monthly revenue decline severity) ──
  const allGrowths = results.flatMap((r) =>
    r.monthlySnapshots.map((s) => s.growthRate)
  );
  const negGrowths = allGrowths.filter((g) => g < 0);
  const churnRate =
    negGrowths.length > 0
      ? Math.abs(
          negGrowths.reduce((a, b) => a + b, 0) / negGrowths.length
        ) * 100
      : 0;

  // ── Survival by Month ──
  const survivalByMonth: number[] = [];
  for (let month = 1; month <= config.timeHorizonMonths; month++) {
    const surviving = results.filter(
      (r) => r.survivalMonths >= month
    ).length;
    survivalByMonth.push(surviving / runs);
  }

  // ── Classification ──
  let classification: ShockedBatchResult["classification"];
  if (survivalRate >= 0.75) classification = "Robust";
  else if (survivalRate >= 0.55) classification = "Stable";
  else if (survivalRate >= 0.35) classification = "Fragile";
  else classification = "Critical";

  return {
    survivalRate,
    medianARR,
    medianRunway,
    medianBurn,
    churnRate,
    survivalByMonth,
    classification,
  };
}

// ============================================================================
// TRANSMISSION NODE BUILDER
// ============================================================================

function formatCurrency(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function getSeverity(absDeltaPct: number): "low" | "medium" | "high" {
  if (absDeltaPct < 5) return "low";
  if (absDeltaPct < 20) return "medium";
  return "high";
}

export interface BaselineMetrics {
  survivalRate: number;
  medianARR: number;
  medianRunway: number;
  medianBurn: number;
  churnRate: number;
}

/**
 * Build the 5-node transmission chain from baseline + shocked metrics.
 */
export function buildTransmissionNodes(
  baseline: BaselineMetrics,
  shocked: ShockedBatchResult,
): TransmissionNode[] {
  const pctDelta = (base: number, shock: number) =>
    base !== 0 ? ((shock - base) / Math.abs(base)) * 100 : 0;

  const nodes: TransmissionNode[] = [
    {
      id: "churn",
      label: "Churn",
      baseline: baseline.churnRate,
      shocked: shocked.churnRate,
      delta: shocked.churnRate - baseline.churnRate,
      deltaPct: pctDelta(baseline.churnRate, shocked.churnRate),
      unit: "%/mo",
      direction: shocked.churnRate > baseline.churnRate + 0.1 ? "up" : shocked.churnRate < baseline.churnRate - 0.1 ? "down" : "neutral",
      severity: getSeverity(Math.abs(pctDelta(baseline.churnRate || 0.01, shocked.churnRate))),
    },
    {
      id: "revenue",
      label: "Revenue",
      baseline: baseline.medianARR,
      shocked: shocked.medianARR,
      delta: shocked.medianARR - baseline.medianARR,
      deltaPct: pctDelta(baseline.medianARR, shocked.medianARR),
      unit: "ARR",
      direction: shocked.medianARR < baseline.medianARR - 1 ? "down" : shocked.medianARR > baseline.medianARR + 1 ? "up" : "neutral",
      severity: getSeverity(Math.abs(pctDelta(baseline.medianARR, shocked.medianARR))),
    },
    {
      id: "burn",
      label: "Burn",
      baseline: baseline.medianBurn,
      shocked: shocked.medianBurn,
      delta: shocked.medianBurn - baseline.medianBurn,
      deltaPct: pctDelta(baseline.medianBurn, shocked.medianBurn),
      unit: "$/mo",
      direction: shocked.medianBurn > baseline.medianBurn + 1 ? "up" : shocked.medianBurn < baseline.medianBurn - 1 ? "down" : "neutral",
      severity: getSeverity(Math.abs(pctDelta(baseline.medianBurn, shocked.medianBurn))),
    },
    {
      id: "runway",
      label: "Runway",
      baseline: baseline.medianRunway,
      shocked: shocked.medianRunway,
      delta: shocked.medianRunway - baseline.medianRunway,
      deltaPct: pctDelta(baseline.medianRunway, shocked.medianRunway),
      unit: "months",
      direction: shocked.medianRunway < baseline.medianRunway - 0.5 ? "down" : shocked.medianRunway > baseline.medianRunway + 0.5 ? "up" : "neutral",
      severity: getSeverity(Math.abs(pctDelta(baseline.medianRunway, shocked.medianRunway))),
    },
    {
      id: "survival",
      label: "Survival",
      baseline: baseline.survivalRate * 100,
      shocked: shocked.survivalRate * 100,
      delta: (shocked.survivalRate - baseline.survivalRate) * 100,
      deltaPct: pctDelta(baseline.survivalRate, shocked.survivalRate),
      unit: "%",
      direction: shocked.survivalRate < baseline.survivalRate - 0.005 ? "down" : shocked.survivalRate > baseline.survivalRate + 0.005 ? "up" : "neutral",
      severity: getSeverity(Math.abs((shocked.survivalRate - baseline.survivalRate) * 100)),
    },
  ];

  return nodes;
}

// ============================================================================
// RISK INDEX CALCULATOR
// ============================================================================

/**
 * Composite Risk Index (0–1).
 *
 * Inputs:
 *   baselineResult — baseline simulation metrics
 *   shockedResult  — shocked simulation metrics
 *
 * Components:
 *   survivalElasticity = |baselineSurvival − shockedSurvival|
 *   runwayElasticity   = |baselineRunway − shockedRunway| / baselineRunway
 *   varianceDispersion = (p75 − p25) / p50  (from baseline ARR)
 *   debtSensitivity    = survival drop per leverage unit (proxy)
 */
export function computeRiskIndex(input: {
  baselineSurvival: number;
  shockedSurvival: number;
  baselineRunway: number;
  shockedRunway: number;
  arrP25: number;
  arrP50: number;
  arrP75: number;
  leverDebtExposure?: number;    // 0–100 (funding pressure lever)
}): RiskIndexResult {
  const {
    baselineSurvival,
    shockedSurvival,
    baselineRunway,
    shockedRunway,
    arrP25,
    arrP50,
    arrP75,
    leverDebtExposure = 0,
  } = input;

  // 1. Survival Elasticity (0–1)
  const survivalElasticity = Math.abs(baselineSurvival - shockedSurvival);

  // 2. Runway Elasticity (0–1)
  const runwayElasticity =
    baselineRunway > 0
      ? clamp(Math.abs(baselineRunway - shockedRunway) / baselineRunway, 0, 1)
      : 0;

  // 3. Variance Dispersion — IQR / p50 (0–∞, clamped to 0–2)
  const rawDispersion = arrP50 > 0 ? (arrP75 - arrP25) / arrP50 : 0;
  const varianceDispersion = clamp(rawDispersion, 0, 2);

  // 4. Debt Sensitivity — survival drop per unit of funding pressure
  const debtSensitivity = clamp(
    survivalElasticity * (leverDebtExposure / 100) * 2,
    0,
    1
  );

  // Composite (weighted blend, 0–1)
  const score = clamp(
    survivalElasticity * 0.35 +
      runwayElasticity * 0.25 +
      (varianceDispersion / 2) * 0.25 +
      debtSensitivity * 0.15,
    0,
    1
  );

  // Band
  let band: RiskIndexResult["band"];
  if (score <= 0.25) band = "Low";
  else if (score <= 0.5) band = "Moderate";
  else if (score <= 0.75) band = "Elevated";
  else band = "Critical";

  // Reasons (human-readable)
  const reasons: string[] = [];
  if (survivalElasticity > 0.15)
    reasons.push(
      `Survival drops ${(survivalElasticity * 100).toFixed(0)}pp under shock`
    );
  if (runwayElasticity > 0.2)
    reasons.push(
      `Runway contracts ${(runwayElasticity * 100).toFixed(0)}% under stress`
    );
  if (varianceDispersion > 0.5)
    reasons.push(
      `High outcome dispersion (IQR/p50 = ${rawDispersion.toFixed(2)})`
    );
  if (debtSensitivity > 0.15)
    reasons.push(`Elevated capital structure sensitivity`);
  if (reasons.length === 0)
    reasons.push("Risk parameters within acceptable ranges");

  return {
    score,
    band,
    reasons,
    components: {
      survivalElasticity,
      runwayElasticity,
      varianceDispersion,
      debtSensitivity,
    },
  };
}

