// src/logic/monteCarloEngine.ts
// STRATFIT — Monte Carlo Simulation Engine
// 10,000 Futures. One Truth.

export interface LeverState {
  demandStrength: number;
  pricingPower: number;
  expansionVelocity: number;
  costDiscipline: number;
  hiringIntensity: number;
  operatingDrag: number;
  marketVolatility: number;
  executionRisk: number;
  fundingPressure: number;
}

export interface SimulationConfig {
  iterations: number;
  timeHorizonMonths: number;
  startingCash: number;
  startingARR: number;
  monthlyBurn: number;
}

export interface SingleSimulationResult {
  id: number;
  monthlySnapshots: MonthlySnapshot[];
  finalARR: number;
  finalCash: number;
  finalRunway: number;
  survivalMonths: number;
  didSurvive: boolean;
  didAchieveTarget: boolean;
  peakARR: number;
  lowestCash: number;
}

export interface MonthlySnapshot {
  month: number;
  arr: number;
  cash: number;
  burn: number;
  runway: number;
  growthRate: number;
}

export interface MonteCarloResult {
  // Meta
  iterations: number;
  timeHorizonMonths: number;
  executionTimeMs: number;
  
  // Survival Analysis
  survivalRate: number;
  survivalByMonth: number[];
  medianSurvivalMonths: number;
  
  // ARR Distribution
  arrDistribution: DistributionStats;
  arrHistogram: HistogramBucket[];
  arrPercentiles: PercentileSet;
  arrConfidenceBands: ConfidenceBand[];
  
  // Cash Distribution
  cashDistribution: DistributionStats;
  cashPercentiles: PercentileSet;
  
  // Runway Distribution
  runwayDistribution: DistributionStats;
  runwayPercentiles: PercentileSet;
  
  // Scenario Snapshots
  bestCase: SingleSimulationResult;
  worstCase: SingleSimulationResult;
  medianCase: SingleSimulationResult;
  
  // Sensitivity Analysis
  sensitivityFactors: SensitivityFactor[];
  
  // All Simulations (for detailed analysis)
  allSimulations: SingleSimulationResult[];
}

export interface DistributionStats {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  skewness: number;
}

export interface PercentileSet {
  p5: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
}

export interface HistogramBucket {
  min: number;
  max: number;
  count: number;
  frequency: number;
}

