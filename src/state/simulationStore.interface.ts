// src/state/simulationStore.ts
// STRATFIT — Simulation Store Interface Requirements
// 
// This file documents what your simulationStore MUST expose for 
// RISK, VALUATION, and COMPARE tabs to work correctly.
// 
// If your existing simulationStore doesn't have these fields,
// you'll need to add them.

import { create } from 'zustand';

// ============================================================================
// REQUIRED INTERFACE
// ============================================================================

export interface SimulationSummary {
  // REQUIRED for RISK + VALUATION
  survivalRate: number;       // 0-1 (e.g., 0.72 = 72% survival)
  medianRunway: number;       // Months (e.g., 18)
  medianARR: number;          // Annual $ (e.g., 1200000 = $1.2M)
  
  // REQUIRED for VALUATION timeline
  arrRange?: {
    p10: number;              // 10th percentile ARR
    p50: number;              // 50th percentile ARR (same as medianARR)
    p90: number;              // 90th percentile ARR
  };
  
  // REQUIRED for RISK timeline
  runwayRange?: {
    p10: number;              // 10th percentile runway
    p50: number;              // 50th percentile runway
    p90: number;              // 90th percentile runway
  };
  
  // OPTIONAL but recommended
  simulationCount?: number;   // How many Monte Carlo runs (e.g., 10000)
  confidence?: number;        // Confidence level (e.g., 95)
}

export interface FullSimulationResult {
  // Monthly ARR projections for timeline charts
  arrConfidenceBands?: Array<{
    month: number;
    p10: number;
    p50: number;
    p90: number;
  }>;
  
  // Monthly runway projections
  runwayConfidenceBands?: Array<{
    month: number;
    p10: number;
    p50: number;
    p90: number;
  }>;
  
  // Raw simulation data (if available)
  rawResults?: any[];
}

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface SimulationState {
  // State
  summary: SimulationSummary | null;
  fullResult: FullSimulationResult | null;
  hasSimulated: boolean;
  isRunning: boolean;
  error: string | null;
  
  // Actions
  runSimulation: (levers: Record<string, number>) => Promise<void>;
  setSummary: (summary: SimulationSummary) => void;
  setFullResult: (result: FullSimulationResult) => void;
  reset: () => void;
}

// ============================================================================
// EXAMPLE IMPLEMENTATION
// ============================================================================

export const useSimulationStore = create<SimulationState>((set, get) => ({
  summary: null,
  fullResult: null,
  hasSimulated: false,
  isRunning: false,
  error: null,
  
  runSimulation: async (levers) => {
    set({ isRunning: true, error: null });
    
    try {
      // Your Monte Carlo simulation logic here
      // ...
      
      // After simulation completes, set the summary
      const summary: SimulationSummary = {
        survivalRate: 0.72,         // Calculate from simulation
        medianRunway: 18,           // Calculate from simulation
        medianARR: 1200000,         // Calculate from simulation
        arrRange: {
          p10: 800000,
          p50: 1200000,
          p90: 2100000,
        },
        runwayRange: {
          p10: 12,
          p50: 18,
          p90: 24,
        },
        simulationCount: 10000,
      };
      
      set({
        summary,
        hasSimulated: true,
        isRunning: false,
      });
      
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Simulation failed',
        isRunning: false,
      });
    }
  },
  
  setSummary: (summary) => set({ summary, hasSimulated: true }),
  
  setFullResult: (result) => set({ fullResult: result }),
  
  reset: () => set({
    summary: null,
    fullResult: null,
    hasSimulated: false,
    error: null,
  }),
}));

// ============================================================================
// SELECTORS
// ============================================================================

// Use these in your components
export const useSimulationSummary = () => useSimulationStore(s => s.summary);
export const useHasSimulated = () => useSimulationStore(s => s.hasSimulated);
export const useIsSimulationRunning = () => useSimulationStore(s => s.isRunning);

// ============================================================================
// WHAT YOUR EXISTING STORE NEEDS
// ============================================================================

/**
 * CHECK YOUR EXISTING simulationStore.ts:
 * 
 * 1. Does it have a `summary` object with these fields?
 *    - survivalRate (number 0-1)
 *    - medianRunway (number, months)
 *    - medianARR (number, annual $)
 * 
 * 2. Does it have a `hasSimulated` boolean?
 * 
 * 3. Does it expose `arrRange` with p10/p50/p90?
 * 
 * If YES to all → Your store is ready!
 * If NO → Add the missing fields to your store.
 * 
 * The RISK and VALUATION stores import from your simulationStore,
 * so the field names must match exactly.
 */

export default useSimulationStore;
