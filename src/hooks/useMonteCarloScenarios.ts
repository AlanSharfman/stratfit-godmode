/**
 * STRATFIT - Monte Carlo Scenarios Hook
 * Provides access to pre-calculated scenario simulations
 */

import { useMemo } from 'react';
import { 
  ALL_SCENARIOS, 
  SCENARIO_BY_ID, 
  getScenarioById, 
  getComparisonMetrics,
  type ScenarioData 
} from '@/data/scenarios/scenarios-index';

export function useMonteCarloScenarios() {
  return useMemo(() => ({
    // All available scenarios
    scenarios: ALL_SCENARIOS,
    
    // Get scenario by ID
    getById: (id: string) => getScenarioById(id),
    
    // Compare two scenarios
    compare: (scenarioA: ScenarioData, scenarioB: ScenarioData) => 
      getComparisonMetrics(scenarioA, scenarioB),
    
    // Lookup map
    byId: SCENARIO_BY_ID,
    
    // Helper: Get scenario names for dropdown
    scenarioOptions: ALL_SCENARIOS.map(s => ({
      id: s.id,
      name: s.name,
      shortName: s.shortName,
      color: s.color,
      riskLevel: s.metrics.riskLevel,
      successRate: s.metrics.successRate,
    })),
  }), []);
}

export type { ScenarioData, MilestoneData } from '@/data/scenarios/scenarios-index';

