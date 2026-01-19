/**
 * STRATFIT - Pre-calculated Monte Carlo Scenario Data
 * 
 * These scenarios represent 10,000 Monte Carlo simulations each.
 * For the demo, we pre-calculate results for instant loading.
 * Post-funding, users will be able to run custom simulations.
 */

export { SERIES_B_STRESS_TEST, type ScenarioData, type MilestoneData } from './seriesBStressTest';
export { PROFITABILITY_PUSH } from './profitabilityPush';
export { APAC_EXPANSION } from './apacExpansion';

import { SERIES_B_STRESS_TEST } from './seriesBStressTest';
import { PROFITABILITY_PUSH } from './profitabilityPush';
import { APAC_EXPANSION } from './apacExpansion';
import type { ScenarioData } from './seriesBStressTest';

// All available scenarios for the demo
export const ALL_SCENARIOS: ScenarioData[] = [
  SERIES_B_STRESS_TEST,
  PROFITABILITY_PUSH,
  APAC_EXPANSION,
];

// Scenario lookup by ID
export const SCENARIO_BY_ID: Record<string, ScenarioData> = {
  'series-b-stress-test': SERIES_B_STRESS_TEST,
  'profitability-push': PROFITABILITY_PUSH,
  'apac-expansion': APAC_EXPANSION,
};

// Default comparison pairs
export const DEFAULT_COMPARISON = {
  strategyA: SERIES_B_STRESS_TEST,
  strategyB: PROFITABILITY_PUSH,
};

// Get scenario by ID
export function getScenarioById(id: string): ScenarioData | undefined {
  return SCENARIO_BY_ID[id];
}

// Get comparison metrics between two scenarios
export function getComparisonMetrics(scenarioA: ScenarioData, scenarioB: ScenarioData) {
  return {
    successRateDelta: scenarioA.metrics.successRate - scenarioB.metrics.successRate,
    exitValueDelta: scenarioA.metrics.exitValue - scenarioB.metrics.exitValue,
    riskScoreDelta: scenarioA.metrics.riskScore - scenarioB.metrics.riskScore,
    runwayDelta: scenarioA.metrics.avgRunway - scenarioB.metrics.avgRunway,
    dilutionDelta: scenarioA.metrics.dilution - scenarioB.metrics.dilution,
    
    // Formatted for display
    formatted: {
      successRateDelta: `${((scenarioA.metrics.successRate - scenarioB.metrics.successRate) * 100).toFixed(0)}%`,
      exitValueDelta: `$${(scenarioA.metrics.exitValue - scenarioB.metrics.exitValue).toFixed(1)}M`,
      riskScoreDelta: `${scenarioA.metrics.riskScore - scenarioB.metrics.riskScore}`,
      runwayDelta: `${scenarioA.metrics.avgRunway - scenarioB.metrics.avgRunway} mo`,
      dilutionDelta: `${((scenarioA.metrics.dilution - scenarioB.metrics.dilution) * 100).toFixed(0)}%`,
    },
  };
}
