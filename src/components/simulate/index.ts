// src/components/simulate/index.ts
// STRATFIT — Simulation Module Exports

export { default as SimulateOverlay } from './SimulateOverlayWired';
export { default as SimulateHeader } from './SimulateHeader';
export { default as VerdictPanel } from './VerdictPanel';
export { default as ProbabilityDistribution } from './ProbabilityDistribution';
export { default as ConfidenceFan } from './ConfidenceFan';
export { default as ScenarioCards } from './ScenarioCards';
export { default as SensitivityBars } from './SensitivityBars';
export { default as SimulateNarrative } from './SimulateNarrative';

// Re-export types and functions
export type { MonteCarloResult, LeverState, SimulationConfig, SingleSimulationResult } from '@/logic/monteCarloEngine';
export { runSingleSimulation, processSimulationResults } from '@/logic/monteCarloEngine';
export type { Verdict, Recommendation } from '@/logic/verdictGenerator';