export interface ConfidenceBand {
  month: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

export interface SensitivityFactor {
  lever: keyof LeverState;
  label: string;
  impact: number; // -1 to 1, correlation with outcome
  direction: 'positive' | 'negative';
}

// ============================================================================
// RANDOM NUMBER GENERATION
// ============================================================================

function gaussianRandom(mean: number = 0, stdDev: number = 1): number {
  // Box-Muller transform for normal distribution
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdDev + mean;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ============================================================================
// SIMULATION LOGIC
// ============================================================================

export function runSingleSimulation(
  id: number,
  levers: LeverState,
  config: SimulationConfig
): SingleSimulationResult {
  const snapshots: MonthlySnapshot[] = [];
  
  let cash = config.startingCash;
  let arr = config.startingARR;
  let burn = config.monthlyBurn;
  let didSurvive = true;
  let survivalMonths = config.timeHorizonMonths;
  let peakARR = arr;
  let lowestCash = cash;
  
  // Convert levers to growth/risk factors (0-100 scale to multipliers)
  const baseGrowthRate = (levers.demandStrength - 50) / 500; // -10% to +10% monthly
  const pricingMultiplier = 1 + (levers.pricingPower - 50) / 200; // 0.75x to 1.25x
  const expansionBoost = (levers.expansionVelocity - 50) / 400; // -12.5% to +12.5%
  
  const costEfficiency = levers.costDiscipline / 100; // 0 to 1
  const hiringDrag = levers.hiringIntensity / 150; // 0 to 0.67
  const operatingCost = levers.operatingDrag / 100; // 0 to 1
  
  const marketRisk = levers.marketVolatility / 100; // 0 to 1
  const execRisk = levers.executionRisk / 100; // 0 to 1
  const fundingRisk = levers.fundingPressure / 100; // 0 to 1
  
  // Volatility based on risk levers
  const volatility = 0.02 + (marketRisk * 0.08); // 2% to 10% monthly volatility
  
  for (let month = 1; month <= config.timeHorizonMonths; month++) {
    // Random shock for this month
    const shock = gaussianRandom(0, volatility);
    const executionShock = Math.random() < execRisk * 0.1 ? gaussianRandom(-0.1, 0.05) : 0;
    
    // Calculate growth rate for this month
    let monthlyGrowth = baseGrowthRate + expansionBoost + shock + executionShock;
    monthlyGrowth *= pricingMultiplier;
    
    // Apply funding pressure (reduces growth if high)
    if (fundingRisk > 0.5 && cash < config.startingCash * 0.3) {
      monthlyGrowth *= (1 - fundingRisk * 0.5);
    }
    
    // Update ARR
    arr = arr * (1 + monthlyGrowth);
    arr = Math.max(0, arr);
    peakARR = Math.max(peakARR, arr);
    
    // Calculate burn (affected by efficiency)
    const baseBurn = config.monthlyBurn;
    const hiringSurge = hiringDrag * baseBurn * 0.3;
    const operatingExtra = operatingCost * baseBurn * 0.2;
    const efficiencySavings = costEfficiency * baseBurn * 0.25;
    
    burn = baseBurn + hiringSurge + operatingExtra - efficiencySavings;
    burn = Math.max(burn * 0.5, burn); // Floor at 50% of base
    
    // Update cash
    const monthlyRevenue = arr / 12;
    const netCashFlow = monthlyRevenue - burn;
    cash += netCashFlow;
    lowestCash = Math.min(lowestCash, cash);
    
    // Calculate runway
    const runway = burn > monthlyRevenue ? cash / (burn - monthlyRevenue) : 999;
    
    // Record snapshot
    snapshots.push({
      month,
      arr,
      cash,
      burn,
      runway: Math.min(runway, 120),
      growthRate: monthlyGrowth,
    });
    
    // Check survival
    if (cash <= 0) {
      didSurvive = false;
      survivalMonths = month;
      break;
    }
  }
  
  const finalSnapshot = snapshots[snapshots.length - 1];
  const targetARR = config.startingARR * 2; // Target: 2x ARR growth
  
  return {
    id,
    monthlySnapshots: snapshots,
    finalARR: finalSnapshot?.arr ?? 0,
    finalCash: finalSnapshot?.cash ?? 0,
    finalRunway: finalSnapshot?.runway ?? 0,
    survivalMonths,
    didSurvive,
    didAchieveTarget: finalSnapshot?.arr >= targetARR,
    peakARR,
    lowestCash,
  };
}

// ============================================================================
// STATISTICS FUNCTIONS
// ============================================================================

function calculateDistributionStats(values: number[]): DistributionStats {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  
  const squaredDiffs = sorted.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / n;
  const stdDev = Math.sqrt(variance);
  
  const median = n % 2 === 0 
    ? (sorted[n/2 - 1] + sorted[n/2]) / 2 
    : sorted[Math.floor(n/2)];
  
  // Skewness
  const cubedDiffs = sorted.map(v => Math.pow((v - mean) / stdDev, 3));
  const skewness = cubedDiffs.reduce((a, b) => a + b, 0) / n;
  
  return {
    mean,
    median,
    stdDev,
    min: sorted[0],
    max: sorted[n - 1],
    skewness,
  };
}

function calculatePercentiles(values: number[]): PercentileSet {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  
  const getPercentile = (p: number) => {
    const index = Math.floor((p / 100) * n);
    return sorted[Math.min(index, n - 1)];
  };
  
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
    const count = values.filter(v => v >= bucketMin && v < bucketMax).length;
    
    buckets.push({
      min: bucketMin,
      max: bucketMax,
      count,
      frequency: count / values.length,
    });
  }
  
  return buckets;
}

function calculateConfidenceBands(
  simulations: SingleSimulationResult[],
  timeHorizon: number
): ConfidenceBand[] {
  const bands: ConfidenceBand[] = [];
  
  for (let month = 1; month <= timeHorizon; month++) {
    const arrValues = simulations
      .filter(s => s.monthlySnapshots.length >= month)
      .map(s => s.monthlySnapshots[month - 1].arr);
    
    if (arrValues.length === 0) continue;
    
    const sorted = arrValues.sort((a, b) => a - b);
    const n = sorted.length;
    
    bands.push({
      month,
      p10: sorted[Math.floor(n * 0.1)],
      p25: sorted[Math.floor(n * 0.25)],
      p50: sorted[Math.floor(n * 0.5)],
      p75: sorted[Math.floor(n * 0.75)],
      p90: sorted[Math.floor(n * 0.9)],
    });
  }
  
  return bands;
}

function calculateSensitivity(
  levers: LeverState,
  config: SimulationConfig,
  baseResult: number
): SensitivityFactor[] {
  const leverLabels: Record<keyof LeverState, string> = {
    demandStrength: 'Demand Strength',
    pricingPower: 'Pricing Power',
    expansionVelocity: 'Expansion Velocity',
    costDiscipline: 'Cost Discipline',
    hiringIntensity: 'Hiring Intensity',
    operatingDrag: 'Operating Drag',
    marketVolatility: 'Market Volatility',
    executionRisk: 'Execution Risk',
    fundingPressure: 'Funding Pressure',
  };
  
  const factors: SensitivityFactor[] = [];
  
  for (const lever of Object.keys(levers) as (keyof LeverState)[]) {
    // Test +20% change
    const modifiedLevers = { ...levers, [lever]: clamp(levers[lever] + 20, 0, 100) };
    const testResult = runSingleSimulation(0, modifiedLevers, config);
    
    const impact = (testResult.finalARR - baseResult) / baseResult;
    
    factors.push({
      lever,
      label: leverLabels[lever],
      impact: clamp(impact, -1, 1),
      direction: impact >= 0 ? 'positive' : 'negative',
    });
  }
  
  // Sort by absolute impact
  return factors.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
}

// ============================================================================
// MAIN SIMULATION FUNCTION
// ============================================================================

import { emitCompute } from "@/engine/computeTelemetry";
import { engineActivity } from "@/state/engineActivityStore";

// Throttle interval for activity updates (iterations)
const ACTIVITY_UPDATE_INTERVAL = 250;

export function runMonteCarloSimulation(
  levers: LeverState,
  config: SimulationConfig = {
    iterations: 10000,
    timeHorizonMonths: 36,
    startingCash: 4000000,
    startingARR: 4800000,
    monthlyBurn: 47000,
  }
): MonteCarloResult {
  const startTime = performance.now();

  emitCompute("terrain_simulation", "initialize", {
    methodName: "Monte Carlo",
    iterations: config.iterations,
  });

  // ── ENGINE ACTIVITY: start ──
  engineActivity.start({
    iterationsTarget: config.iterations,
    seed: 0, // deterministic
    modelType: "MonteCarlo",
  });

  try {
    // Run all simulations
    emitCompute("terrain_simulation", "run_model");
    const allSimulations: SingleSimulationResult[] = [];
    
    for (let i = 0; i < config.iterations; i++) {
      allSimulations.push(runSingleSimulation(i, levers, config));

      // ── ENGINE ACTIVITY: throttled update ──
      if (i > 0 && i % ACTIVITY_UPDATE_INTERVAL === 0) {
        engineActivity.update({
          stage: "SAMPLING",
          iterationsCompleted: i,
          message: "Sampling distribution…",
        });
      }
    }
    
    // ── ENGINE ACTIVITY: aggregating ──
    engineActivity.update({
      stage: "AGGREGATING",
      iterationsCompleted: config.iterations,
      message: "Aggregating percentiles…",
    });

    // Calculate survival metrics
    emitCompute("terrain_simulation", "aggregate");
    const survivors = allSimulations.filter(s => s.didSurvive);
    const survivalRate = survivors.length / config.iterations;
    
    const survivalByMonth: number[] = [];
    for (let month = 1; month <= config.timeHorizonMonths; month++) {
      const survivingAtMonth = allSimulations.filter(s => s.survivalMonths >= month).length;
      survivalByMonth.push(survivingAtMonth / config.iterations);
    }
    
    const survivalMonths = allSimulations.map(s => s.survivalMonths);
    const medianSurvivalMonths = calculatePercentiles(survivalMonths).p50;

    // ── ENGINE ACTIVITY: converging ──
    engineActivity.update({
      stage: "CONVERGING",
      message: "Calculating survival probability…",
    });
    
    // Calculate ARR distributions
    const finalARRs = allSimulations.map(s => s.finalARR);
    const arrDistribution = calculateDistributionStats(finalARRs);
    const arrHistogram = createHistogram(finalARRs, 25);
    const arrPercentiles = calculatePercentiles(finalARRs);
    const arrConfidenceBands = calculateConfidenceBands(allSimulations, config.timeHorizonMonths);
    
    // Calculate Cash distributions
    const finalCash = allSimulations.map(s => s.finalCash);
    const cashDistribution = calculateDistributionStats(finalCash);
    const cashPercentiles = calculatePercentiles(finalCash);
    
    // Calculate Runway distributions
    const finalRunway = allSimulations.map(s => s.finalRunway);
    const runwayDistribution = calculateDistributionStats(finalRunway);
    const runwayPercentiles = calculatePercentiles(finalRunway);

    // ── ENGINE ACTIVITY: finalizing ──
    engineActivity.update({
      stage: "FINALIZING",
      message: "Finalizing output…",
    });
    
    // Find best, worst, median cases
    const sortedByARR = [...allSimulations].sort((a, b) => a.finalARR - b.finalARR);
    const worstCase = sortedByARR[Math.floor(config.iterations * 0.05)]; // P5
    const medianCase = sortedByARR[Math.floor(config.iterations * 0.5)]; // P50
    const bestCase = sortedByARR[Math.floor(config.iterations * 0.95)]; // P95
    
    // Calculate sensitivity
    const sensitivityFactors = calculateSensitivity(levers, config, medianCase.finalARR);
    
    const executionTimeMs = performance.now() - startTime;

    emitCompute("terrain_simulation", "complete", {
      durationMs: executionTimeMs,
      iterations: config.iterations,
      methodName: "Monte Carlo",
    });

    // ── ENGINE ACTIVITY: complete ──
    engineActivity.complete();
    
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
  } catch (err: any) {
    // ── ENGINE ACTIVITY: fail ──
    engineActivity.fail(err?.message ?? "Unknown simulation error");
    throw err;
  }
}

// ============================================================================
// CHUNKED SIMULATION PROCESSOR (for real-time progress updates)
// ============================================================================

export function processSimulationResults(
  allSimulations: SingleSimulationResult[],
  config: SimulationConfig,
  levers: LeverState,
  executionTimeMs: number
): MonteCarloResult {
  // Calculate survival metrics
  const survivors = allSimulations.filter(s => s.didSurvive);
  const survivalRate = survivors.length / allSimulations.length;
  
  const survivalByMonth: number[] = [];
  for (let month = 1; month <= config.timeHorizonMonths; month++) {
    const survivingAtMonth = allSimulations.filter(s => s.survivalMonths >= month).length;
    survivalByMonth.push(survivingAtMonth / allSimulations.length);
  }
  
  const survivalMonths = allSimulations.map(s => s.survivalMonths);
  const medianSurvivalMonths = calculatePercentiles(survivalMonths).p50;
  
  // Calculate ARR distributions
  const finalARRs = allSimulations.map(s => s.finalARR);
  const arrDistribution = calculateDistributionStats(finalARRs);
  const arrHistogram = createHistogram(finalARRs, 25);
  const arrPercentiles = calculatePercentiles(finalARRs);
  const arrConfidenceBands = calculateConfidenceBands(allSimulations, config.timeHorizonMonths);
  
  // Calculate Cash distributions
  const finalCash = allSimulations.map(s => s.finalCash);
  const cashDistribution = calculateDistributionStats(finalCash);
  const cashPercentiles = calculatePercentiles(finalCash);
  
  // Calculate Runway distributions
  const finalRunway = allSimulations.map(s => s.finalRunway);
  const runwayDistribution = calculateDistributionStats(finalRunway);
  const runwayPercentiles = calculatePercentiles(finalRunway);
  
  // Find best, worst, median cases
  const sortedByARR = [...allSimulations].sort((a, b) => a.finalARR - b.finalARR);
  const worstCase = sortedByARR[Math.floor(allSimulations.length * 0.05)]; // P5
  const medianCase = sortedByARR[Math.floor(allSimulations.length * 0.5)]; // P50
  const bestCase = sortedByARR[Math.floor(allSimulations.length * 0.95)]; // P95
  
  // Calculate sensitivity
  const sensitivityFactors = calculateSensitivity(levers, config, medianCase.finalARR);
  
  return {
    iterations: allSimulations.length,
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

export default runMonteCarloSimulation;
