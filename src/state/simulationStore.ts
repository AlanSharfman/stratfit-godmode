// src/state/simulationStore.ts
// STRATFIT — Simulation Results Store
// Persists Monte Carlo results for use across the dashboard

import { create } from 'zustand';
import type { LeverState, MonteCarloResult } from '@/logic/monteCarloEngine';
import type { Verdict } from '@/logic/verdictGenerator';

// Simplified results for quick access
export interface SimulationSummary {
  survivalRate: number;
  survivalPercent: string;
  
  arrMedian: number;
  arrP10: number;
  arrP90: number;
  arrFormatted: {
    p10: string;
    p50: string;
    p90: string;
  };
  
  runwayMedian: number;
  runwayP10: number;
  runwayP90: number;
  
  cashMedian: number;
  cashP10: number;
  cashP90: number;
  
  overallScore: number;
  overallRating: string;
  
  primaryRisk: string;
  topRecommendation: string;
  confidenceLevel: string;
}

interface SimulationState {
  // Status
  hasSimulated: boolean;
  isSimulating: boolean;
  lastSimulationTime: Date | null;
  simulationCount: number;
  
  // Full results (for detailed views)
  fullResult: MonteCarloResult | null;
  fullVerdict: Verdict | null;
  
  // Summary (for quick dashboard display)
  summary: SimulationSummary | null;
  
  // Lever snapshot (what levers were used for this simulation)
  leverSnapshot: LeverState | null;
  
  // Actions
  startSimulation: () => void;
  setSimulationResult: (result: MonteCarloResult, verdict: Verdict, levers: LeverState) => void;
  clearSimulation: () => void;
  
  // Helpers
  hasResultsForCurrentLevers: (currentLevers: LeverState) => boolean;
}

// Format currency helper
const formatCurrency = (value: number): string => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

// Create summary from full results
const createSummary = (result: MonteCarloResult, verdict: Verdict): SimulationSummary => {
  return {
    survivalRate: result.survivalRate,
    survivalPercent: `${Math.round(result.survivalRate * 100)}%`,
    
    arrMedian: result.arrPercentiles.p50,
    arrP10: result.arrPercentiles.p10,
    arrP90: result.arrPercentiles.p90,
    arrFormatted: {
      p10: formatCurrency(result.arrPercentiles.p10),
      p50: formatCurrency(result.arrPercentiles.p50),
      p90: formatCurrency(result.arrPercentiles.p90),
    },
    
    runwayMedian: result.runwayPercentiles.p50,
    runwayP10: result.runwayPercentiles.p10,
    runwayP90: result.runwayPercentiles.p90,
    
    cashMedian: result.cashPercentiles.p50,
    cashP10: result.cashPercentiles.p10,
    cashP90: result.cashPercentiles.p90,
    
    overallScore: verdict.overallScore,
    overallRating: verdict.overallRating,
    
    primaryRisk: verdict.primaryRisk,
    topRecommendation: verdict.recommendations[0]?.action ?? 'Continue current strategy',
    confidenceLevel: verdict.confidenceLevel,
  };
};

export const useSimulationStore = create<SimulationState>((set, get) => ({
  // Initial state
  hasSimulated: false,
  isSimulating: false,
  lastSimulationTime: null,
  simulationCount: 0,
  fullResult: null,
  fullVerdict: null,
  summary: null,
  leverSnapshot: null,
  
  // Start simulation (for loading state)
  startSimulation: () => set({
    isSimulating: true,
  }),
  
  // Save simulation results
  setSimulationResult: (result, verdict, levers) => set({
    hasSimulated: true,
    isSimulating: false,
    lastSimulationTime: new Date(),
    simulationCount: get().simulationCount + 1,
    fullResult: result,
    fullVerdict: verdict,
    summary: createSummary(result, verdict),
    leverSnapshot: { ...levers },
  }),
  
  // Clear simulation (when user wants fresh start)
  clearSimulation: () => set({
    hasSimulated: false,
    isSimulating: false,
    lastSimulationTime: null,
    fullResult: null,
    fullVerdict: null,
    summary: null,
    leverSnapshot: null,
  }),
  
  // Check if current levers match the simulated levers
  hasResultsForCurrentLevers: (currentLevers) => {
    const snapshot = get().leverSnapshot;
    if (!snapshot) return false;
    
    // Check if all lever values are the same (typed keys)
    const keys = Object.keys(currentLevers) as (keyof LeverState)[];
    for (const key of keys) {
      if (snapshot[key] !== currentLevers[key]) return false;
    }
    return true;
  },
}));

// Selector hooks for specific data
export const useSimulationSummary = () => useSimulationStore((s) => s.summary);
export const useHasSimulated = () => useSimulationStore((s) => s.hasSimulated);
export const useIsSimulating = () => useSimulationStore((s) => s.isSimulating);
export const useSimulationVerdict = () => useSimulationStore((s) => s.fullVerdict);
export const useSimulationResult = () => useSimulationStore((s) => s.fullResult);

export default useSimulationStore;

