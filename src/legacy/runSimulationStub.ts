// LEGACY FILE — NOT IN ACTIVE PATH
import { BaselineInputs } from "@/pages/initialize/initialize.types";

export interface SimulationResult {
  projectedRevenue: number;
  runwayMonths: number;
  riskScore: number;
  valuation: number;
}

export function runSimulation(inputs: BaselineInputs): SimulationResult {
  const growthFactor = inputs.growthRate / 100;
  const burnMonthly = inputs.burnRate;
  const runway = inputs.cash / (burnMonthly || 1);

  const projectedRevenue =
    inputs.revenue * Math.pow(1 + growthFactor, inputs.timeHorizonMonths / 12);

  const riskScore =
    (burnMonthly / (inputs.revenue || 1)) * 50 +
    (inputs.debt / (inputs.cash || 1)) * 50;

  const valuation = projectedRevenue * (inputs.grossMargin / 100) * 4;

  return {
    projectedRevenue,
    runwayMonths: runway,
    riskScore,
    valuation,
  };
}
