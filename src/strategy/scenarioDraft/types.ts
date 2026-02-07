// src/strategy/scenarioDraft/types.ts
// Strategy Studio — Scenario Drafting (v1). Non-destructive: baseline immutable.

export interface ScenarioDraftLeversV1 {
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

export interface ScenarioDraftV1 {
  id: string;
  name: string;
  createdAtISO: string;
  updatedAtISO: string;
  derivedFromBaselineVersion: number;
  levers: ScenarioDraftLeversV1;
}


