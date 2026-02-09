// src/logic/system/SystemAnalysisEngine.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — System Analysis Engine (Canonical Orchestration Layer)
//
// SINGLE point of consolidation for all analytical subsystems:
//   • RiskEngine          → risk profile, drivers, classification
//   • SensitivityEngine   → elasticity, tornado, shock propagation
//   • ValuationSummary    → percentile distribution, winsorisation
//   • ConfidenceEngine    → model confidence score
//   • SimulationSummary   → survival, ARR, runway, cash percentiles
//
// RULES:
//   • This module is a PURE orchestrator. No side effects.
//   • Engines receive EXPLICIT inputs — they never read stores.
//   • Only the React hook (useSystemAnalysis) reads stores.
//   • All UI panels consume SystemAnalysisSnapshot only.
//
// DEPENDENCY MAP (no cycles):
//   monteCarloEngine ──┐
//                      ├─→ RiskEngine
//                      ├─→ SensitivityEngine
//                      └─→ SystemAnalysisEngine (this file)
//   summarizeValuationDistribution ─→ SystemAnalysisEngine
//   calculateModelConfidence ─→ SystemAnalysisEngine
//
// ═══════════════════════════════════════════════════════════════════════════

import type {
  MonteCarloResult,
  LeverState,
  SimulationConfig,
} from "@/logic/monteCarloEngine";

import {
  computeRiskProfile,
  type RiskResult,
  type RiskProfile,
} from "@/logic/risk/RiskEngine";

import {
  computeSensitivityProfile,
  computeShockPropagation,
  type SensitivityResult,
  type SensitivityProfile,
  type ShockResult,
  type ElasticityResult,
  type TornadoBar,
} from "@/logic/sensitivity/SensitivityEngine";

import type {
  ValuationDistributionSummary,
} from "@/logic/valuation/summarizeValuationDistribution";

import {
  calculateModelConfidence,
  type ModelConfidenceResult,
} from "@/logic/confidence/calculateModelConfidence";

// ============================================================================
// SNAPSHOT — The single object all UI panels consume
// ============================================================================

export interface SimulationSummaryBlock {
  survivalRate: number;
  arrPercentiles: { p10: number; p50: number; p90: number };
  runwayPercentiles: { p10: number; p50: number; p90: number };
  cashPercentiles: { p10: number; p50: number; p90: number };
  iterations: number;
  timeHorizonMonths: number;
  executionTimeMs: number;
}

export interface SystemAnalysisSnapshot {
  // ── Identity ──
  runId: string;
  timestamp: number;                       // Date.now()
  computed: true;

  // ── Simulation Summary ──
  simulationSummary: SimulationSummaryBlock;

  // ── Risk Profile ──
  riskProfile: RiskProfile;

  // ── Sensitivity ──
  sensitivityMap: ElasticityResult[];      // ranked by elasticityScore desc
  tornadoRanking: TornadoBar[];           // top 5 by survival spread

  // ── Shock State (at intensity = 0 baseline) ──
  shockState: ShockResult;

  // ── Valuation ──
  valuationSummary: ValuationDistributionSummary | null;

  // ── Confidence ──
  confidenceScore: ModelConfidenceResult;
}

export interface SystemAnalysisNotComputed {
  computed: false;
  reason: string;
}

export type SystemAnalysisResult = SystemAnalysisSnapshot | SystemAnalysisNotComputed;

// ============================================================================
// INPUTS
// ============================================================================

export interface BaselineInputs {
  arr: number;
  monthlyBurn: number;
  cashOnHand: number;
  grossMarginPct: number;
  inputCompletenessScore: number;   // 0–1 from baseline field completeness
}

export interface StrategyInputs {
  levers: LeverState;
  horizonMonths: number;
}

export interface MethodConfig {
  evMultiple?: number;               // default 3.5
  sensitivityRuns?: number;          // default 200
  shockBaselineIntensity?: number;   // default 0
  parameterStabilityScore?: number;  // default 0.75
  methodConsistencyScore?: number;   // default 0.80
}

export interface RunSystemAnalysisInput {
  monteCarloResult: MonteCarloResult | null;
  baselineInputs: BaselineInputs | null;
  strategyInputs: StrategyInputs | null;
  valuationDistribution: ValuationDistributionSummary | null;
  methodConfig?: MethodConfig;
  runId?: string;
}

// ============================================================================
// CORE ORCHESTRATOR
// ============================================================================

