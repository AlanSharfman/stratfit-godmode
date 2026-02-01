// src/engine/SimulationEngine.ts

import { runDeterministicProjection } from "./modes/deterministicProjection";
import { runMonteCarlo } from "./modes/monteCarlo";
import { runStressCase } from "./modes/stress";
import { computeSensitivity } from "./modes/sensitivity";

export type EngineMode =
  | "deterministic"
  | "stress"
  | "sensitivity"
  | "montecarlo";

export interface SimulationInputs {
  startingARR: number;
  startingCash: number;
  monthlyBurn: number;
  growthRate: number;
  // extend later
}

export interface Levers {
  pricingPower: number;
  hiringIntensity: number;
  expansionRate: number;
  costDiscipline: number;
  // extend later
}

export interface SimulationResult {
  survivalProbability: number;
  runwayMonths: number;
  projectedARR: number;
  enterpriseValue: number;
  riskIndex: number;
}

export interface SimulationMeta {
  engineMode: EngineMode;
  modelVersion: string;
  seed?: number;
  executionTimeMs: number;
  timestamp: string;
}

export interface SimulationRequest {
  engineMode: EngineMode;
  modelVersion: string;
  seed?: number;
  inputs: SimulationInputs;
  levers: Levers;
}

export interface SimulationResponse {
  result: SimulationResult;
  meta: SimulationMeta;
}

export class SimulationEngine {
  static run(request: SimulationRequest): SimulationResponse {
    const start = performance.now();

    let result: SimulationResult;

    switch (request.engineMode) {
      case "deterministic":
        result = runDeterministicProjection(request.inputs, request.levers);
        break;

      case "stress":
        result = runStressCase(request.inputs, request.levers);
        break;

      case "sensitivity":
        result = computeSensitivity(request.inputs, request.levers);
        break;

      case "montecarlo":
        if (request.seed === undefined) {
          throw new Error("Monte Carlo mode requires a seed.");
        }
        result = runMonteCarlo(request.inputs, request.levers, request.seed);
        break;

      default:
        throw new Error("Invalid engine mode");
    }

    const end = performance.now();

    return {
      result,
      meta: {
        engineMode: request.engineMode,
        modelVersion: request.modelVersion,
        seed: request.seed,
        executionTimeMs: end - start,
        timestamp: new Date().toISOString(),
      },
    };
  }
}


