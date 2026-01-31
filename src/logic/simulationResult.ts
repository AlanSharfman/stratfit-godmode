// src/logic/simulationResult.ts
// STRATFIT — Canonical SimulationResult adapters

import type { MonteCarloResult } from "@/logic/monteCarloEngine";
import type { Verdict } from "@/logic/verdictGenerator";
import type { SimulationSnapshot } from "@/state/scenarioStore";
import type { SavedSimulation } from "@/state/savedSimulationsStore";
import type { SimulationResult } from "@/types/simulationResult";

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const clamp100 = (n: number) => Math.max(0, Math.min(100, n));

function confidenceToScore(level: Verdict["confidenceLevel"]): number {
  switch (level) {
    case "HIGH":
      return 85;
    case "MEDIUM":
      return 60;
    case "LOW":
      return 35;
  }
}

export function simulationResultFromMonteCarlo(result: MonteCarloResult, verdict: Verdict): SimulationResult {
  const sensitivities: Record<string, number> = {};
  const drivers: Record<string, number> = {};

  for (const f of result.sensitivityFactors ?? []) {
    const signed = (f.direction === "negative" ? -1 : 1) * Math.abs(f.impact);
    sensitivities[f.lever] = signed;

    // Also keep a human-readable driver map (label → signed impact)
    // (top drivers are meant for UI; impacts stay numeric + consistent)
    drivers[f.label] = signed;
  }

  return {
    survivalProbability: clamp01(result.survivalRate),
    expectedRunwayMonths: Number.isFinite(result.runwayPercentiles?.p50) ? result.runwayPercentiles.p50 : 0,
    expectedValue: Number.isFinite(result.arrPercentiles?.p50) ? result.arrPercentiles.p50 : 0,
    // Canonical risk: invert the engine's composite score so "higher risk" means worse.
    riskScore: clamp100(100 - (verdict.overallScore ?? 0)),
    confidenceScore: confidenceToScore(verdict.confidenceLevel),
    // Canonical distribution: survival curve over time (0..1)
    distribution: Array.isArray(result.survivalByMonth) ? result.survivalByMonth : [],
    sensitivities,
    // Canonical drivers: same numbers as sensitivities but keyed by label for narratives
    drivers,
  };
}

export function simulationResultFromSnapshot(s: SimulationSnapshot): SimulationResult {
  const sensitivities: Record<string, number> = {};
  for (const f of s.leverSensitivity ?? []) {
    sensitivities[f.lever] = f.impact;
  }

  return {
    survivalProbability: clamp01(s.survivalRate),
    expectedRunwayMonths: Number.isFinite(s.runwayP50) ? s.runwayP50 : 0,
    expectedValue: Number.isFinite(s.arrP50) ? s.arrP50 : 0,
    riskScore: clamp100(100 - (s.overallScore ?? 0)),
    confidenceScore: 60, // Snapshots don't currently persist confidence; default MEDIUM.
    distribution: Array.isArray(s.monthlySurvival) ? s.monthlySurvival : [],
    sensitivities,
    drivers: {},
  };
}

export function simulationResultFromSavedSimulation(sim: SavedSimulation): SimulationResult {
  return {
    survivalProbability: clamp01(sim.summary.survivalRate),
    expectedRunwayMonths: Number.isFinite(sim.summary.runwayMedian) ? sim.summary.runwayMedian : 0,
    expectedValue: Number.isFinite(sim.summary.arrMedian) ? sim.summary.arrMedian : 0,
    riskScore: clamp100(100 - (sim.summary.overallScore ?? 0)),
    confidenceScore: 60,
    distribution: Array.isArray(sim.monthlySurvival) ? sim.monthlySurvival : [],
    sensitivities: {},
    drivers: {},
  };
}


