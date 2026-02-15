// src/engine/runSimulation.ts

import {
  type MonteCarloResult,
  type HistogramBucket,
  type PercentileSet,
  type ConfidenceBand,
  type LeverState,
  type SimulationConfig,
  type SensitivityFactor,
  runSingleSimulation,
} from "@/logic/monteCarloEngine";
import { generateVerdict, type Verdict } from "@/logic/verdictGenerator";

export interface SimulationInput {
  levers: LeverState;
  baseline: SimulationConfig;
}

export interface SimulationOutput {
  result: MonteCarloResult;
  verdict: Verdict;
}

export function runSimulation(levers: LeverState, baseline: SimulationConfig): SimulationOutput {
  const CHUNK_SIZE = 500;
  const allSimulations: any[] = [];

  for (let i = 0; i < baseline.iterations; i += CHUNK_SIZE) {
    const chunkEnd = Math.min(i + CHUNK_SIZE, baseline.iterations);
    for (let j = i; j < chunkEnd; j++) {
      allSimulations.push(runSingleSimulation(j, levers, baseline));
    }
  }

  // Timing is measured in the worker. Keep this pure.
  const result = processSimulationResults(allSimulations, baseline, 0);
  const verdict = generateVerdict(result);

  return { result, verdict };
}

function processSimulationResults(
  allSimulations: any[],
  config: SimulationConfig,
  executionTimeMs: number
): MonteCarloResult {
  const survivors = allSimulations.filter((s: any) => s.didSurvive);
  const survivalRate = survivors.length / config.iterations;

  const survivalByMonth: number[] = [];
  for (let month = 1; month <= config.timeHorizonMonths; month++) {
    const survivingAtMonth = allSimulations.filter((s: any) => s.survivalMonths >= month).length;
    survivalByMonth.push(survivingAtMonth / config.iterations);
  }

  const finalARRs = allSimulations.map((s: any) => s.finalARR);
  const finalCash = allSimulations.map((s: any) => s.finalCash);
  const finalRunway = allSimulations.map((s: any) => s.finalRunway);
  const survivalMonths = allSimulations.map((s: any) => s.survivalMonths);

  const arrDistribution = calculateDistributionStats(finalARRs);
  const arrHistogram = createHistogram(finalARRs, 25);
  const arrPercentiles = calculatePercentiles(finalARRs);

  const cashDistribution = calculateDistributionStats(finalCash);
  const cashPercentiles = calculatePercentiles(finalCash);

  const runwayDistribution = calculateDistributionStats(finalRunway);
  const runwayPercentiles = calculatePercentiles(finalRunway);

  const medianSurvivalMonths = calculatePercentiles(survivalMonths).p50;
  const arrConfidenceBands = calculateConfidenceBands(allSimulations, config.timeHorizonMonths);

  const sortedByARR = [...allSimulations].sort((a: any, b: any) => a.finalARR - b.finalARR);
  const worstCase = sortedByARR[Math.floor(config.iterations * 0.05)];
  const medianCase = sortedByARR[Math.floor(config.iterations * 0.5)];
  const bestCase = sortedByARR[Math.floor(config.iterations * 0.95)];

  const sensitivityFactors: SensitivityFactor[] = [
    { lever: "demandStrength" as keyof LeverState, label: "Demand Strength", impact: 0.8, direction: "positive" },
    { lever: "pricingPower" as keyof LeverState, label: "Pricing Power", impact: 0.6, direction: "positive" },
    { lever: "costDiscipline" as keyof LeverState, label: "Cost Discipline", impact: 0.5, direction: "positive" },
    { lever: "marketVolatility" as keyof LeverState, label: "Market Volatility", impact: -0.7, direction: "negative" },
    { lever: "executionRisk" as keyof LeverState, label: "Execution Risk", impact: -0.5, direction: "negative" },
    { lever: "expansionVelocity" as keyof LeverState, label: "Expansion Velocity", impact: 0.4, direction: "positive" },
    { lever: "hiringIntensity" as keyof LeverState, label: "Hiring Intensity", impact: -0.3, direction: "negative" },
    { lever: "operatingDrag" as keyof LeverState, label: "Operating Drag", impact: -0.4, direction: "negative" },
    { lever: "fundingPressure" as keyof LeverState, label: "Funding Pressure", impact: -0.6, direction: "negative" },
  ];

  return {
    iterations: config.iterations,
    timeHorizonMonths: config.timeHorizonMonths,
    executionTimeMs,
    survivalRate,
    survivalByMonth,
    medianSurvivalMonths,
    arrDistribution,
    arrHistogram,
    arrPercentiles,
    arrConfidenceBands,
    cashDistribution,
    cashPercentiles,
    runwayDistribution,
    runwayPercentiles,
    bestCase,
    worstCase,
    medianCase,
    sensitivityFactors,
    allSimulations,
  };
}

function calculateDistributionStats(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  const squaredDiffs = sorted.map((v) => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / n;
  const stdDev = Math.sqrt(variance);
  const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
  const cubedDiffs = sorted.map((v) => Math.pow((v - mean) / (stdDev || 1), 3));
  const skewness = cubedDiffs.reduce((a, b) => a + b, 0) / n;

  return { mean, median, stdDev, min: sorted[0], max: sorted[n - 1], skewness };
}

function calculatePercentiles(values: number[]): PercentileSet {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const getPercentile = (p: number) => sorted[Math.min(Math.floor((p / 100) * n), n - 1)];

  return {
    p5: getPercentile(5),
    p10: getPercentile(10),
    p25: getPercentile(25),
    p50: getPercentile(50),
    p75: getPercentile(75),
    p90: getPercentile(90),
    p95: getPercentile(95),
  };
}

function createHistogram(values: number[], bucketCount: number = 20): HistogramBucket[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const bucketSize = range / bucketCount;

  const buckets: HistogramBucket[] = [];
  for (let i = 0; i < bucketCount; i++) {
    const bucketMin = min + i * bucketSize;
    const bucketMax = min + (i + 1) * bucketSize;
    const count = values.filter((v) => v >= bucketMin && v < bucketMax).length;
    buckets.push({ min: bucketMin, max: bucketMax, count, frequency: count / values.length });
  }
  return buckets;
}

function calculateConfidenceBands(simulations: any[], timeHorizon: number): ConfidenceBand[] {
  const bands: ConfidenceBand[] = [];
  for (let month = 1; month <= timeHorizon; month++) {
    const arrValues = simulations
      .filter((s: any) => s.monthlySnapshots && s.monthlySnapshots.length >= month)
      .map((s: any) => s.monthlySnapshots[month - 1].arr);

    if (arrValues.length === 0) continue;

    const { p10, p25, p50, p75, p90 } = calculatePercentiles(arrValues);
    bands.push({ month, p10, p25, p50, p75, p90 });
  }
  return bands;
}
