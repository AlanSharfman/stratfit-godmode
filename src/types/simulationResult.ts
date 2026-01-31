// src/types/simulationResult.ts
// STRATFIT — Canonical Simulation Result Model (single source of truth)

export interface SimulationResult {
  survivalProbability: number;
  expectedRunwayMonths: number;
  expectedValue: number;
  riskScore: number;
  confidenceScore: number;
  distribution: number[];
  sensitivities: Record<string, number>;
  drivers: Record<string, number>;
}


