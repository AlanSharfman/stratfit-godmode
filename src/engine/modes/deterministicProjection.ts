import { SimulationInputs, Levers, SimulationResult } from "../SimulationEngine";

export function runDeterministicProjection(
  inputs: SimulationInputs,
  levers: Levers
): SimulationResult {

  const adjustedGrowth =
    inputs.growthRate * (1 + levers.pricingPower * 0.1);

  const projectedARR = inputs.startingARR * (1 + adjustedGrowth);

  const adjustedBurn =
    inputs.monthlyBurn * (1 - levers.costDiscipline * 0.1);

  const runwayMonths =
    inputs.startingCash / adjustedBurn;

  const survivalProbability =
    runwayMonths > 18 ? 0.9 : runwayMonths > 9 ? 0.6 : 0.3;

  const enterpriseValue = projectedARR * 5;

  const riskIndex = 1 - survivalProbability;

  return {
    survivalProbability,
    runwayMonths,
    projectedARR,
    enterpriseValue,
    riskIndex,
  };
}


