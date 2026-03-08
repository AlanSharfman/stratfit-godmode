// src/logic/monteCarloStats.ts
// STRATFIT — Pure math/statistics utilities for Monte Carlo simulation

import type {
  SingleSimulationResult,
  DistributionStats,
  PercentileSet,
  HistogramBucket,
  ConfidenceBand,
} from "./monteCarloTypes";

// ============================================================================
// RANDOM NUMBER GENERATION
// ============================================================================

export function gaussianRandom(mean: number = 0, stdDev: number = 1): number {
  // Box-Muller transform for normal distribution
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdDev + mean;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ============================================================================
// STATISTICS FUNCTIONS
// ============================================================================

export function calculateDistributionStats(values: number[]): DistributionStats {
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

export function calculatePercentiles(values: number[]): PercentileSet {
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

export function createHistogram(values: number[], bucketCount: number = 20): HistogramBucket[] {
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

export function calculateConfidenceBands(
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
