// src/logic/sensitivity/SensitivityEngine.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Institutional Sensitivity Engine
//
// Analytically derived from simulation reruns — no static multipliers.
//
// Exports:
//   computeElasticity()      – per-variable delta analysis
//   computeTornado()         – ordered ranking by survival impact
//   computeShockPropagation() – shock intensity → recomputed survival/EV
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

export interface ElasticityResult {
  variable: keyof LeverState;
  label: string;
  deltaSurvival: number;     // change in survival rate (±)
  deltaEV: number;           // change in median EV ($)
  deltaRunway: number;       // change in median runway (months)
  elasticityScore: number;   // normalised 0–1 magnitude
  direction: "positive" | "negative";
}

export interface TornadoBar {
  variable: keyof LeverState;
  label: string;
  lowSurvival: number;       // survival when variable is reduced
  highSurvival: number;      // survival when variable is increased
  lowEV: number;
  highEV: number;
  spread: number;            // |highSurvival - lowSurvival|
}

export interface ShockResult {
  shockIntensityPct: number; // 0–200
  survivalProbability: number;
  medianEV: number;
  medianRunway: number;
  failureProbability: number;
  classification: "Robust" | "Stable" | "Fragile" | "Critical";
}

export interface SensitivityProfile {
  elasticities: ElasticityResult[];
  tornado: TornadoBar[];
  computed: true;
}

export interface SensitivityNotComputed {
  computed: false;
  reason: string;
}

export type SensitivityResult = SensitivityProfile | SensitivityNotComputed;

// ============================================================================
// CONFIG
// ============================================================================

const SENSITIVITY_RUNS = 200;  // paths per perturbation (balance speed / accuracy)
const PERTURBATION_PCT = 5;    // ±5% lever perturbation

const LEVER_LABELS: Record<keyof LeverState, string> = {
  demandStrength: "Growth / Demand",
  pricingPower: "Pricing Power",
  expansionVelocity: "Expansion Velocity",
  costDiscipline: "Cost Discipline",
  hiringIntensity: "Hiring Intensity",
  operatingDrag: "Operating Drag",
  marketVolatility: "Market Volatility",
  executionRisk: "Execution Risk",
  fundingPressure: "Funding Pressure",
};

const SENSITIVITY_VARS: (keyof LeverState)[] = [
  "demandStrength",
  "marketVolatility",
  "fundingPressure",
  "costDiscipline",
  "executionRisk",
];

// ============================================================================
// HELPERS — mini Monte Carlo batch
// ============================================================================

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

interface BatchStats {
  survivalRate: number;
  medianARR: number;
  medianRunway: number;
}

function runBatch(
  levers: LeverState,
  config: SimulationConfig,
  n: number
): BatchStats {
  const results: SingleSimulationResult[] = [];
  for (let i = 0; i < n; i++) {
    results.push(runSingleSimulation(i, levers, config));
  }
  const survivors = results.filter((r) => r.didSurvive).length;
  const arrs = results.map((r) => r.finalARR).sort((a, b) => a - b);
  const runways = results.map((r) => r.finalRunway).sort((a, b) => a - b);
  return {
    survivalRate: survivors / n,
    medianARR: arrs[Math.floor(n / 2)],
    medianRunway: runways[Math.floor(n / 2)],
  };
}

// ============================================================================
// COMPUTE ELASTICITY
// ============================================================================

export interface ComputeElasticityInput {
  baseLevers: LeverState;
  config: SimulationConfig;
  perturbationPercent?: number;
  runs?: number;
}

