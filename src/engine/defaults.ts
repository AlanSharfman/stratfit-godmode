import type { Inputs, Levers } from "./types";

export const DEFAULT_INPUTS: Inputs = {
  revenueAnnual: 2_800_000,
  grossMarginPct: 0.72,
  opexAnnual: 2_200_000,
  cashOnHand: 1_500_000,
  revenueMultiple: 6.0,
};

export const DEFAULT_LEVERS: Levers = {
  demandStrength: 0.50,
  pricingPower: 0.50,
  expansionVelocity: 0.50,

  costDiscipline: 0.50,
  hiringIntensity: 0.50,
  operatingDrag: 0.50,

  marketVolatility: 0.50,
  executionRisk: 0.50,
};
