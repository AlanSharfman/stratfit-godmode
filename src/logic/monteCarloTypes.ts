// src/logic/monteCarloTypes.ts
// STRATFIT — Monte Carlo type definitions

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