export function computeElasticity({
  baseLevers,
  config,
  perturbationPercent = PERTURBATION_PCT,
  runs = SENSITIVITY_RUNS,
}: ComputeElasticityInput): ElasticityResult[] {
  // Baseline batch
  const base = runBatch(baseLevers, config, runs);
  const evMultiple = 3.5;
  const baseEV = base.medianARR * evMultiple;

  const results: ElasticityResult[] = [];

  for (const v of SENSITIVITY_VARS) {
    const delta = (perturbationPercent / 100) * 100; // lever scale is 0–100
    const upLevers: LeverState = { ...baseLevers, [v]: clamp(baseLevers[v] + delta, 0, 100) };
    const downLevers: LeverState = { ...baseLevers, [v]: clamp(baseLevers[v] - delta, 0, 100) };

    const up = runBatch(upLevers, config, runs);
    const down = runBatch(downLevers, config, runs);

    const dSurvival = up.survivalRate - down.survivalRate;
    const dEV = up.medianARR * evMultiple - down.medianARR * evMultiple;
    const dRunway = up.medianRunway - down.medianRunway;

    const magnitude = Math.abs(dSurvival) + Math.abs(dEV / Math.max(baseEV, 1)) * 0.5 + Math.abs(dRunway / Math.max(base.medianRunway, 1)) * 0.3;

    results.push({
      variable: v,
      label: LEVER_LABELS[v],
      deltaSurvival: dSurvival,
      deltaEV: dEV,
      deltaRunway: dRunway,
      elasticityScore: 0, // normalised below
      direction: dSurvival >= 0 ? "positive" : "negative",
    });
  }

  // Normalise elasticityScore 0–1
  const maxMag = Math.max(
    ...results.map(
      (r) =>
        Math.abs(r.deltaSurvival) +
        Math.abs(r.deltaEV / Math.max(baseEV, 1)) * 0.5 +
        Math.abs(r.deltaRunway / Math.max(base.medianRunway, 1)) * 0.3
    ),
    0.001
  );

  for (const r of results) {
    const mag =
      Math.abs(r.deltaSurvival) +
      Math.abs(r.deltaEV / Math.max(baseEV, 1)) * 0.5 +
      Math.abs(r.deltaRunway / Math.max(base.medianRunway, 1)) * 0.3;
    r.elasticityScore = clamp(mag / maxMag, 0, 1);
  }

  // Sort by elasticity descending
  results.sort((a, b) => b.elasticityScore - a.elasticityScore);
  return results;
}

// ============================================================================
// COMPUTE TORNADO
// ============================================================================

export interface ComputeTornadoInput {
  baseLevers: LeverState;
  config: SimulationConfig;
  perturbationPercent?: number;
  runs?: number;
}

export function computeTornado({
  baseLevers,
  config,
  perturbationPercent = PERTURBATION_PCT,
  runs = SENSITIVITY_RUNS,
}: ComputeTornadoInput): TornadoBar[] {
  const evMultiple = 3.5;
  const bars: TornadoBar[] = [];

  for (const v of SENSITIVITY_VARS) {
    const delta = (perturbationPercent / 100) * 100;
    const upLevers: LeverState = { ...baseLevers, [v]: clamp(baseLevers[v] + delta, 0, 100) };
    const downLevers: LeverState = { ...baseLevers, [v]: clamp(baseLevers[v] - delta, 0, 100) };

    const up = runBatch(upLevers, config, runs);
    const down = runBatch(downLevers, config, runs);

    bars.push({
      variable: v,
      label: LEVER_LABELS[v],
      lowSurvival: down.survivalRate,
      highSurvival: up.survivalRate,
      lowEV: down.medianARR * evMultiple,
      highEV: up.medianARR * evMultiple,
      spread: Math.abs(up.survivalRate - down.survivalRate),
    });
  }

  // Sort by spread descending (highest impact first)
  bars.sort((a, b) => b.spread - a.spread);
  return bars.slice(0, 5);
}

// ============================================================================
// COMPUTE FULL SENSITIVITY PROFILE (elasticity + tornado in one pass)
// ============================================================================

