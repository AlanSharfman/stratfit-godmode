// src/logic/calculateMetrics.ts
// Pure function to calculate metrics based on scenario state and levers

import type { LeverState } from "@/types/lever";

export interface MetricsResult {
  runway: number;
  cashPosition: number;
  momentum: number;
  burnQuality: number;
  riskIndex: number;
  earningsPower: number;
  enterpriseValue: number;
}

export type ScenarioId = "base" | "upside" | "downside" | "stress";

export function calculateMetrics(levers: LeverState, scenario: ScenarioId): MetricsResult {
  const mult = scenario === "upside" ? 1.15 : scenario === "downside" ? 0.85 : scenario === "stress" ? 0.70 : 1;

  // Growth factors
  const demand = levers.demandStrength / 100;
  const pricing = levers.pricingPower / 100;
  const expansion = levers.expansionVelocity / 100;

  // Efficiency factors
  const cost = levers.costDiscipline / 100;
  const hiring = levers.hiringIntensity / 100;
  const drag = levers.operatingDrag / 100;

  // Risk factors
  const volatility = levers.marketVolatility / 100;
  const execRisk = levers.executionRisk / 100;
  const funding = levers.fundingPressure / 100;

  // Calculate KPI values
  const runway = Math.round(Math.max(3, (18 + cost * 12 - hiring * 8 - funding * 10) * mult));
  const cashPosition = Math.max(0.5, (3.2 + pricing * 1.5 - drag * 1.2 + cost * 0.8) * mult);
  const momentum = Math.round((demand * 40 + expansion * 30 + pricing * 20) * mult);
  const burnQuality = Math.round((cost * 35 + (1 - hiring) * 25 + (1 - drag) * 20) * mult);
  const riskIndex = Math.round((volatility * 30 + execRisk * 35 + funding * 25) * (2 - mult));
  const earningsPower = Math.round((demand * 25 + pricing * 30 + cost * 25) * mult);
  const enterpriseValue = Math.max(5, (demand * 40 + pricing * 30 + expansion * 20 - volatility * 15) * mult);
  
  // DEBUG: Log risk calculation

  return { runway, cashPosition, momentum, burnQuality, riskIndex, earningsPower, enterpriseValue };
}