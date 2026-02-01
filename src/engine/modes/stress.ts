import { SimulationInputs, Levers, SimulationResult } from "../SimulationEngine";
import { runDeterministicProjection } from "./deterministicProjection";

export type StressType =
  | "demandShock"
  | "capitalFreeze"
  | "costSpike";

export function runStressCase(
  inputs: SimulationInputs,
  levers: Levers,
  stressType: StressType = "demandShock"
): SimulationResult {

  let stressedInputs = { ...inputs };
  let stressedLevers = { ...levers };

  switch (stressType) {
    case "demandShock":
      stressedInputs.growthRate *= 0.5;
      break;
    case "capitalFreeze":
      stressedInputs.startingCash *= 0.7;
      break;
    case "costSpike":
      stressedInputs.monthlyBurn *= 1.3;
      break;
  }

  return runDeterministicProjection(stressedInputs, stressedLevers);
}