export function runSystemAnalysis(input: RunSystemAnalysisInput): SystemAnalysisResult {
  const {
    monteCarloResult,
    baselineInputs,
    strategyInputs,
    valuationDistribution,
    methodConfig = {},
    runId,
  } = input;

  const {
    evMultiple = 3.5,
    sensitivityRuns = 200,
    shockBaselineIntensity = 0,
    parameterStabilityScore = 0.75,
    methodConsistencyScore = 0.80,
  } = methodConfig;

  // ── Guard: simulation required ──
  if (!monteCarloResult) {
    return { computed: false, reason: "Simulation results not available. Run a Monte Carlo simulation first." };
  }
  if (!monteCarloResult.allSimulations || monteCarloResult.allSimulations.length === 0) {
    return { computed: false, reason: "No simulation paths found in results." };
  }

  // ── 1. RISK PROFILE ──
  const riskResult = computeRiskProfile({ monteCarloResult, evMultiple });
  if (!riskResult.computed) {
    return { computed: false, reason: riskResult.reason };
  }

  // ── 2. SIMULATION SUMMARY ──
  const simulationSummary: SimulationSummaryBlock = {
    survivalRate: monteCarloResult.survivalRate,
    arrPercentiles: {
      p10: monteCarloResult.arrPercentiles.p10,
      p50: monteCarloResult.arrPercentiles.p50,
      p90: monteCarloResult.arrPercentiles.p90,
    },
    runwayPercentiles: {
      p10: monteCarloResult.runwayPercentiles.p10,
      p50: monteCarloResult.runwayPercentiles.p50,
      p90: monteCarloResult.runwayPercentiles.p90,
    },
    cashPercentiles: {
      p10: monteCarloResult.cashPercentiles.p10,
      p50: monteCarloResult.cashPercentiles.p50,
      p90: monteCarloResult.cashPercentiles.p90,
    },
    iterations: monteCarloResult.iterations,
    timeHorizonMonths: monteCarloResult.timeHorizonMonths,
    executionTimeMs: monteCarloResult.executionTimeMs,
  };

  // ── 3. SENSITIVITY + TORNADO ──
  let sensitivityMap: ElasticityResult[] = [];
  let tornadoRanking: TornadoBar[] = [];

  if (strategyInputs && baselineInputs) {
    const simConfig: SimulationConfig = {
      iterations: sensitivityRuns,
      timeHorizonMonths: strategyInputs.horizonMonths,
      startingCash: baselineInputs.cashOnHand,
      startingARR: baselineInputs.arr,
      monthlyBurn: baselineInputs.monthlyBurn,
    };

    const sensResult = computeSensitivityProfile(
      strategyInputs.levers,
      simConfig,
      sensitivityRuns
    );

    if (sensResult.computed) {
      sensitivityMap = sensResult.elasticities;
      tornadoRanking = sensResult.tornado;
    }
  }

  // ── 4. SHOCK STATE (baseline intensity) ──
  let shockState: ShockResult = {
    shockIntensityPct: 0,
    survivalProbability: riskResult.survivalProbability,
    medianEV: monteCarloResult.arrPercentiles.p50 * evMultiple,
    medianRunway: monteCarloResult.runwayPercentiles.p50,
    failureProbability: riskResult.failureProbability,
    classification: riskResult.classification,
  };

  if (strategyInputs && baselineInputs && shockBaselineIntensity > 0) {
    const simConfig: SimulationConfig = {
      iterations: sensitivityRuns,
      timeHorizonMonths: strategyInputs.horizonMonths,
      startingCash: baselineInputs.cashOnHand,
      startingARR: baselineInputs.arr,
      monthlyBurn: baselineInputs.monthlyBurn,
    };

    shockState = computeShockPropagation({
      baseLevers: strategyInputs.levers,
      config: simConfig,
      shockIntensityPct: shockBaselineIntensity,
      runs: sensitivityRuns,
    });
  }

  // ── 5. CONFIDENCE SCORE ──
  const confidenceScore = calculateModelConfidence({
    sampleSize: monteCarloResult.iterations,
    distributionStdDev: monteCarloResult.arrDistribution.stdDev,
    distributionMean: monteCarloResult.arrDistribution.mean,
    inputCompletenessScore: baselineInputs?.inputCompletenessScore ?? 0.5,
    parameterStabilityScore,
    methodConsistencyScore,
  });

  // ── 6. ASSEMBLE SNAPSHOT ──
  return {
    runId: runId ?? generateRunId(),
    timestamp: Date.now(),
    computed: true,
    simulationSummary,
    riskProfile: riskResult,
    sensitivityMap,
    tornadoRanking,
    shockState,
    valuationSummary: valuationDistribution,
    confidenceScore,
  };
}

// ============================================================================
// SHOCK RECOMPUTE (for interactive slider — called independently)
// ============================================================================

export interface RecomputeShockInput {
  levers: LeverState;
  baselineInputs: BaselineInputs;
  horizonMonths: number;
  shockIntensityPct: number;
  runs?: number;
}

export function recomputeShock(input: RecomputeShockInput): ShockResult {
  const config: SimulationConfig = {
    iterations: input.runs ?? 200,
    timeHorizonMonths: input.horizonMonths,
    startingCash: input.baselineInputs.cashOnHand,
    startingARR: input.baselineInputs.arr,
    monthlyBurn: input.baselineInputs.monthlyBurn,
  };

  return computeShockPropagation({
    baseLevers: input.levers,
    config,
    shockIntensityPct: input.shockIntensityPct,
    runs: input.runs ?? 200,
  });
}

// ============================================================================
// HELPERS
// ============================================================================

function generateRunId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  return `sa-${ts}-${rand}`;
}



