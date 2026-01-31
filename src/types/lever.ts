// src/types/lever.ts
// Canonical LeverState for STRATFIT.
// Single source of truth for engine + stores + UI.

export interface LeverState {
  demandStrength: number;
  pricingPower: number;
  expansionVelocity: number;
  costDiscipline: number;
  hiringIntensity: number;
  operatingDrag: number;
  marketVolatility: number;
  executionRisk: number;
  fundingPressure: number;
}