export function computeSensitivityProfile(
  baseLevers: LeverState | null,
  config: SimulationConfig | null,
  runs: number = SENSITIVITY_RUNS
): SensitivityResult {
  if (!baseLevers || !config) {
    return { computed: false, reason: "Levers or simulation config not available." };
  }

  const evMultiple = 3.5;
  const base = runBatch(baseLevers, config, runs);
  const baseEV = base.medianARR * evMultiple;

  const elasticities: ElasticityResult[] = [];
  const tornado: TornadoBar[] = [];

  for (const v of SENSITIVITY_VARS) {
    const delta = (PERTURBATION_PCT / 100) * 100;
    const upLevers: LeverState = { ...baseLevers, [v]: clamp(baseLevers[v] + delta, 0, 100) };
    const downLevers: LeverState = { ...baseLevers, [v]: clamp(baseLevers[v] - delta, 0, 100) };

    const up = runBatch(upLevers, config, runs);
    const down = runBatch(downLevers, config, runs);

    const dSurvival = up.survivalRate - down.survivalRate;
    const dEV = up.medianARR * evMultiple - down.medianARR * evMultiple;
    const dRunway = up.medianRunway - down.medianRunway;

    elasticities.push({
      variable: v,
      label: LEVER_LABELS[v],
      deltaSurvival: dSurvival,
      deltaEV: dEV,
      deltaRunway: dRunway,
      elasticityScore: 0,
      direction: dSurvival >= 0 ? "positive" : "negative",
    });

    tornado.push({
      variable: v,
      label: LEVER_LABELS[v],
      lowSurvival: down.survivalRate,
      highSurvival: up.survivalRate,
      lowEV: down.medianARR * evMultiple,
      highEV: up.medianARR * evMultiple,
      spread: Math.abs(up.survivalRate - down.survivalRate),
    });
  }

  // Normalise elasticity
  const maxMag = Math.max(
    ...elasticities.map(
      (r) =>
        Math.abs(r.deltaSurvival) +
        Math.abs(r.deltaEV / Math.max(baseEV, 1)) * 0.5 +
        Math.abs(r.deltaRunway / Math.max(base.medianRunway, 1)) * 0.3
    ),
    0.001
  );
  for (const r of elasticities) {
    const mag =
      Math.abs(r.deltaSurvival) +
      Math.abs(r.deltaEV / Math.max(baseEV, 1)) * 0.5 +
      Math.abs(r.deltaRunway / Math.max(base.medianRunway, 1)) * 0.3;
    r.elasticityScore = clamp(mag / maxMag, 0, 1);
  }

  elasticities.sort((a, b) => b.elasticityScore - a.elasticityScore);
  tornado.sort((a, b) => b.spread - a.spread);

  return { elasticities, tornado: tornado.slice(0, 5), computed: true };
}

// ============================================================================
// SHOCK PROPAGATION MODEL
// ============================================================================

export interface ComputeShockInput {
  baseLevers: LeverState;
  config: SimulationConfig;
  shockIntensityPct: number; // 0–200
  runs?: number;
}

/**
 * Applies a "stress shock" by scaling three levers proportionally:
 *   - marketVolatility → increased (more chaos)
 *   - demandStrength → decreased (revenue contraction)
 *   - fundingPressure → increased (less capital access)
 *
 * shockIntensityPct = 0  → no shock (levers unchanged)
 * shockIntensityPct = 100 → moderate shock
 * shockIntensityPct = 200 → extreme shock
 *
 * Then re-runs a mini Monte Carlo to get updated survival/EV/runway.
 */
export function computeShockPropagation({
  baseLevers,
  config,
  shockIntensityPct,
  runs = SENSITIVITY_RUNS,
}: ComputeShockInput): ShockResult {
  const t = shockIntensityPct / 100; // 0–2

  const shockedLevers: LeverState = {
    ...baseLevers,
    // Volatility rises with shock
    marketVolatility: clamp(baseLevers.marketVolatility + t * 30, 0, 100),
    // Revenue contracts with shock
    demandStrength: clamp(baseLevers.demandStrength - t * 25, 0, 100),
    // Funding access worsens
    fundingPressure: clamp(baseLevers.fundingPressure + t * 20, 0, 100),
  };

  const stats = runBatch(shockedLevers, config, runs);
  const evMultiple = 3.5;
  const medianEV = stats.medianARR * evMultiple;

  let classification: ShockResult["classification"];
  if (stats.survivalRate >= 0.75) classification = "Robust";
  else if (stats.survivalRate >= 0.55) classification = "Stable";
  else if (stats.survivalRate >= 0.35) classification = "Fragile";
  else classification = "Critical";

  return {
    shockIntensityPct,
    survivalProbability: stats.survivalRate,
    medianEV,
    medianRunway: stats.medianRunway,
    failureProbability: 1 - stats.survivalRate,
    classification,
  };
}



