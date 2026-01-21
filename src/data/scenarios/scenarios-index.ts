/**
 * STRATFIT - Pre-calculated Monte Carlo Scenario Data
 * 
 * THE 4 STRATEGY-BASED SITUATIONS:
 * 1. Current Trajectory - Continue as-is (baseline)
 * 2. Series B Raise - Aggressive growth with $15M raise
 * 3. Profitability Push - Bootstrap to profitability
 * 4. Geographic Expansion - Raise $8M, expand to APAC
 * 
 * Each scenario represents 10,000 Monte Carlo simulations.
 * For the demo, we pre-calculate results for instant loading.
 * Post-funding, users will be able to run custom simulations.
 */

// Type exports
export { type ScenarioData, type MilestoneData } from './seriesBStressTest';

// Scenario data exports
export { CURRENT_TRAJECTORY } from './currentTrajectory';
export { SERIES_B_STRESS_TEST } from './seriesBStressTest';
export { PROFITABILITY_PUSH } from './profitabilityPush';
export { APAC_EXPANSION } from './apacExpansion';

// Imports for arrays and lookups
import { CURRENT_TRAJECTORY } from './currentTrajectory';
import { SERIES_B_STRESS_TEST } from './seriesBStressTest';
import { PROFITABILITY_PUSH } from './profitabilityPush';
import { APAC_EXPANSION } from './apacExpansion';
import type { ScenarioData } from './seriesBStressTest';

// ===========================================
// THE 4 STRATEGY-BASED SITUATIONS
// ===========================================
export const ALL_SCENARIOS: ScenarioData[] = [
  CURRENT_TRAJECTORY,      // Base case - where you're heading now
  SERIES_B_STRESS_TEST,    // Aggressive growth with Series B raise
  PROFITABILITY_PUSH,      // Bootstrap to profitability
  APAC_EXPANSION,          // Geographic expansion to APAC
];

// Scenario lookup by ID
export const SCENARIO_BY_ID: Record<string, ScenarioData> = {
  'current-trajectory': CURRENT_TRAJECTORY,
  'series-b-stress-test': SERIES_B_STRESS_TEST,
  'profitability-push': PROFITABILITY_PUSH,
  'apac-expansion': APAC_EXPANSION,
};

// Default scenario (Terrain Tab)
export const DEFAULT_SCENARIO = CURRENT_TRAJECTORY;

// Default comparison pairs (Compare Tab)
export const DEFAULT_COMPARISON = {
  strategyA: CURRENT_TRAJECTORY,
  strategyB: SERIES_B_STRESS_TEST,
};

// Get scenario by ID
export function getScenarioById(id: string): ScenarioData | undefined {
  return SCENARIO_BY_ID[id];
}

// Get all scenario IDs
export function getAllScenarioIds(): string[] {
  return Object.keys(SCENARIO_BY_ID);
}

// Get comparison metrics between two scenarios
export function getComparisonMetrics(scenarioA: ScenarioData, scenarioB: ScenarioData) {
  const successDiff = scenarioA.metrics.successRate - scenarioB.metrics.successRate;
  const exitDiff = scenarioA.metrics.exitValue - scenarioB.metrics.exitValue;
  const riskDiff = scenarioA.metrics.riskScore - scenarioB.metrics.riskScore;
  const runwayDiff = scenarioA.metrics.avgRunway - scenarioB.metrics.avgRunway;
  const dilutionDiff = scenarioA.metrics.dilution - scenarioB.metrics.dilution;

  return {
    // Raw deltas
    successRateDelta: successDiff,
    exitValueDelta: exitDiff,
    riskScoreDelta: riskDiff,
    runwayDelta: runwayDiff,
    dilutionDelta: dilutionDiff,
    
    // Formatted for display
    formatted: {
      successRateDelta: `${successDiff >= 0 ? '+' : ''}${(successDiff * 100).toFixed(0)}%`,
      exitValueDelta: `${exitDiff >= 0 ? '+' : ''}$${exitDiff.toFixed(1)}M`,
      riskScoreDelta: `${riskDiff >= 0 ? '+' : ''}${riskDiff}`,
      runwayDelta: `${runwayDiff >= 0 ? '+' : ''}${runwayDiff} mo`,
      dilutionDelta: `${dilutionDiff >= 0 ? '+' : ''}${(dilutionDiff * 100).toFixed(0)}%`,
    },

    // Indicators (which scenario wins on each metric)
    indicators: {
      successRate: successDiff > 0 ? 'A' : successDiff < 0 ? 'B' : 'tie',
      exitValue: exitDiff > 0 ? 'A' : exitDiff < 0 ? 'B' : 'tie',
      riskScore: riskDiff < 0 ? 'A' : riskDiff > 0 ? 'B' : 'tie', // Lower risk is better
      runway: runwayDiff > 0 ? 'A' : runwayDiff < 0 ? 'B' : 'tie',
      dilution: dilutionDiff < 0 ? 'A' : dilutionDiff > 0 ? 'B' : 'tie', // Lower dilution is better
    },
  };
}
