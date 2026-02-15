import { SimulationInputs, Levers, SimulationResult } from "../SimulationEngine";
import { runDeterministicProjection } from "./deterministicProjection";

export function computeSensitivity(
  inputs: SimulationInputs,
  levers: Levers
): SimulationResult {

  const base = runDeterministicProjection(inputs, levers);

  const delta = 0.05;

  const modified = {
    ...levers,
    pricingPower: levers.pricingPower + delta,
  };

  const shifted = runDeterministicProjection(inputs, modified);

  return {
    ...base,
    riskIndex: base.riskIndex - shifted.riskIndex
  };
}


