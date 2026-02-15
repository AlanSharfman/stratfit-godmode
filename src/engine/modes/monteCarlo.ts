import seedrandom from "seedrandom";
import { SimulationInputs, Levers, SimulationResult } from "../SimulationEngine";
import { runDeterministicProjection } from "./deterministicProjection";

export function runMonteCarlo(
  inputs: SimulationInputs,
  levers: Levers,
  seed: number
): SimulationResult {

  const rng = seedrandom(seed.toString());

  const simulations = 1000;
  let survivalSum = 0;

  for (let i = 0; i < simulations; i++) {
    const shock = 1 + (rng() - 0.5) * 0.2;

    const shockedInputs = {
      ...inputs,
      growthRate: inputs.growthRate * shock,
    };

    const result = runDeterministicProjection(shockedInputs, levers);

    survivalSum += result.survivalProbability;
  }

  const avgSurvival = survivalSum / simulations;

  const base = runDeterministicProjection(inputs, levers);

  return {
    ...base,
    survivalProbability: avgSurvival,
  };
}


