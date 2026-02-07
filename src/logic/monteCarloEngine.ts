// src/logic/monteCarloEngine.ts
// STRATFIT — Monte Carlo Simulation Engine
// 10,000 Futures. One Truth.

import { EngineElasticityParams } from "./foundationElasticity";
import { calculateStructuralRiskIndex } from "./structuralRiskIndex";

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
  seed?: number; // Deterministic seed from Foundation structure
  elasticity?: EngineElasticityParams; // Foundation-derived stochastic parameters
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
  structuralRiskIndex: number; // Foundation-derived risk score (0-100)
  
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

/**
 * Seeded RNG using mulberry32 algorithm
 * Ensures deterministic simulations when Foundation baseline is locked
 */
export class SeededRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  gaussian(mean: number = 0, stdDev: number = 1): number {
    // Box-Muller transform for normal distribution
    const u1 = this.next();
    const u2 = this.next();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * stdDev + mean;
  }
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
  config: SimulationConfig,
  rng: SeededRNG
): SingleSimulationResult {

  const snapshots: MonthlySnapshot[] = [];

  let cash = config.startingCash;
  let arr = config.startingARR;
  let burn = config.monthlyBurn;
  let didSurvive = true;
  let survivalMonths = config.timeHorizonMonths;
  let peakARR = arr;
  let lowestCash = cash;

  const baseGrowthRate = (levers.demandStrength - 50) / 500;
  const pricingMultiplier = 1 + (levers.pricingPower - 50) / 200;
  const expansionBoost = (levers.expansionVelocity - 50) / 400;
  const costEfficiency = levers.costDiscipline / 100;
  const hiringDrag = levers.hiringIntensity / 150;
  const operatingCost = levers.operatingDrag / 100;
  const execRisk = levers.executionRisk / 100;
  const fundingRisk = levers.fundingPressure / 100;

  const elasticity = config.elasticity;

  const revenueVolatility = elasticity?.revenueVolPct ?? 0.08;
  const burnVolatility = elasticity?.burnVolPct ?? 0.10;
  const shockProb = elasticity?.shockProb ?? 0.03;
  const shockRevenuePct = elasticity?.shockSeverityRevenuePct ?? 0.15;
  const shockBurnPct = elasticity?.shockSeverityBurnPct ?? 0.12;

  const corrRevenueBurn = elasticity?.corrRevenueBurn ?? -0.35;

  for (let month = 1; month <= config.timeHorizonMonths; month++) {

    // -------- CORRELATED SHOCKS --------
    // Generate two independent normals
    const z1 = rng.gaussian(0, 1);
    const z2 = rng.gaussian(0, 1);

    // Apply correlation manually (Cholesky 2x2 simplified)
    const revenueShock = z1 * revenueVolatility;
    const burnShock = (corrRevenueBurn * z1 + Math.sqrt(1 - corrRevenueBurn ** 2) * z2) * burnVolatility;

    const isShockMonth = rng.next() < shockProb;

    let monthlyGrowth =
      baseGrowthRate +
      expansionBoost +
      revenueShock;

    monthlyGrowth *= pricingMultiplier;

    if (rng.next() < execRisk * 0.1) {
      monthlyGrowth += rng.gaussian(-0.08, 0.04);
    }

    if (isShockMonth) {
      monthlyGrowth -= shockRevenuePct;
    }

    if (fundingRisk > 0.5 && cash < config.startingCash * 0.3) {
      monthlyGrowth *= (1 - fundingRisk * 0.5);
    }

    arr = arr * (1 + monthlyGrowth);
    arr = Math.max(0, arr);
    peakARR = Math.max(peakARR, arr);

    const baseBurn = config.monthlyBurn;
    const hiringSurge = hiringDrag * baseBurn * 0.3;
    const operatingExtra = operatingCost * baseBurn * 0.2;
    const efficiencySavings = costEfficiency * baseBurn * 0.25;

    burn = baseBurn + hiringSurge + operatingExtra - efficiencySavings;

    burn = burn * (1 + burnShock);

    if (isShockMonth) {
      burn *= (1 + shockBurnPct);
    }

    burn = Math.max(burn, baseBurn * 0.5);

    const monthlyRevenue = arr / 12;
    const netCashFlow = monthlyRevenue - burn;
    cash += netCashFlow;

    lowestCash = Math.min(lowestCash, cash);

    const runway =
      burn > monthlyRevenue
        ? cash / (burn - monthlyRevenue)
        : 999;

    snapshots.push({
      month,
      arr,
      cash,
      burn,
      runway: Math.min(runway, 120),
      growthRate: monthlyGrowth,
    });

    if (cash <= 0) {
      didSurvive = false;
      survivalMonths = month;
      break;
    }
  }

  const finalSnapshot = snapshots[snapshots.length - 1];
  const targetARR = config.startingARR * 2;

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
  baseResult: number,
  seed: number
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
    // Test +20% change (use same seed for fair comparison)
    const modifiedLevers = { ...levers, [lever]: clamp(levers[lever] + 20, 0, 100) };
    const rng = new SeededRNG(seed);
    const testResult = runSingleSimulation(0, modifiedLevers, config, rng);
    
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
  
  // Initialize RNG with Foundation seed (or default)
  const masterSeed = config.seed ?? 12345;
  
  // Run all simulations
  const allSimulations: SingleSimulationResult[] = [];
  
  for (let i = 0; i < config.iterations; i++) {
    // Each simulation gets its own RNG seeded deterministically from master seed
    const rng = new SeededRNG(masterSeed + i);
    allSimulations.push(runSingleSimulation(i, levers, config, rng));
  }
  
  // Calculate survival metrics
  const survivors = allSimulations.filter(s => s.didSurvive);
  const survivalRate = survivors.length / config.iterations;
  
  const survivalByMonth: number[] = [];
  for (let month = 1; month <= config.timeHorizonMonths; month++) {
    const survivingAtMonth = allSimulations.filter(s => s.survivalMonths >= month).length;
    survivalByMonth.push(survivingAtMonth / config.iterations);
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
  const worstCase = sortedByARR[Math.floor(config.iterations * 0.05)]; // P5
  const medianCase = sortedByARR[Math.floor(config.iterations * 0.5)]; // P50
  const bestCase = sortedByARR[Math.floor(config.iterations * 0.95)]; // P95
  
  // Calculate sensitivity
  const sensitivityFactors = calculateSensitivity(levers, config, medianCase.finalARR, masterSeed);
  
  // Calculate Structural Risk Index from Foundation elasticity
  const structuralRiskIndex = calculateStructuralRiskIndex(config.elasticity ?? null);
  
  const executionTimeMs = performance.now() - startTime;
  
  return {
    iterations: config.iterations,
    timeHorizonMonths: config.timeHorizonMonths,
    executionTimeMs,
    structuralRiskIndex,
    
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

// ============================================================================
// CHUNKED SIMULATION PROCESSOR (for real-time progress updates)
// ============================================================================

export function processSimulationResults(
  allSimulations: SingleSimulationResult[],
  config: SimulationConfig,
  levers: LeverState,
  executionTimeMs: number,
  seed: number = 12345
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
  const sensitivityFactors = calculateSensitivity(levers, config, medianCase.finalARR, seed);
  
  // Calculate Structural Risk Index from Foundation elasticity
  const structuralRiskIndex = calculateStructuralRiskIndex(config.elasticity ?? null);
  
  return {
    iterations: allSimulations.length,
    timeHorizonMonths: config.timeHorizonMonths,
    executionTimeMs,
    structuralRiskIndex,
    
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
